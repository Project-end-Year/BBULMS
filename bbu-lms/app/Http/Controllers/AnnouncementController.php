<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\ApiResponse;
use App\Models\Announcement;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AnnouncementController extends Controller
{
    private const SCOPES = ['course', 'department', 'university'];

    /**
     * List all announcements relevant to the authenticated user.
     */
    public function feed(Request $request)
    {
        $user = $this->requireUser();

        $scopeFilter = $request->input('scope');
        $query = Announcement::query()
            ->with(['poster', 'course', 'department'])
            ->where('is_active', true)
            ->where('is_published', true);

        if ($scopeFilter && in_array($scopeFilter, self::SCOPES, true)) {
            $query->where('scope', $scopeFilter);
        }

        $query->where(function ($q) use ($user) {
            // University-wide announcements are visible to all authenticated users.
            $q->where('scope', 'university');

            // Department-wide announcements for the user's department.
            $departmentId = $this->userDepartmentId($user);
            if ($departmentId) {
                $q->orWhere(function ($deptQ) use ($departmentId) {
                    $deptQ->where('scope', 'department')->where('department_id', $departmentId);
                });
            }

            // Course-level announcements for courses the user teaches or is enrolled in.
            $courseIds = $this->accessibleCourseIds($user);
            if (! empty($courseIds)) {
                $q->orWhere(function ($courseQ) use ($courseIds) {
                    $courseQ->where('scope', 'course')->whereIn('course_id', $courseIds);
                });
            }
        });

        $announcements = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'announcements' => AnnouncementResource::collection($announcements),
        ]);
    }

    /**
     * List announcements for a course.
     */
    public function index(Course $course)
    {
        Gate::authorize('view', $course);

        $user = Auth::user();
        $isManager = $user instanceof User && $this->canManageCourse($user, $course);

        $query = $course->announcements()
            ->with(['poster', 'department'])
            ->where('is_active', true)
            ->where('scope', 'course');

        if (! $isManager) {
            $query->where('is_published', true);
        }

        $announcements = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'announcements' => AnnouncementResource::collection($announcements),
        ]);
    }

    /**
     * Store a new announcement.
     */
    public function store(Request $request, Course $course)
    {
        $user = $this->requireUser();

        if (! $this->canManageCourse($user, $course)) {
            abort(403, 'Only administrators or the assigned lecturer can post announcements.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'scope' => ['required', 'string', Rule::in(self::SCOPES)],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'isPinned' => ['nullable', 'boolean'],
            'isPublished' => ['nullable', 'boolean'],
        ]);

        $scope = $validated['scope'];
        $this->validateScope($user, $scope, $validated['departmentId'] ?? null, $course);

        $isPublished = $validated['isPublished'] ?? true;

        $announcement = Announcement::create([
            'course_id' => $scope === 'course' ? $course->id : null,
            'scope' => $scope,
            'department_id' => $scope === 'department' ? $validated['departmentId'] : null,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'posted_by' => $user->id,
            'is_pinned' => $validated['isPinned'] ?? false,
            'is_published' => $isPublished,
            'published_at' => $isPublished ? now() : null,
            'is_active' => true,
        ]);

        // Ensure course_id is nullable in storage for non-course scopes.
        if ($scope !== 'course' && $announcement->course_id !== null) {
            $announcement->update(['course_id' => null]);
        }

        if ($announcement->is_published) {
            $announcement->load(['course', 'department']);
            NotificationService::fromAnnouncement($announcement);
        }

        return ApiResponse::success(
            new AnnouncementResource($announcement->load(['poster', 'course', 'department'])),
            'Announcement created successfully.',
            201
        );
    }

    /**
     * Update an announcement.
     */
    public function update(Request $request, Course $course, Announcement $announcement)
    {
        $user = $this->requireUser();

        if (! $this->canManageCourse($user, $course)) {
            abort(403, 'Only administrators or the assigned lecturer can update announcements.');
        }

        if ($announcement->course_id !== $course->id) {
            abort(404, 'Announcement not found for this course.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'scope' => ['required', 'string', Rule::in(self::SCOPES)],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'isPinned' => ['nullable', 'boolean'],
            'isPublished' => ['nullable', 'boolean'],
        ]);

        $scope = $validated['scope'];
        $this->validateScope($user, $scope, $validated['departmentId'] ?? null, $course);

        $wasPublished = $announcement->is_published;
        $isPublished = $validated['isPublished'] ?? $wasPublished;

        $announcement->update([
            'course_id' => $scope === 'course' ? $course->id : null,
            'scope' => $scope,
            'department_id' => $scope === 'department' ? $validated['departmentId'] : null,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'is_pinned' => $validated['isPinned'] ?? $announcement->is_pinned,
            'is_published' => $isPublished,
            'published_at' => $isPublished && ! $wasPublished ? now() : $announcement->published_at,
        ]);

        if ($isPublished && ! $wasPublished) {
            $announcement->load(['course', 'department']);
            NotificationService::fromAnnouncement($announcement);
        }

        return ApiResponse::success(
            new AnnouncementResource($announcement->load(['poster', 'course', 'department'])),
            'Announcement updated successfully.'
        );
    }

    /**
     * Toggle an announcement's active status.
     */
    public function destroy(Course $course, Announcement $announcement)
    {
        $user = $this->requireUser();

        if (! $this->canManageCourse($user, $course)) {
            abort(403, 'Only administrators or the assigned lecturer can remove announcements.');
        }

        if ($announcement->course_id !== $course->id) {
            abort(404, 'Announcement not found for this course.');
        }

        $announcement->update(['is_active' => ! $announcement->is_active]);

        $status = $announcement->is_active ? 'activated' : 'deactivated';

        return ApiResponse::success(
            new AnnouncementResource($announcement->load(['poster', 'course', 'department'])),
            "Announcement {$status} successfully."
        );
    }

    /**
     * Validate scope permissions and required fields.
     */
    private function validateScope(User $user, string $scope, ?int $departmentId, Course $course): void
    {
        if ($scope === 'university') {
            if (! $user->hasRole('admin')) {
                abort(403, 'Only administrators can post university-wide announcements.');
            }

            return;
        }

        if ($scope === 'department') {
            if (! $departmentId) {
                throw ValidationException::withMessages([
                    'departmentId' => ['A department is required for department-wide announcements.'],
                ]);
            }

            if (! $user->hasRole('admin')) {
                $userDepartmentId = $this->userDepartmentId($user);
                if ($userDepartmentId !== $departmentId) {
                    abort(403, 'You can only post announcements for your own department.');
                }
            }

            return;
        }

        // course scope: already checked by canManageCourse
    }

    /**
     * Determine whether the user can manage a course's announcements.
     */
    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $course->offerings()->where('lecturer_id', $user->id)->exists();
    }

    /**
     * Get the user's department ID from their profile.
     */
    private function userDepartmentId(User $user): ?int
    {
        if ($user->studentProfile) {
            return $user->studentProfile->department_id;
        }

        if ($user->lecturerProfile) {
            return $user->lecturerProfile->department_id;
        }

        return $user->department_id;
    }

    /**
     * Get course IDs the user can access (teaches or enrolled in).
     */
    private function accessibleCourseIds(User $user): array
    {
        if ($user->hasRole('admin')) {
            return Course::pluck('id')->toArray();
        }

        $ids = collect();

        if ($user->hasRole('lecturer')) {
            $ids = $ids->merge($user->taughtOfferings()->pluck('course_id'));
        }

        if ($user->hasRole('student')) {
            $enrolledOfferingIds = $user->enrollments()
                ->where('status', 'enrolled')
                ->pluck('course_offering_id');
            $ids = $ids->merge(CourseOffering::whereIn('id', $enrolledOfferingIds)->pluck('course_id'));
        }

        return $ids->filter()->unique()->values()->toArray();
    }

    /**
     * Require an authenticated user.
     */
    private function requireUser(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'user' => ['No authenticated user.'],
            ]);
        }

        return $user;
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\ApiResponse;
use App\Models\Announcement;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class AnnouncementController extends Controller
{
    /**
     * List announcements for a course.
     */
    public function index(Course $course)
    {
        Gate::authorize('view', $course);

        $user = Auth::user();
        $isManager = $user instanceof User && $this->canManageCourse($user, $course);

        $query = $course->announcements()
            ->with('poster')
            ->where('is_active', true);

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
            'isPinned' => ['nullable', 'boolean'],
            'isPublished' => ['nullable', 'boolean'],
        ]);

        $isPublished = $validated['isPublished'] ?? true;

        $announcement = $course->announcements()->create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'posted_by' => $user->id,
            'is_pinned' => $validated['isPinned'] ?? false,
            'is_published' => $isPublished,
            'published_at' => $isPublished ? now() : null,
            'is_active' => true,
        ]);

        return ApiResponse::success(
            new AnnouncementResource($announcement->load('poster')),
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
            'isPinned' => ['nullable', 'boolean'],
            'isPublished' => ['nullable', 'boolean'],
        ]);

        $wasPublished = $announcement->is_published;
        $isPublished = $validated['isPublished'] ?? $wasPublished;

        $announcement->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'is_pinned' => $validated['isPinned'] ?? $announcement->is_pinned,
            'is_published' => $isPublished,
            'published_at' => $isPublished && ! $wasPublished ? now() : $announcement->published_at,
        ]);

        return ApiResponse::success(
            new AnnouncementResource($announcement->load('poster')),
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
            new AnnouncementResource($announcement->load('poster')),
            "Announcement {$status} successfully."
        );
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

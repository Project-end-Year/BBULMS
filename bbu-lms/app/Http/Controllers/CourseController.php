<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\CourseOfferingSummaryResource;
use App\Http\Resources\CourseResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\ProgramResource;
use App\Http\Resources\SemesterResource;
use App\Http\Resources\UserResource;
use App\Models\Course;
use App\Models\Department;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    /**
     * List courses with role-based visibility.
     */
    public function index(Request $request)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'programId' => ['nullable', 'integer', 'exists:programs,id'],
            'isActive' => ['nullable', 'boolean'],
            'sortBy' => ['nullable', 'string', 'in:name,code,created_at'],
            'sortDir' => ['nullable', 'string', 'in:asc,desc'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $user = $this->requireUser();

        $query = Course::with(['department', 'program'])
            ->withCount(['offerings' => function ($q) {
                $q->where('is_active', true);
            }]);

        $query = $this->scopeByRole($query, $user);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('departmentId')) {
            $query->where('department_id', $request->input('departmentId'));
        }

        if ($request->filled('programId')) {
            $query->where('program_id', $request->input('programId'));
        }

        if ($request->filled('isActive')) {
            $query->where('is_active', $request->boolean('isActive'));
        }

        $sortBy = $request->input('sortBy', 'created_at');
        $sortDir = $request->input('sortDir', 'desc');
        $allowedSortBy = ['name', 'code', 'created_at'];

        if (! in_array($sortBy, $allowedSortBy)) {
            $sortBy = 'created_at';
        }

        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('perPage', 15);

        $courses = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'courses' => CourseResource::collection($courses),
            'pagination' => [
                'currentPage' => $courses->currentPage(),
                'lastPage' => $courses->lastPage(),
                'perPage' => $courses->perPage(),
                'total' => $courses->total(),
                'from' => $courses->firstItem(),
                'to' => $courses->lastItem(),
            ],
        ]);
    }

    /**
     * Show a single course if the user can access it.
     */
    public function show(Course $course)
    {
        $user = $this->requireUser();

        if (! $this->canAccessCourse($user, $course)) {
            throw ValidationException::withMessages([
                'course' => ['You do not have access to this course.'],
            ]);
        }

        $course->load(['department', 'program', 'offerings.semester', 'offerings.lecturer']);

        return ApiResponse::success(new CourseResource($course));
    }

    /**
     * Return a course summary for the authenticated user.
     *
     * This endpoint is available to admins, the course lecturer, or enrolled students.
     */
    public function summary(Course $course)
    {
        $user = $this->requireUser();

        if (! $this->canAccessCourse($user, $course)) {
            abort(403, 'You do not have access to this course.');
        }

        $course->load(['department', 'program']);

        $offerings = $course->offerings()
            ->with(['semester', 'lecturer'])
            ->where('is_active', true)
            ->get();

        return ApiResponse::success([
            'course' => new CourseResource($course),
            'offerings' => CourseOfferingSummaryResource::collection($offerings),
            'context' => $this->summaryContext($user, $course, $offerings),
        ]);
    }

    /**
     * Build role context for the course summary.
     */
    private function summaryContext(User $user, Course $course, $offerings): array
    {
        if ($user->hasRole('admin')) {
            return ['role' => 'admin'];
        }

        if ($user->hasRole('lecturer')) {
            $offering = $offerings->firstWhere('lecturer_id', $user->id);

            return [
                'role' => 'lecturer',
                'offeringId' => $offering?->id,
            ];
        }

        if ($user->hasRole('student')) {
            $offering = $offerings->first(function ($offering) use ($user) {
                return $offering->enrollments()
                    ->where('student_id', $user->id)
                    ->where('status', 'enrolled')
                    ->exists();
            });

            return [
                'role' => 'student',
                'offeringId' => $offering?->id,
            ];
        }

        return ['role' => 'none'];
    }

    /**
     * Create a new course catalog entry.
     */
    public function store(Request $request)
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:courses,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'credits' => ['required', 'integer', 'min:0', 'max:20'],
            'departmentId' => ['nullable', 'exists:departments,id'],
            'programId' => ['nullable', 'exists:programs,id'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $course = Course::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'credits' => $validated['credits'],
            'department_id' => $validated['departmentId'] ?? null,
            'program_id' => $validated['programId'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return ApiResponse::success(
            new CourseResource($course->load('department', 'program')),
            'Course created successfully.',
            201
        );
    }

    /**
     * Update a course catalog entry.
     */
    public function update(Request $request, Course $course)
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('courses', 'code')->ignore($course->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'credits' => ['required', 'integer', 'min:0', 'max:20'],
            'departmentId' => ['nullable', 'exists:departments,id'],
            'programId' => ['nullable', 'exists:programs,id'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $course->update([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'credits' => $validated['credits'],
            'department_id' => $validated['departmentId'] ?? null,
            'program_id' => $validated['programId'] ?? null,
            'is_active' => $validated['isActive'] ?? $course->is_active,
        ]);

        return ApiResponse::success(
            new CourseResource($course->load('department', 'program')),
            'Course updated successfully.'
        );
    }

    /**
     * Toggle a course's active status.
     */
    public function destroy(Course $course)
    {
        $this->requireAdmin();

        $course->update(['is_active' => ! $course->is_active]);

        $status = $course->is_active ? 'activated' : 'deactivated';

        return ApiResponse::success(
            new CourseResource($course->load('department', 'program')),
            "Course {$status} successfully."
        );
    }

    /**
     * Return metadata for the course form.
     */
    public function formMeta()
    {
        $this->requireAdmin();

        return ApiResponse::success([
            'departments' => DepartmentResource::collection(Department::where('is_active', true)->orderBy('name')->get()),
            'programs' => ProgramResource::collection(Program::where('is_active', true)->with('department')->orderBy('name')->get()),
            'semesters' => SemesterResource::collection(Semester::where('is_active', true)->orderBy('start_date', 'desc')->get()),
            'lecturers' => UserResource::collection(
                User::role('lecturer')->where('is_active', true)->orderBy('name')->get()
            ),
        ]);
    }

    /**
     * Scope the query based on the authenticated user's role.
     */
    private function scopeByRole($query, User $user)
    {
        if ($user->hasRole('admin')) {
            return $query;
        }

        if ($user->hasRole('lecturer')) {
            return $query->whereHas('offerings', function ($q) use ($user) {
                $q->where('lecturer_id', $user->id);
            });
        }

        if ($user->hasRole('student')) {
            return $query->whereHas('offerings.enrollments', function ($q) use ($user) {
                $q->where('student_id', $user->id)->where('status', 'enrolled');
            });
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * Determine whether the user can view a single course.
     */
    private function canAccessCourse(User $user, Course $course): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer')) {
            return $course->offerings()->where('lecturer_id', $user->id)->exists();
        }

        if ($user->hasRole('student')) {
            return $course->offerings()->whereHas('enrollments', function ($q) use ($user) {
                $q->where('student_id', $user->id)->where('status', 'enrolled');
            })->exists();
        }

        return false;
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

    /**
     * Require an admin user.
     */
    private function requireAdmin(): User
    {
        $user = $this->requireUser();

        if (! $user->hasRole('admin')) {
            abort(403, 'Only administrators can manage courses.');
        }

        return $user;
    }
}

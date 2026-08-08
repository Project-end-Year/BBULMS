<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\CourseOfferingResource;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CourseOfferingController extends Controller
{
    /**
     * Return course offerings visible to the authenticated user.
     */
    public function myCourses(Request $request)
    {
        $request->validate([
            'semesterId' => ['nullable', 'integer', 'exists:semesters,id'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $user = $this->requireUser();

        $query = CourseOffering::with(['course.department', 'semester', 'lecturer', 'enrollments.student'])
            ->where('is_active', true)
            ->withCount('enrollments');

        if ($user->hasRole('admin')) {
            // Admin sees all active offerings.
        } elseif ($user->hasRole('lecturer')) {
            $query->where('lecturer_id', $user->id);
        } elseif ($user->hasRole('student')) {
            $query->whereHas('enrollments', function ($q) use ($user) {
                $q->where('student_id', $user->id)->where('status', 'enrolled');
            });
        } else {
            return ApiResponse::success([
                'offerings' => [],
                'pagination' => [
                    'currentPage' => 1,
                    'lastPage' => 1,
                    'perPage' => 15,
                    'total' => 0,
                    'from' => null,
                    'to' => null,
                ],
            ]);
        }

        if ($request->filled('semesterId')) {
            $query->where('semester_id', $request->input('semesterId'));
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->input('perPage', 15);

        $offerings = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'offerings' => CourseOfferingResource::collection($offerings),
            'pagination' => [
                'currentPage' => $offerings->currentPage(),
                'lastPage' => $offerings->lastPage(),
                'perPage' => $offerings->perPage(),
                'total' => $offerings->total(),
                'from' => $offerings->firstItem(),
                'to' => $offerings->lastItem(),
            ],
        ]);
    }

    /**
     * Create a course offering (admin only).
     */
    public function store(Request $request)
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'courseId' => ['required', 'exists:courses,id'],
            'semesterId' => ['required', 'exists:semesters,id'],
            'lecturerId' => ['nullable', 'exists:users,id'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'section' => ['nullable', 'string', 'max:10'],
            'room' => ['nullable', 'string', 'max:50'],
            'schedule' => ['nullable', 'array'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $offering = CourseOffering::create([
            'course_id' => $validated['courseId'],
            'semester_id' => $validated['semesterId'],
            'lecturer_id' => $validated['lecturerId'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'section' => $validated['section'] ?? null,
            'room' => $validated['room'] ?? null,
            'schedule' => $validated['schedule'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return ApiResponse::success(
            new CourseOfferingResource($offering->load(['course', 'semester', 'lecturer'])),
            'Course offering created successfully.',
            201
        );
    }

    /**
     * Update a course offering (admin only).
     */
    public function update(Request $request, CourseOffering $offering)
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'courseId' => ['required', 'exists:courses,id'],
            'semesterId' => ['required', 'exists:semesters,id'],
            'lecturerId' => ['nullable', 'exists:users,id'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'section' => ['nullable', 'string', 'max:10'],
            'room' => ['nullable', 'string', 'max:50'],
            'schedule' => ['nullable', 'array'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $offering->update([
            'course_id' => $validated['courseId'],
            'semester_id' => $validated['semesterId'],
            'lecturer_id' => $validated['lecturerId'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'section' => $validated['section'] ?? null,
            'room' => $validated['room'] ?? null,
            'schedule' => $validated['schedule'] ?? null,
            'is_active' => $validated['isActive'] ?? $offering->is_active,
        ]);

        return ApiResponse::success(
            new CourseOfferingResource($offering->load(['course', 'semester', 'lecturer'])),
            'Course offering updated successfully.'
        );
    }

    /**
     * Toggle a course offering's active status (admin only).
     */
    public function destroy(CourseOffering $offering)
    {
        $this->requireAdmin();

        $offering->update(['is_active' => ! $offering->is_active]);

        $status = $offering->is_active ? 'activated' : 'deactivated';

        return ApiResponse::success(
            new CourseOfferingResource($offering->load(['course', 'semester', 'lecturer'])),
            "Course offering {$status} successfully."
        );
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
            abort(403, 'Only administrators can manage course offerings.');
        }

        return $user;
    }
}

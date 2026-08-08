<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\EnrollmentResource;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class EnrollmentController extends Controller
{
    /**
     * List enrolled students for an offering.
     */
    public function index(CourseOffering $offering)
    {
        $user = $this->requireUser();

        if (! $this->canManageOffering($user, $offering)) {
            abort(403, 'You do not have permission to manage this offering.');
        }

        $enrollments = $offering->enrollments()
            ->with('student')
            ->where('status', 'enrolled')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return ApiResponse::success([
            'enrollments' => EnrollmentResource::collection($enrollments),
            'capacity' => $offering->capacity,
            'enrolledCount' => $enrollments->count(),
        ]);
    }

    /**
     * Enroll a student in an offering.
     *
     * Admins and the assigned lecturer may enroll any student by ID.
     * Students may self-enroll when no studentId is provided.
     */
    public function store(Request $request, CourseOffering $offering)
    {
        $user = $this->requireUser();

        if (! $offering->is_active) {
            throw ValidationException::withMessages([
                'offering' => ['This course offering is not active.'],
            ]);
        }

        $isManager = $this->canManageOffering($user, $offering);

        if ($request->filled('studentId')) {
            if (! $isManager) {
                abort(403, 'Only administrators or the assigned lecturer may enroll other students.');
            }

            $validated = $request->validate([
                'studentId' => ['required', 'integer', 'exists:users,id'],
            ]);

            $student = User::findOrFail($validated['studentId']);
        } else {
            if (! $user->hasRole('student')) {
                abort(403, 'Only students may self-enroll.');
            }

            $student = $user;
        }

        if (! $student->hasRole('student')) {
            throw ValidationException::withMessages([
                'studentId' => ['The selected user is not a student.'],
            ]);
        }

        if ($offering->capacity !== null && $this->enrolledCount($offering) >= $offering->capacity) {
            throw ValidationException::withMessages([
                'capacity' => ['This course offering is full.'],
            ]);
        }

        $existing = $offering->enrollments()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'studentId' => ['This student is already enrolled in the offering.'],
            ]);
        }

        $enrollment = $offering->enrollments()->create([
            'student_id' => $student->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
            'dropped_at' => null,
            'is_active' => true,
        ]);

        return ApiResponse::success(
            new EnrollmentResource($enrollment->load('student', 'courseOffering')),
            'Student enrolled successfully.',
            201
        );
    }

    /**
     * Drop a student from an offering.
     */
    public function destroy(CourseOffering $offering, User $student)
    {
        $user = $this->requireUser();

        if (! $this->canManageOffering($user, $offering) && $user->id !== $student->id) {
            abort(403, 'You do not have permission to drop this student.');
        }

        $enrollment = $offering->enrollments()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->first();

        if (! $enrollment) {
            abort(404, 'Enrollment not found.');
        }

        $enrollment->update([
            'status' => 'dropped',
            'dropped_at' => now(),
            'is_active' => false,
        ]);

        return ApiResponse::success(
            new EnrollmentResource($enrollment->load('student', 'courseOffering')),
            'Student dropped successfully.'
        );
    }

    /**
     * Count currently enrolled students.
     */
    private function enrolledCount(CourseOffering $offering): int
    {
        return $offering->enrollments()
            ->where('status', 'enrolled')
            ->where('is_active', true)
            ->count();
    }

    /**
     * Determine whether the user can manage the offering's enrollments.
     */
    private function canManageOffering(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
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

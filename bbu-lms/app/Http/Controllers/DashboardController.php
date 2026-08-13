<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use App\Services\LecturerDashboardService;
use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller
{
    public function __construct(
        private StudentDashboardService $studentService,
        private LecturerDashboardService $lecturerService,
    ) {}

    /**
     * Return aggregated dashboard data for the authenticated student.
     */
    public function student(Request $request)
    {
        $user = $this->requireUser();

        if (! $user->hasRole('student')) {
            return ApiResponse::error('Only students can access the student dashboard.', 403);
        }

        $data = $this->studentService->build($user);

        return ApiResponse::success($data);
    }

    /**
     * Return aggregated dashboard data for the authenticated lecturer.
     */
    public function lecturer(Request $request)
    {
        $user = $this->requireUser();

        if (! $user->hasRole('lecturer')) {
            return ApiResponse::error('Only lecturers can access the lecturer dashboard.', 403);
        }

        $data = $this->lecturerService->build($user);

        return ApiResponse::success($data);
    }

    /**
     * Return a lightweight role-aware dashboard summary for any authenticated user.
     */
    public function summary(Request $request)
    {
        $user = $this->requireUser();

        $isStudent = $user->hasRole('student');
        $isLecturer = $user->hasRole('lecturer');

        return ApiResponse::success([
            'isStudent' => $isStudent,
            'isLecturer' => $isLecturer,
            'courseCount' => $isStudent
                ? $user->enrollments()->where('status', 'enrolled')->count()
                : null,
        ]);
    }

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

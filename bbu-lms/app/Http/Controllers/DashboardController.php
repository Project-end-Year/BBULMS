<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use App\Services\StudentDashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller
{
    public function __construct(private StudentDashboardService $service) {}

    /**
     * Return aggregated dashboard data for the authenticated student.
     */
    public function student(Request $request)
    {
        $user = $this->requireUser();

        if (! $user->hasRole('student')) {
            return ApiResponse::error('Only students can access the student dashboard.', 403);
        }

        $data = $this->service->build($user);

        return ApiResponse::success($data);
    }

    /**
     * Return a lightweight role-aware dashboard summary for any authenticated user.
     */
    public function summary(Request $request)
    {
        $user = $this->requireUser();

        $isStudent = $user->hasRole('student');

        return ApiResponse::success([
            'isStudent' => $isStudent,
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

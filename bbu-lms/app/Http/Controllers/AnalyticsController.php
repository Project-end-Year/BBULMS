<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use App\Services\StudentAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AnalyticsController extends Controller
{
    public function __construct(private StudentAnalyticsService $service) {}

    /**
     * Return student performance analytics: grade/attendance trends, assignment
     * completion rate, and at-risk flag.
     */
    public function student(Request $request)
    {
        $user = $this->requireUser();

        if (! $user->hasRole('student')) {
            return ApiResponse::error('Only students can access student analytics.', 403);
        }

        $data = $this->service->build($user);

        return ApiResponse::success($data);
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

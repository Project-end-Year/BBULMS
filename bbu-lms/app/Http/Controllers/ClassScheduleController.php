<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\ClassScheduleResource;
use App\Models\Course;
use Illuminate\Support\Facades\Gate;

class ClassScheduleController extends Controller
{
    /**
     * List class schedules for a course the user can access.
     */
    public function index(Course $course)
    {
        Gate::authorize('view', $course);

        $schedules = $course->offerings()
            ->where('is_active', true)
            ->with(['classSchedules'])
            ->get()
            ->pluck('classSchedules')
            ->flatten()
            ->where('is_active', true)
            ->sortBy(function ($schedule) {
                $dayOrder = ['Mon' => 1, 'Tue' => 2, 'Wed' => 3, 'Thu' => 4, 'Fri' => 5, 'Sat' => 6, 'Sun' => 7];

                return [
                    $dayOrder[$schedule->day_of_week] ?? 8,
                    $schedule->start_time,
                ];
            })
            ->values();

        return ApiResponse::success([
            'classSchedules' => ClassScheduleResource::collection($schedules),
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    /**
     * Build the admin dashboard summary payload.
     *
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        return [
            'counts' => $this->counts(),
            'recentActivity' => $this->recentActivity(),
            'enrollmentOverview' => $this->enrollmentOverview(),
            'systemHealth' => $this->systemHealth(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function counts(): array
    {
        return [
            'users' => [
                'total' => User::count(),
                'students' => User::role('student')->count(),
                'lecturers' => User::role('lecturer')->count(),
                'admins' => User::role('admin')->count(),
                'active' => User::where('is_active', true)->count(),
                'inactive' => User::where('is_active', false)->count(),
            ],
            'courses' => Course::count(),
            'courseOfferings' => CourseOffering::count(),
            'enrollments' => [
                'total' => Enrollment::count(),
                'active' => Enrollment::where('status', 'enrolled')->count(),
                'dropped' => Enrollment::where('status', 'dropped')->count(),
            ],
            'organizations' => [
                'departments' => Department::count(),
                'programs' => Program::count(),
                'semesters' => Semester::count(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function recentActivity(): array
    {
        return [
            'users' => User::orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'name', 'email', 'is_active', 'created_at'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'isActive' => $user->is_active,
                    'createdAt' => $user->created_at?->toIso8601String(),
                ])
                ->toArray(),
            'courses' => Course::with(['department'])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(fn (Course $course) => [
                    'id' => $course->id,
                    'code' => $course->code,
                    'name' => $course->name,
                    'departmentCode' => $course->department?->code,
                    'createdAt' => $course->created_at?->toIso8601String(),
                ])
                ->toArray(),
            'enrollments' => Enrollment::with(['student', 'courseOffering.course'])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->id,
                    'studentName' => $enrollment->student?->name,
                    'courseCode' => $enrollment->courseOffering?->course?->code,
                    'courseName' => $enrollment->courseOffering?->course?->name,
                    'status' => $enrollment->status,
                    'createdAt' => $enrollment->created_at?->toIso8601String(),
                ])
                ->toArray(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function enrollmentOverview(): array
    {
        $from = Carbon::now()->subMonths(5)->startOfMonth();

        return Enrollment::query()
            ->select(
                DB::raw("strftime('%Y-%m', created_at) as month"),
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'enrolled' THEN 1 ELSE 0 END) as active"),
                DB::raw("SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped")
            )
            ->where('created_at', '>=', $from)
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => $row->month,
                'label' => Carbon::parse($row->month.'-01')->format('M Y'),
                'total' => (int) $row->total,
                'active' => (int) $row->active,
                'dropped' => (int) $row->dropped,
            ])
            ->toArray();
    }

    /**
     * @return array<string, mixed>
     */
    private function systemHealth(): array
    {
        $activeSemester = Semester::where('is_active', true)
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now())
            ->first();

        $activeOfferings = $activeSemester
            ? CourseOffering::where('semester_id', $activeSemester->id)->where('is_active', true)->count()
            : 0;

        return [
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'name' => $activeSemester->name,
                'startDate' => $activeSemester->start_date?->toIso8601String(),
                'endDate' => $activeSemester->end_date?->toIso8601String(),
            ] : null,
            'activeOfferingsThisSemester' => $activeOfferings,
            'unassignedLecturers' => User::role('lecturer')
                ->whereDoesntHave('taughtOfferings', fn ($q) => $q->where('is_active', true))
                ->count(),
        ];
    }
}

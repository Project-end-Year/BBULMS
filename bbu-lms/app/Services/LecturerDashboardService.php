<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\ClassSchedule;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\QuizAnswer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class LecturerDashboardService
{
    public function __construct(private GradeCalculator $gradeCalculator) {}

    /**
     * Build the aggregated lecturer dashboard payload.
     *
     * @return array<string, mixed>
     */
    public function build(User $lecturer): array
    {
        $offeringIds = $this->taughtOfferingIds($lecturer);

        if ($offeringIds->isEmpty()) {
            return $this->emptyPayload();
        }

        return [
            'todaysClasses' => $this->todaysClasses($offeringIds),
            'pendingGradingCount' => $this->pendingGradingCount($offeringIds),
            'attendanceStatus' => $this->attendanceStatus($offeringIds),
            'upcomingAssignments' => $this->upcomingAssignments($offeringIds),
            'studentPerformance' => $this->studentPerformance($offeringIds),
        ];
    }

    /**
     * @return Collection<int, int>
     */
    private function taughtOfferingIds(User $lecturer): Collection
    {
        return CourseOffering::query()
            ->where('lecturer_id', $lecturer->id)
            ->where('is_active', true)
            ->pluck('id')
            ->unique()
            ->values();
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     * @return array<int, array<string, mixed>>
     */
    private function todaysClasses(Collection $offeringIds): array
    {
        $todayAbbrev = Carbon::now()->format('D');

        $schedules = ClassSchedule::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('day_of_week', $todayAbbrev)
            ->where('is_active', true)
            ->with(['courseOffering.course'])
            ->orderBy('start_time')
            ->get();

        return $schedules->map(function (ClassSchedule $schedule) {
            $offering = $schedule->courseOffering;
            $course = $offering?->course;

            return [
                'id' => $schedule->id,
                'courseCode' => $course?->code,
                'courseName' => $course?->name,
                'room' => $schedule->room,
                'startTime' => $schedule->start_time,
                'endTime' => $schedule->end_time,
                'type' => $schedule->type,
                'offeringId' => $offering?->id,
            ];
        })->toArray();
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     */
    private function pendingGradingCount(Collection $offeringIds): int
    {
        $ungradedSubmissions = AssignmentSubmission::query()
            ->whereHas('assignment', function ($q) use ($offeringIds) {
                $q->whereIn('course_offering_id', $offeringIds);
            })
            ->where('status', '!=', 'graded')
            ->count();

        $pendingReviews = QuizAnswer::query()
            ->whereHas('attempt.quiz', function ($q) use ($offeringIds) {
                $q->whereIn('course_offering_id', $offeringIds);
            })
            ->where('status', 'pending_review')
            ->count();

        return $ungradedSubmissions + $pendingReviews;
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     * @return array<string, mixed>
     */
    private function attendanceStatus(Collection $offeringIds): array
    {
        $activeSessions = AttendanceSession::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('is_active', true)
            ->with(['courseOffering.course'])
            ->orderByDesc('starts_at')
            ->get();

        $sessionIds = $activeSessions->pluck('id');
        $totalEnrolled = Enrollment::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('status', 'enrolled')
            ->count();

        $presentCount = AttendanceRecord::query()
            ->whereIn('attendance_session_id', $sessionIds)
            ->whereIn('status', ['present', 'late'])
            ->count();

        return [
            'activeSessions' => $activeSessions->map(function (AttendanceSession $session) {
                $offering = $session->courseOffering;
                $course = $offering?->course;

                return [
                    'id' => $session->id,
                    'title' => $session->title,
                    'courseCode' => $course?->code,
                    'courseName' => $course?->name,
                    'startsAt' => $session->starts_at,
                    'endsAt' => $session->ends_at,
                    'offeringId' => $offering?->id,
                ];
            })->toArray(),
            'totalStudents' => $totalEnrolled,
            'checkedInCount' => $presentCount,
        ];
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     * @return array<int, array<string, mixed>>
     */
    private function upcomingAssignments(Collection $offeringIds): array
    {
        $assignments = Assignment::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->whereNotNull('due_at')
            ->where('due_at', '>=', Carbon::now()->startOfDay())
            ->where('due_at', '<=', Carbon::now()->addDays(14))
            ->with(['courseOffering.course'])
            ->withCount('submissions')
            ->orderBy('due_at')
            ->get();

        return $assignments->map(function (Assignment $assignment) {
            $offering = $assignment->courseOffering;
            $course = $offering?->course;

            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'dueAt' => $assignment->due_at,
                'courseCode' => $course?->code,
                'courseName' => $course?->name,
                'submissionCount' => $assignment->submissions_count,
                'offeringId' => $offering?->id,
            ];
        })->toArray();
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     * @return array<string, mixed>
     */
    private function studentPerformance(Collection $offeringIds): array
    {
        $enrollments = Enrollment::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('status', 'enrolled')
            ->with(['student', 'courseOffering.course'])
            ->get();

        $lowPerformers = [];
        $courseAverages = [];

        foreach ($offeringIds as $offeringId) {
            $offeringEnrollments = $enrollments->where('course_offering_id', $offeringId);
            $percentages = [];

            foreach ($offeringEnrollments as $enrollment) {
                $result = $this->gradeCalculator->calculateForStudent(
                    $enrollment->courseOffering,
                    $enrollment->student
                );

                $percentage = $result['overall'];
                if ($percentage !== null) {
                    $percentages[] = $percentage;
                }

                if ($percentage !== null && $percentage < 60) {
                    $course = $enrollment->courseOffering?->course;
                    $lowPerformers[] = [
                        'studentId' => $enrollment->student_id,
                        'studentName' => $enrollment->student->name,
                        'courseCode' => $course?->code,
                        'courseName' => $course?->name,
                        'percentage' => $percentage,
                        'offeringId' => $offeringId,
                    ];
                }
            }

            if (! empty($percentages)) {
                $course = $offeringEnrollments->first()?->courseOffering?->course;
                $courseAverages[] = [
                    'offeringId' => $offeringId,
                    'courseCode' => $course?->code,
                    'courseName' => $course?->name,
                    'averagePercentage' => round(array_sum($percentages) / count($percentages), 2),
                    'studentCount' => count($percentages),
                ];
            }
        }

        return [
            'lowPerformers' => array_slice($lowPerformers, 0, 10),
            'courseAverages' => $courseAverages,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'todaysClasses' => [],
            'pendingGradingCount' => 0,
            'attendanceStatus' => [
                'activeSessions' => [],
                'totalStudents' => 0,
                'checkedInCount' => 0,
            ],
            'upcomingAssignments' => [],
            'studentPerformance' => [
                'lowPerformers' => [],
                'courseAverages' => [],
            ],
        ];
    }
}

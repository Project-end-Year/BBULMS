<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\QuizAttempt;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class StudentAnalyticsService
{
    public function __construct(private GradeCalculator $gradeCalculator) {}

    /**
     * Build the full analytics payload for a student.
     *
     * @return array<string, mixed>
     */
    public function build(User $student): array
    {
        $enrollments = Enrollment::query()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->with(['courseOffering.course', 'courseOffering.semester'])
            ->get();

        if ($enrollments->isEmpty()) {
            return $this->emptyPayload();
        }

        $courseSnapshots = $this->courseSnapshots($enrollments, $student);

        return [
            'gradeTrend' => $this->gradeTrend($courseSnapshots),
            'attendanceTrend' => $this->attendanceTrend($enrollments, $student),
            'assignmentCompletionRate' => $this->assignmentCompletionRate($enrollments, $student),
            'atRiskFlag' => $this->atRiskFlag($courseSnapshots),
            'courseSnapshots' => $courseSnapshots,
        ];
    }

    /**
     * Compute a snapshot of key metrics per enrollment.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     * @return array<int, array<string, mixed>>
     */
    private function courseSnapshots(Collection $enrollments, User $student): array
    {
        $snapshots = [];

        foreach ($enrollments as $enrollment) {
            $offering = $enrollment->courseOffering;
            $course = $offering?->course;
            $semester = $offering?->semester;

            if (! $course || ! $semester) {
                continue;
            }

            $gradeResult = $this->gradeCalculator->calculateForStudent($offering, $student);
            $attendance = $this->attendanceMetrics($offering, $student);
            $completion = $this->courseAssignmentCompletion($offering, $student);

            $snapshots[] = [
                'offeringId' => $offering->id,
                'courseId' => $course->id,
                'courseCode' => $course->code,
                'courseName' => $course->name,
                'semesterId' => $semester->id,
                'semesterName' => $semester->name,
                'overallPercentage' => $gradeResult['overall'],
                'letterGrade' => $gradeResult['letterGrade'],
                'attendanceRate' => $attendance['rate'],
                'presentCount' => $attendance['presentCount'],
                'lateCount' => $attendance['lateCount'],
                'absentCount' => $attendance['absentCount'],
                'totalSessions' => $attendance['totalSessions'],
                'assignmentCompletionRate' => $completion['rate'],
                'completedAssignments' => $completion['completedCount'],
                'totalAssignments' => $completion['totalCount'],
            ];
        }

        return $snapshots;
    }

    /**
     * Build a grade trend keyed by semester, averaging overall percentages.
     *
     * @param  array<int, array<string, mixed>>  $snapshots
     * @return array<int, array<string, mixed>>
     */
    private function gradeTrend(array $snapshots): array
    {
        $grouped = [];

        foreach ($snapshots as $snapshot) {
            if ($snapshot['overallPercentage'] === null) {
                continue;
            }

            $key = $snapshot['semesterId'];

            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'semesterId' => $key,
                    'semesterName' => $snapshot['semesterName'],
                    'total' => 0,
                    'count' => 0,
                ];
            }

            $grouped[$key]['total'] += $snapshot['overallPercentage'];
            $grouped[$key]['count']++;
        }

        $trend = [];
        foreach ($grouped as $item) {
            $trend[] = [
                'semesterId' => $item['semesterId'],
                'semesterName' => $item['semesterName'],
                'averagePercentage' => round($item['total'] / $item['count'], 2),
            ];
        }

        usort($trend, fn ($a, $b) => $a['semesterId'] <=> $b['semesterId']);

        return $trend;
    }

    /**
     * Build an attendance trend keyed by month across all enrollments.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     * @return array<int, array<string, mixed>>
     */
    private function attendanceTrend(Collection $enrollments, User $student): array
    {
        $offeringIds = $enrollments->pluck('course_offering_id')->unique();

        $sessionIds = AttendanceSession::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->pluck('id');

        if ($sessionIds->isEmpty()) {
            return [];
        }

        $records = AttendanceRecord::query()
            ->whereIn('attendance_session_id', $sessionIds)
            ->where('student_id', $student->id)
            ->whereNotNull('checked_in_at')
            ->with('session')
            ->get();

        $grouped = [];
        foreach ($records as $record) {
            $monthKey = $record->session?->starts_at
                ? $record->session->starts_at->format('Y-m')
                : $record->checked_in_at->format('Y-m');

            if (! isset($grouped[$monthKey])) {
                $grouped[$monthKey] = [
                    'month' => $monthKey,
                    'label' => Carbon::parse($monthKey.'-01')->format('M Y'),
                    'present' => 0,
                    'late' => 0,
                    'absent' => 0,
                    'total' => 0,
                ];
            }

            $grouped[$monthKey]['total']++;

            match ($record->status) {
                'present' => $grouped[$monthKey]['present']++,
                'late' => $grouped[$monthKey]['late']++,
                'absent' => $grouped[$monthKey]['absent']++,
                default => null,
            };
        }

        ksort($grouped);

        return array_values(array_map(function (array $item) {
            $attended = $item['present'] + $item['late'];

            return [
                'month' => $item['month'],
                'label' => $item['label'],
                'rate' => $item['total'] > 0 ? round(($attended / $item['total']) * 100, 2) : 0,
                'present' => $item['present'],
                'late' => $item['late'],
                'absent' => $item['absent'],
                'total' => $item['total'],
            ];
        }, $grouped));
    }

    /**
     * Compute the overall assignment completion rate across all enrollments.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     * @return array<string, mixed>
     */
    private function assignmentCompletionRate(Collection $enrollments, User $student): array
    {
        $offeringIds = $enrollments->pluck('course_offering_id')->unique();

        $assignments = Assignment::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('is_published', true)
            ->get();

        if ($assignments->isEmpty()) {
            return [
                'rate' => null,
                'completedCount' => 0,
                'totalCount' => 0,
            ];
        }

        $completed = 0;
        foreach ($assignments as $assignment) {
            $hasSubmission = AssignmentSubmission::query()
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $student->id)
                ->exists();

            if ($hasSubmission) {
                $completed++;
            }
        }

        $total = $assignments->count();

        return [
            'rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            'completedCount' => $completed,
            'totalCount' => $total,
        ];
    }

    /**
     * Flag at-risk courses where overall percentage is below 60% or attendance
     * is below 50%.
     *
     * @param  array<int, array<string, mixed>>  $snapshots
     * @return array<string, mixed>
     */
    private function atRiskFlag(array $snapshots): array
    {
        $isAtRisk = false;
        $reasons = [];
        $lowGradeCourses = [];
        $lowAttendanceCourses = [];

        foreach ($snapshots as $snapshot) {
            if ($snapshot['overallPercentage'] !== null && $snapshot['overallPercentage'] < 60) {
                $lowGradeCourses[] = [
                    'offeringId' => $snapshot['offeringId'],
                    'courseCode' => $snapshot['courseCode'],
                    'courseName' => $snapshot['courseName'],
                    'overallPercentage' => $snapshot['overallPercentage'],
                ];
            }

            if ($snapshot['attendanceRate'] !== null && $snapshot['attendanceRate'] < 50) {
                $lowAttendanceCourses[] = [
                    'offeringId' => $snapshot['offeringId'],
                    'courseCode' => $snapshot['courseCode'],
                    'courseName' => $snapshot['courseName'],
                    'attendanceRate' => $snapshot['attendanceRate'],
                ];
            }
        }

        if (! empty($lowGradeCourses)) {
            $isAtRisk = true;
            $reasons[] = 'Low grade average in one or more courses.';
        }

        if (! empty($lowAttendanceCourses)) {
            $isAtRisk = true;
            $reasons[] = 'Low attendance rate in one or more courses.';
        }

        return [
            'isAtRisk' => $isAtRisk,
            'reasons' => $reasons,
            'lowGradeCourses' => $lowGradeCourses,
            'lowAttendanceCourses' => $lowAttendanceCourses,
        ];
    }

    /**
     * Attendance metrics for a single course offering.
     *
     * @return array<string, mixed>
     */
    private function attendanceMetrics($offering, User $student): array
    {
        $sessions = AttendanceSession::query()
            ->where('course_offering_id', $offering->id)
            ->get();

        $total = $sessions->count();

        if ($total === 0) {
            return [
                'rate' => null,
                'presentCount' => 0,
                'lateCount' => 0,
                'absentCount' => 0,
                'totalSessions' => 0,
            ];
        }

        $records = AttendanceRecord::query()
            ->whereIn('attendance_session_id', $sessions->pluck('id'))
            ->where('student_id', $student->id)
            ->get();

        $present = $records->where('status', 'present')->count();
        $late = $records->where('status', 'late')->count();
        $absent = $records->where('status', 'absent')->count();

        $attended = $present + $late;

        return [
            'rate' => round(($attended / $total) * 100, 2),
            'presentCount' => $present,
            'lateCount' => $late,
            'absentCount' => $absent,
            'totalSessions' => $total,
        ];
    }

    /**
     * Assignment completion metrics for a single course offering.
     *
     * @return array<string, mixed>
     */
    private function courseAssignmentCompletion($offering, User $student): array
    {
        $assignments = Assignment::query()
            ->where('course_offering_id', $offering->id)
            ->where('is_published', true)
            ->get();

        $total = $assignments->count();

        if ($total === 0) {
            return [
                'rate' => null,
                'completedCount' => 0,
                'totalCount' => 0,
            ];
        }

        $completed = 0;
        foreach ($assignments as $assignment) {
            $hasSubmission = AssignmentSubmission::query()
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $student->id)
                ->exists();

            if ($hasSubmission) {
                $completed++;
            }
        }

        return [
            'rate' => round(($completed / $total) * 100, 2),
            'completedCount' => $completed,
            'totalCount' => $total,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'gradeTrend' => [],
            'attendanceTrend' => [],
            'assignmentCompletionRate' => [
                'rate' => null,
                'completedCount' => 0,
                'totalCount' => 0,
            ],
            'atRiskFlag' => [
                'isAtRisk' => false,
                'reasons' => [],
                'lowGradeCourses' => [],
                'lowAttendanceCourses' => [],
            ],
            'courseSnapshots' => [],
        ];
    }
}

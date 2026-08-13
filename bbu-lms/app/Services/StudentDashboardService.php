<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\ClassSchedule;
use App\Models\ConversationParticipant;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Quiz;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StudentDashboardService
{
    /**
     * Build the aggregated student dashboard payload.
     *
     * @return array<string, mixed>
     */
    public function build(User $student): array
    {
        $offeringIds = $this->enrolledOfferingIds($student);

        if ($offeringIds->isEmpty()) {
            return $this->emptyPayload();
        }

        return [
            'todaysClasses' => $this->todaysClasses($offeringIds),
            'upcomingAssignments' => $this->upcomingAssignments($offeringIds, $student->id),
            'attendancePercentage' => $this->attendancePercentage($offeringIds, $student->id),
            'recentGrades' => $this->recentGrades($offeringIds, $student->id),
            'upcomingExams' => $this->upcomingExams($offeringIds),
            'unreadMessages' => $this->unreadMessages($student->id),
        ];
    }

    /**
     * @return Collection<int, int>
     */
    private function enrolledOfferingIds(User $student): Collection
    {
        return Enrollment::query()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->pluck('course_offering_id')
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
     * @return array<int, array<string, mixed>>
     */
    private function upcomingAssignments(Collection $offeringIds, int $studentId): array
    {
        $assignments = Assignment::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('is_published', true)
            ->whereNotNull('due_at')
            ->where('due_at', '>=', Carbon::now()->startOfDay())
            ->where('due_at', '<=', Carbon::now()->addDays(14))
            ->with(['courseOffering.course'])
            ->orderBy('due_at')
            ->get();

        return $assignments->map(function (Assignment $assignment) use ($studentId) {
            $offering = $assignment->courseOffering;
            $course = $offering?->course;
            $hasSubmission = $assignment->submissions()
                ->where('student_id', $studentId)
                ->exists();

            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'dueAt' => $assignment->due_at,
                'courseCode' => $course?->code,
                'courseName' => $course?->name,
                'isSubmitted' => $hasSubmission,
                'offeringId' => $offering?->id,
            ];
        })->toArray();
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     */
    private function attendancePercentage(Collection $offeringIds, int $studentId): ?float
    {
        $sessionIds = AttendanceSession::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->pluck('id');

        if ($sessionIds->isEmpty()) {
            return null;
        }

        $total = $sessionIds->count();
        $attended = AttendanceRecord::query()
            ->whereIn('attendance_session_id', $sessionIds)
            ->where('student_id', $studentId)
            ->whereIn('status', ['present', 'late'])
            ->count();

        return $total > 0 ? (float) round(($attended / $total) * 100, 2) : 0.0;
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     * @return array<int, array<string, mixed>>
     */
    private function recentGrades(Collection $offeringIds, int $studentId): array
    {
        $grades = Grade::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('student_id', $studentId)
            ->with(['component', 'courseOffering.course'])
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get();

        return $grades->map(function (Grade $grade) {
            $offering = $grade->courseOffering;
            $course = $offering?->course;

            return [
                'id' => $grade->id,
                'componentName' => $grade->component?->name,
                'courseCode' => $course?->code,
                'courseName' => $course?->name,
                'percentage' => $grade->percentage,
                'letterGrade' => $grade->letter_grade,
                'updatedAt' => $grade->updated_at,
                'offeringId' => $offering?->id,
            ];
        })->toArray();
    }

    /**
     * @param  Collection<int, int>  $offeringIds
     * @return array<int, array<string, mixed>>
     */
    private function upcomingExams(Collection $offeringIds): array
    {
        $exams = Quiz::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('type', 'exam')
            ->where('is_published', true)
            ->whereNotNull('starts_at')
            ->where('starts_at', '>=', Carbon::now())
            ->where('starts_at', '<=', Carbon::now()->addDays(30))
            ->with(['courseOffering.course'])
            ->orderBy('starts_at')
            ->get();

        return $exams->map(function (Quiz $exam) {
            $offering = $exam->courseOffering;
            $course = $offering?->course;

            return [
                'id' => $exam->id,
                'title' => $exam->title,
                'startsAt' => $exam->starts_at,
                'endsAt' => $exam->ends_at,
                'courseCode' => $course?->code,
                'courseName' => $course?->name,
                'offeringId' => $offering?->id,
            ];
        })->toArray();
    }

    /**
     * Count conversations where the student has unread messages.
     */
    private function unreadMessages(int $studentId): int
    {
        return ConversationParticipant::query()
            ->where('user_id', $studentId)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('messages')
                    ->whereColumn('messages.conversation_id', 'conversation_participants.conversation_id')
                    ->whereNull('messages.deleted_at')
                    ->where(function ($q) {
                        $q->whereNull('conversation_participants.last_read_at')
                            ->orWhereColumn('conversation_participants.last_read_at', '<', 'messages.created_at');
                    });
            })
            ->count();
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'todaysClasses' => [],
            'upcomingAssignments' => [],
            'attendancePercentage' => null,
            'recentGrades' => [],
            'upcomingExams' => [],
            'unreadMessages' => 0,
        ];
    }
}

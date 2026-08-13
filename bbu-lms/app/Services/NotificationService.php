<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceSession;
use App\Models\CalendarEvent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Message;
use App\Models\Notification;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public static function fromAnnouncement(Announcement $announcement): void
    {
        $scope = $announcement->scope;
        $title = "New {$scope} announcement";
        $body = $announcement->title;
        $actionUrl = $announcement->course_id
            ? "/courses/{$announcement->course_id}"
            : '/announcements';

        $userIds = match ($scope) {
            'university' => User::query()->pluck('id'),
            'department' => StudentProfile::query()
                ->where('department_id', $announcement->department_id)
                ->pluck('user_id')
                ->merge(User::query()->pluck('id'))
                ->unique()
                ->values(),
            'course' => Enrollment::query()
                ->where('course_offering_id', function ($query) use ($announcement) {
                    $query->select('id')
                        ->from('course_offerings')
                        ->where('course_id', $announcement->course_id);
                })
                ->where('status', 'enrolled')
                ->pluck('student_id')
                ->unique()
                ->values(),
            default => collect(),
        };

        $userIds = $userIds->reject(fn (int $id) => $id === $announcement->posted_by);

        self::bulkCreate($userIds, Notification::TYPE_ANNOUNCEMENT, $title, $body, [
            'announcementId' => $announcement->id,
            'scope' => $scope,
        ], $actionUrl);
    }

    public static function fromMessage(Message $message, Conversation $conversation): void
    {
        $senderId = $message->sender_id;
        $senderName = $message->sender?->name ?? 'Unknown';
        $title = "New message from {$senderName}";
        $body = $message->content ?? 'Sent an attachment';
        $actionUrl = '/chat';

        $userIds = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', '!=', $senderId)
            ->pluck('user_id')
            ->unique()
            ->values();

        self::bulkCreate($userIds, Notification::TYPE_CHAT_MESSAGE, $title, $body, [
            'messageId' => $message->id,
            'conversationId' => $conversation->id,
        ], $actionUrl);
    }

    public static function fromCalendarEvent(CalendarEvent $event): void
    {
        $type = $event->type === 'exam' ? Notification::TYPE_EXAM_REMINDER : 'event';
        $title = $type === Notification::TYPE_EXAM_REMINDER
            ? "Upcoming exam: {$event->title}"
            : "New calendar event: {$event->title}";
        $body = "{$event->type} scheduled for " . $event->start_at->format('M j, Y g:i A');
        $actionUrl = '/calendar';

        $userIds = collect();

        if ($event->course_offering_id) {
            $userIds = Enrollment::query()
                ->where('course_offering_id', $event->course_offering_id)
                ->where('status', 'enrolled')
                ->pluck('student_id')
                ->unique()
                ->values();
        } elseif ($event->course_id) {
            $userIds = Enrollment::query()
                ->whereIn('course_offering_id', function ($query) use ($event) {
                    $query->select('id')
                        ->from('course_offerings')
                        ->where('course_id', $event->course_id);
                })
                ->where('status', 'enrolled')
                ->pluck('student_id')
                ->unique()
                ->values();
        }

        $userIds = $userIds->reject(fn (int $id) => $id === $event->created_by);

        self::bulkCreate($userIds, $type, $title, $body, [
            'eventId' => $event->id,
            'eventType' => $event->type,
        ], $actionUrl);
    }

    public static function fromAssignment(Assignment $assignment, CourseOffering $offering): void
    {
        if (! $assignment->is_published) {
            return;
        }

        $title = "New assignment: {$assignment->title}";
        $body = $assignment->due_at
            ? 'Due ' . $assignment->due_at->diffForHumans()
            : 'No due date';
        $actionUrl = "/courses/{$offering->course_id}?tab=assignments";

        $userIds = Enrollment::query()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->pluck('student_id')
            ->unique()
            ->values();

        self::bulkCreate($userIds, Notification::TYPE_NEW_ASSIGNMENT, $title, $body, [
            'assignmentId' => $assignment->id,
            'courseOfferingId' => $offering->id,
        ], $actionUrl);
    }

    public static function fromAssignmentDeadline(Assignment $assignment, CourseOffering $offering): void
    {
        if (! $assignment->is_published || ! $assignment->due_at) {
            return;
        }

        $title = "Deadline approaching: {$assignment->title}";
        $body = "Due at " . $assignment->due_at->format('M j, Y g:i A');
        $actionUrl = "/courses/{$offering->course_id}?tab=assignments";

        $userIds = Enrollment::query()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->pluck('student_id')
            ->unique()
            ->values();

        self::bulkCreate($userIds, Notification::TYPE_DEADLINE, $title, $body, [
            'assignmentId' => $assignment->id,
            'courseOfferingId' => $offering->id,
            'dueAt' => $assignment->due_at->toDateTimeString(),
        ], $actionUrl);
    }

    public static function fromGrade(Grade $grade, CourseOffering $offering): void
    {
        $componentName = $grade->component?->name ?? 'Grade item';
        $title = "New grade posted: {$componentName}";
        $body = $grade->percentage !== null
            ? "You scored {$grade->percentage}%"
            : null;
        $actionUrl = "/courses/{$offering->course_id}?tab=grades";

        self::bulkCreate([$grade->student_id], Notification::TYPE_NEW_GRADE, $title, $body, [
            'gradeId' => $grade->id,
            'courseOfferingId' => $offering->id,
            'componentId' => $grade->grade_component_id,
        ], $actionUrl);
    }

    public static function fromAttendanceSession(AttendanceSession $session, CourseOffering $offering): void
    {
        $sessionName = $session->title ?: ($offering->course?->name ?? 'Course session');
        $title = "Attendance open: {$sessionName}";
        $body = $session->ends_at
            ? 'Check in before ' . $session->ends_at->format('g:i A')
            : 'Check in now';
        $actionUrl = "/courses/{$offering->course_id}?tab=attendance";

        $userIds = Enrollment::query()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->pluck('student_id')
            ->unique()
            ->values();

        self::bulkCreate($userIds, Notification::TYPE_ATTENDANCE_REMINDER, $title, $body, [
            'attendanceSessionId' => $session->id,
            'courseOfferingId' => $offering->id,
        ], $actionUrl);
    }

    /**
     * @param  Collection<int, int>|array<int>  $userIds
     */
    public static function bulkCreate(
        Collection|array $userIds,
        string $type,
        string $title,
        ?string $body,
        array $data,
        string $actionUrl
    ): void {
        $ids = $userIds instanceof Collection ? $userIds->toArray() : $userIds;
        if (empty($ids)) {
            return;
        }

        $now = now();
        $records = array_map(fn (int $userId) => [
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => json_encode($data),
            'action_url' => $actionUrl,
            'created_at' => $now,
            'updated_at' => $now,
        ], $ids);

        DB::table('notifications')->insert($records);

        event(new NotificationCreated($ids, $type, $title));
    }
}

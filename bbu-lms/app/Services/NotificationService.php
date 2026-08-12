<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\CalendarEvent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Enrollment;
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

        self::bulkCreate($userIds, 'announcement', $title, $body, [
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

        self::bulkCreate($userIds, 'message', $title, $body, [
            'messageId' => $message->id,
            'conversationId' => $conversation->id,
        ], $actionUrl);
    }

    public static function fromCalendarEvent(CalendarEvent $event): void
    {
        $title = "New calendar event: {$event->title}";
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

        self::bulkCreate($userIds, 'event', $title, $body, [
            'eventId' => $event->id,
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
    }
}

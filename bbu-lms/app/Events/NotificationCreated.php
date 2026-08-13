<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param  array<int, int>  $userIds
     */
    public function __construct(
        public array $userIds,
        public string $type,
        public ?string $title = null,
    ) {
    }

    /**
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return array_map(
            fn (int $userId) => new PrivateChannel('App.Models.User.'.$userId),
            $this->userIds
        );
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
        ];
    }
}

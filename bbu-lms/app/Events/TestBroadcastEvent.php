<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TestBroadcastEvent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public string $message)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('public'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'test-event';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
            'time' => now()->toIso8601String(),
        ];
    }
}

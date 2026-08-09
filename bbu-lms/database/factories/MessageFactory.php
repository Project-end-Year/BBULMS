<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_id' => User::factory(),
            'content' => fake()->paragraph(),
            'type' => 'text',
            'reply_to_id' => null,
            'edited_at' => null,
            'deleted_at' => null,
        ];
    }

    public function attachment(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'attachment',
            'content' => null,
        ]);
    }

    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'system',
        ]);
    }
}

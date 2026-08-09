<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageAttachmentFactory extends Factory
{
    protected $model = MessageAttachment::class;

    public function definition(): array
    {
        $name = fake()->unique()->word().'.'.fake()->fileExtension();

        return [
            'message_id' => Message::factory(),
            'file_name' => $name,
            'original_name' => $name,
            'mime_type' => fake()->mimeType(),
            'size' => fake()->numberBetween(1024, 10_000_000),
            'disk' => 'local',
            'file_path' => 'attachments/'.fake()->uuid().'/'.$name,
        ];
    }
}

<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MessageAttachmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_participant_can_send_attachment_message(): void
    {
        Storage::fake('local');
        Event::fake([MessageSent::class]);

        $user = User::factory()->create();
        $other = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);

        $file = UploadedFile::fake()->image('screenshot.png');

        $response = $this->actingAs($user)->postJson(
            "/api/conversations/{$conversation->id}/messages",
            [
                'content' => 'Check this image',
                'attachments' => [$file],
            ],
            ['Content-Type' => 'multipart/form-data']
        );

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.message.type', 'attachment')
            ->assertJsonCount(1, 'data.message.attachments');

        $this->assertDatabaseHas('message_attachments', [
            'original_name' => 'screenshot.png',
        ]);

        Event::assertDispatched(MessageSent::class);
    }

    public function test_attachment_message_requires_content_or_file(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->postJson(
            "/api/conversations/{$conversation->id}/messages",
            [
                'content' => '',
            ]
        );

        $response->assertStatus(422)
            ->assertJsonPath('errors.content.0', 'A message must have text or at least one attachment.');
    }

    public function test_attachment_file_size_is_limited(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        $file = UploadedFile::fake()->create('large.pdf', 10240 + 1);

        $response = $this->actingAs($user)->postJson(
            "/api/conversations/{$conversation->id}/messages",
            [
                'attachments' => [$file],
            ],
            ['Content-Type' => 'multipart/form-data']
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attachments.0']);
    }
}

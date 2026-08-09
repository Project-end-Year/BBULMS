<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_participant_can_send_message(): void
    {
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

        Event::fake([MessageSent::class]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
            'content' => 'Hello there!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.message.content', 'Hello there!')
            ->assertJsonPath('data.message.sender.id', $user->id);

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => 'Hello there!',
        ]);

        Event::assertDispatched(MessageSent::class);
    }

    public function test_non_participant_cannot_send_message(): void
    {
        $user = User::factory()->create();
        $participant = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $participant->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
            'content' => 'Hello there!',
        ]);

        $response->assertForbidden();
    }

    public function test_message_content_is_required(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
            'content' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.content.0', 'A message must have text or at least one attachment.');
    }

    public function test_participant_can_reply_to_message(): void
    {
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

        $parent = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $other->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
            'content' => 'Replying to your message',
            'replyToId' => $parent->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.message.replyTo.id', $parent->id);
    }

    public function test_message_content_max_length(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
            'content' => str_repeat('a', 4001),
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.content.0', 'The content field must not be greater than 4000 characters.');
    }
}

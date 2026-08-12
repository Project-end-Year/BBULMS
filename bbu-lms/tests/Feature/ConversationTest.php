<?php

namespace Tests\Feature;

use App\Events\UserTyping;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_user_can_create_direct_conversation(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/conversations/direct', [
            'userId' => $target->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.conversation.type', 'direct')
            ->assertJsonCount(2, 'data.conversation.participants');

        $this->assertDatabaseHas('conversations', [
            'type' => 'direct',
            'created_by' => $user->id,
        ]);
    }

    public function test_create_direct_returns_existing_conversation_on_duplicate(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $conversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $user->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'role' => 'admin',
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $target->id,
            'role' => 'member',
        ]);

        $response = $this->actingAs($user)->postJson('/api/conversations/direct', [
            'userId' => $target->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.conversation.id', $conversation->id)
            ->assertJsonCount(2, 'data.conversation.participants');

        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_user_cannot_create_direct_conversation_with_self(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/conversations/direct', [
            'userId' => $user->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.userId.0', 'You cannot start a direct conversation with yourself.');
    }

    public function test_user_cannot_create_direct_conversation_with_unknown_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/conversations/direct', [
            'userId' => 9999,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.userId.0', 'The selected user id is invalid.');
    }

    public function test_user_can_list_their_conversations(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $conversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $user->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);

        $otherConversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $other->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $otherConversation->id,
            'user_id' => $other->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $otherConversation->id,
            'user_id' => User::factory()->create()->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/conversations');

        $response->assertOk()
            ->assertJsonCount(1, 'data.conversations')
            ->assertJsonPath('data.conversations.0.id', $conversation->id);
    }

    public function test_conversations_list_orders_by_latest_message(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $oldConversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $user->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $oldConversation->id,
            'user_id' => $user->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $oldConversation->id,
            'user_id' => $other->id,
        ]);
        Message::factory()->create([
            'conversation_id' => $oldConversation->id,
            'sender_id' => $user->id,
            'created_at' => now()->subDay(),
        ]);

        $newConversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $user->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $newConversation->id,
            'user_id' => $user->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $newConversation->id,
            'user_id' => $other->id,
        ]);
        Message::factory()->create([
            'conversation_id' => $newConversation->id,
            'sender_id' => $other->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/conversations');

        $response->assertOk()
            ->assertJsonPath('data.conversations.0.id', $newConversation->id)
            ->assertJsonPath('data.conversations.1.id', $oldConversation->id);
    }

    public function test_user_can_show_participating_conversation(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $conversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $user->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/conversations/{$conversation->id}");

        $response->assertOk()
            ->assertJsonPath('data.conversation.id', $conversation->id)
            ->assertJsonCount(2, 'data.conversation.participants');
    }

    public function test_user_cannot_show_unrelated_conversation(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $conversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $other->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => User::factory()->create()->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/conversations/{$conversation->id}");

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_conversation_routes(): void
    {
        $user = User::factory()->create();

        $this->getJson('/api/conversations')->assertUnauthorized();
        $this->postJson('/api/conversations/direct', ['userId' => $user->id])->assertUnauthorized();
        $this->getJson('/api/conversations/1')->assertUnauthorized();
    }

    public function test_participant_can_send_typing_indicator(): void
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

        Event::fake([UserTyping::class]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/typing");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.typing', true);

        Event::assertDispatched(UserTyping::class, function (UserTyping $event) use ($conversation, $user): bool {
            return $event->conversation->id === $conversation->id
                && $event->user->id === $user->id;
        });
    }

    public function test_non_participant_cannot_send_typing_indicator(): void
    {
        $user = User::factory()->create();
        $participant = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $participant->id,
        ]);

        Event::fake([UserTyping::class]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/typing");

        $response->assertForbidden();
        Event::assertNotDispatched(UserTyping::class);
    }

    public function test_participant_can_mark_conversation_as_read(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'last_read_at' => now()->subDay(),
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/mark-read");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.read', true);

        $this->assertDatabaseHas('conversation_participants', [
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        $participant = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->first();

        $this->assertNotNull($participant->last_read_at);
        $this->assertTrue($participant->last_read_at->greaterThan(now()->subMinute()));
    }

    public function test_non_participant_cannot_mark_conversation_as_read(): void
    {
        $user = User::factory()->create();
        $participant = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $participant->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/mark-read");

        $response->assertForbidden();
    }
}

<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationMigrationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversation_factory_creates_direct_conversation_with_participants(): void
    {
        $conversation = Conversation::factory()
            ->has(ConversationParticipant::factory()->count(2), 'participants')
            ->create();

        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'type' => 'direct',
        ]);

        $this->assertCount(2, $conversation->fresh()->participants);
    }

    public function test_group_conversation_factory_creates_title(): void
    {
        $conversation = Conversation::factory()->group()->create();

        $this->assertNotNull($conversation->title);
        $this->assertEquals('group', $conversation->type);
    }

    public function test_message_factory_relates_to_conversation_and_sender(): void
    {
        $conversation = Conversation::factory()->create();
        $sender = User::factory()->create();
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
        ]);

        $this->assertEquals($conversation->id, $message->conversation->id);
        $this->assertEquals($sender->id, $message->sender->id);
    }

    public function test_message_attachment_factory_relates_to_message(): void
    {
        $message = Message::factory()->attachment()->create();
        $attachment = MessageAttachment::factory()->create([
            'message_id' => $message->id,
        ]);

        $this->assertEquals($message->id, $attachment->message->id);
    }

    public function test_reply_to_message_relation(): void
    {
        $parent = Message::factory()->create();
        $reply = Message::factory()->create([
            'conversation_id' => $parent->conversation_id,
            'reply_to_id' => $parent->id,
        ]);

        $this->assertEquals($parent->id, $reply->replyTo->id);
        $this->assertCount(1, $parent->fresh()->replies);
    }

    public function test_unique_participant_constraint(): void
    {
        $conversation = Conversation::factory()->create();
        $user = User::factory()->create();

        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);
    }
}

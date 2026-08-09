<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    /**
     * Store a new message in a conversation and broadcast it.
     */
    public function store(Request $request, Conversation $conversation)
    {
        $user = $this->requireUser();
        Gate::authorize('participate', $conversation);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
            'replyToId' => ['nullable', 'integer', 'exists:messages,id'],
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $validated['content'],
            'type' => 'text',
            'reply_to_id' => $validated['replyToId'] ?? null,
        ]);

        $message->load(['sender', 'replyTo.sender', 'attachments']);

        broadcast(new MessageSent($message))->toOthers();

        return ApiResponse::success(
            ['message' => new MessageResource($message)],
            'Message sent.',
            201
        );
    }

    /**
     * Require an authenticated user.
     */
    private function requireUser(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'user' => ['No authenticated user.'],
            ]);
        }

        return $user;
    }
}

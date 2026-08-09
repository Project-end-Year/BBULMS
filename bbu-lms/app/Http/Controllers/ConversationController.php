<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ConversationController extends Controller
{
    /**
     * List conversations the authenticated user participates in.
     */
    public function index(Request $request)
    {
        $user = $this->requireUser();

        $conversations = Conversation::query()
            ->with([
                'creator',
                'courseOffering',
                'participants.user',
                'messages' => fn ($query) => $query->latest()->limit(1),
            ])
            ->whereHas('participants', fn ($query) => $query->where('user_id', $user->id))
            ->where('is_active', true)
            ->orderByDesc(
                DB::raw('(SELECT MAX(created_at) FROM messages WHERE messages.conversation_id = conversations.id)')
            )
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'conversations' => ConversationResource::collection($conversations),
        ]);
    }

    /**
     * Show a single conversation with participants and latest message.
     */
    public function show(Conversation $conversation)
    {
        $user = $this->requireUser();
        Gate::authorize('view', $conversation);

        $conversation->loadMissing(['creator', 'courseOffering', 'participants.user', 'messages' => fn ($query) => $query->latest()->limit(1)]);

        return ApiResponse::success([
            'conversation' => new ConversationResource($conversation),
        ]);
    }

    /**
     * Create or return an existing 1-to-1 (direct) conversation.
     */
    public function storeDirect(Request $request)
    {
        $user = $this->requireUser();

        $validated = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $targetUserId = (int) $validated['userId'];

        if ($targetUserId === $user->id) {
            throw ValidationException::withMessages([
                'userId' => ['You cannot start a direct conversation with yourself.'],
            ]);
        }

        $existing = $this->findExistingDirectConversation($user->id, $targetUserId);

        if ($existing) {
            $existing->loadMissing(['creator', 'courseOffering', 'participants.user', 'messages' => fn ($query) => $query->latest()->limit(1)]);

            return ApiResponse::success([
                'conversation' => new ConversationResource($existing),
            ]);
        }

        $conversation = DB::transaction(function () use ($user, $targetUserId) {
            $conversation = Conversation::create([
                'type' => 'direct',
                'created_by' => $user->id,
                'is_active' => true,
            ]);

            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'role' => 'admin',
            ]);

            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $targetUserId,
                'role' => 'member',
            ]);

            return $conversation;
        });

        $conversation->loadMissing(['creator', 'courseOffering', 'participants.user', 'messages' => fn ($query) => $query->latest()->limit(1)]);

        return ApiResponse::success([
            'conversation' => new ConversationResource($conversation),
        ], 201);
    }

    /**
     * Find an existing direct conversation between two users.
     */
    private function findExistingDirectConversation(int $userAId, int $userBId): ?Conversation
    {
        $subQuery = ConversationParticipant::query()
            ->select('conversation_id')
            ->where('user_id', $userAId)
            ->whereIn('conversation_id', function ($query) use ($userBId) {
                $query->select('conversation_id')
                    ->from('conversation_participants')
                    ->where('user_id', $userBId);
            });

        return Conversation::query()
            ->where('type', 'direct')
            ->whereIn('id', $subQuery)
            ->whereHas('participants', fn ($query) => $query->where('user_id', $userAId))
            ->whereHas('participants', fn ($query) => $query->where('user_id', $userBId))
            ->first();
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

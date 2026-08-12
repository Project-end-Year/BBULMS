<?php

namespace App\Http\Controllers;

use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\MessageUpdated;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    /**
     * Store a new text or attachment message in a conversation and broadcast it.
     */
    public function store(Request $request, Conversation $conversation)
    {
        $user = $this->requireUser();
        Gate::authorize('participate', $conversation);

        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:4000'],
            'replyToId' => [
                'nullable',
                'integer',
                'exists:messages,id',
                function (string $attribute, mixed $value, \Closure $fail) use ($conversation): void {
                    $exists = Message::where('id', $value)
                        ->where('conversation_id', $conversation->id)
                        ->exists();
                    if (! $exists) {
                        $fail('The replied message must belong to this conversation.');
                    }
                },
            ],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip', 'max:10240'],
        ]);

        $hasContent = ! empty($validated['content']);
        $hasAttachments = $request->hasFile('attachments') && count($request->file('attachments')) > 0;

        if (! $hasContent && ! $hasAttachments) {
            throw ValidationException::withMessages([
                'content' => ['A message must have text or at least one attachment.'],
            ]);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $validated['content'] ?? null,
            'type' => $hasAttachments ? 'attachment' : 'text',
            'reply_to_id' => $validated['replyToId'] ?? null,
        ]);

        if ($hasAttachments) {
            $this->storeAttachments($message, $request->file('attachments'));
        }

        $message->load(['sender', 'replyTo.sender', 'attachments']);

        broadcast(new MessageSent($message))->toOthers();
        NotificationService::fromMessage($message, $conversation);

        return ApiResponse::success(
            ['message' => new MessageResource($message)],
            'Message sent.',
            201
        );
    }

    /**
     * Update an existing text message. Only the original sender may edit.
     */
    public function update(Request $request, Conversation $conversation, Message $message)
    {
        $user = $this->requireUser();
        Gate::authorize('participate', $conversation);

        if ($message->conversation_id !== $conversation->id) {
            abort(404);
        }

        if ($message->sender_id !== $user->id || ! is_null($message->deleted_at)) {
            return ApiResponse::error('You can only edit your own messages.', 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
        ]);

        $message->update([
            'content' => $validated['content'],
            'edited_at' => now(),
        ]);

        $message->load(['sender', 'replyTo.sender', 'attachments']);

        broadcast(new MessageUpdated($message))->toOthers();

        return ApiResponse::success(
            ['message' => new MessageResource($message)],
            'Message updated.'
        );
    }

    /**
     * Soft-delete a message. Only the original sender may delete.
     */
    public function destroy(Conversation $conversation, Message $message)
    {
        $user = $this->requireUser();
        Gate::authorize('participate', $conversation);

        if ($message->conversation_id !== $conversation->id) {
            abort(404);
        }

        if ($message->sender_id !== $user->id || ! is_null($message->deleted_at)) {
            return ApiResponse::error('You can only delete your own messages.', 403);
        }

        $message->update(['deleted_at' => now()]);

        broadcast(new MessageDeleted($message))->toOthers();

        return ApiResponse::success(['deleted' => true], 'Message deleted.');
    }

    /**
     * Store uploaded files as message attachments.
     *
     * @param  array<int, \Illuminate\Http\UploadedFile>  $files
     */
    private function storeAttachments(Message $message, array $files): void
    {
        $disk = Storage::disk('local');

        foreach ($files as $file) {
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = uniqid().'.'.($extension ?: 'bin');
            $path = "chat/{$message->conversation_id}/{$message->id}/{$fileName}";

            $disk->putFileAs(dirname($path), $file, basename($path));

            MessageAttachment::create([
                'message_id' => $message->id,
                'file_name' => $fileName,
                'original_name' => $originalName,
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'size' => $file->getSize(),
                'disk' => 'local',
                'file_path' => $path,
            ]);
        }
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

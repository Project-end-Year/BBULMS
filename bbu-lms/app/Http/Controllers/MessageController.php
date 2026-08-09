<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
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
            'replyToId' => ['nullable', 'integer', 'exists:messages,id'],
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

        return ApiResponse::success(
            ['message' => new MessageResource($message)],
            'Message sent.',
            201
        );
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

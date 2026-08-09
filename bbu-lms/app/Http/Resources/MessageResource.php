<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversationId' => $this->conversation_id,
            'content' => $this->content,
            'type' => $this->type,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'replyTo' => new MessageResource($this->whenLoaded('replyTo')),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'editedAt' => $this->edited_at,
            'deletedAt' => $this->deleted_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

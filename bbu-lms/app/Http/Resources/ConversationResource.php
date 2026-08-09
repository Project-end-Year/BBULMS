<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $authUser = $request->user();
        $authParticipant = $this->participants
            ->firstWhere('user_id', $authUser?->id);

        $latestMessage = $this->messages?->first();

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'isActive' => $this->is_active,
            'createdBy' => new UserResource($this->whenLoaded('creator')),
            'courseOffering' => $this->whenLoaded('courseOffering', fn () => [
                'id' => $this->courseOffering->id,
                'section' => $this->courseOffering->section,
            ]),
            'participants' => ConversationParticipantResource::collection($this->whenLoaded('participants')),
            'latestMessage' => new MessageResource($latestMessage),
            'lastReadAt' => $authParticipant?->last_read_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

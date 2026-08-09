<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseMaterialViewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'material' => new CourseMaterialResource($this->whenLoaded('material')),
            'student' => new UserResource($this->whenLoaded('student')),
            'action' => $this->action,
            'ipAddress' => $this->ip_address,
            'userAgent' => $this->user_agent,
            'viewedAt' => $this->viewed_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

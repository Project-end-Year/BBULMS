<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quizId' => $this->quiz_id,
            'type' => $this->type,
            'prompt' => $this->prompt,
            'points' => $this->points,
            'order' => $this->order,
            'options' => StudentQuestionOptionResource::collection($this->whenLoaded('options')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

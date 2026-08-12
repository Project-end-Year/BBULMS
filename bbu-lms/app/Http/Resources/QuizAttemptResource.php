<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quizId' => $this->quiz_id,
            'student' => new ConversationUserResource($this->whenLoaded('student')),
            'attemptNumber' => $this->attempt_number,
            'startedAt' => $this->started_at,
            'submittedAt' => $this->submitted_at,
            'expiresAt' => $this->expires_at,
            'score' => $this->score !== null ? (float) $this->score : null,
            'maxScore' => $this->max_score !== null ? (float) $this->max_score : null,
            'percentage' => $this->percentage !== null ? (float) $this->percentage : null,
            'status' => $this->status,
            'questionOrder' => $this->question_order,
            'answers' => QuizAnswerResource::collection($this->whenLoaded('answers')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

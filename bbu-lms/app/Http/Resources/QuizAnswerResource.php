<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAnswerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quizAttemptId' => $this->quiz_attempt_id,
            'question' => new QuestionResource($this->whenLoaded('question')),
            'option' => new QuestionOptionResource($this->whenLoaded('option')),
            'answerText' => $this->answer_text,
            'isCorrect' => $this->is_correct,
            'pointsAwarded' => $this->points_awarded,
            'pointsPossible' => $this->points_possible,
            'status' => $this->status,
            'feedback' => $this->feedback,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

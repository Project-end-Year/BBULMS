<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courseOfferingId' => $this->course_offering_id,
            'createdBy' => new ConversationUserResource($this->whenLoaded('creator')),
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'timeLimitMinutes' => $this->time_limit_minutes,
            'attemptsAllowed' => $this->attempts_allowed,
            'shuffleQuestions' => $this->shuffle_questions,
            'showCorrectAnswers' => $this->show_correct_answers,
            'isPublished' => $this->is_published,
            'startsAt' => $this->starts_at,
            'endsAt' => $this->ends_at,
            'totalPoints' => $this->total_points,
            'passingScorePercentage' => $this->passing_score_percentage,
            'questions' => QuestionResource::collection($this->whenLoaded('questions')),
            'questionsCount' => $this->whenCounted('questions'),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

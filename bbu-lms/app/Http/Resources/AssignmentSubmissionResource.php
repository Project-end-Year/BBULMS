<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentSubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assignmentId' => $this->assignment_id,
            'student' => new ConversationUserResource($this->whenLoaded('student')),
            'attemptNumber' => $this->attempt_number,
            'submissionText' => $this->submission_text,
            'files' => $this->files,
            'submittedAt' => $this->submitted_at,
            'grade' => $this->grade,
            'feedback' => $this->feedback,
            'gradedBy' => new ConversationUserResource($this->whenLoaded('grader')),
            'gradedAt' => $this->graded_at,
            'status' => $this->status,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

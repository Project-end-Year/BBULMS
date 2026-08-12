<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courseOfferingId' => $this->course_offering_id,
            'title' => $this->title,
            'description' => $this->description,
            'instructions' => $this->instructions,
            'dueAt' => $this->due_at,
            'maxPoints' => $this->max_points,
            'allowedAttempts' => $this->allowed_attempts,
            'allowedFileTypes' => $this->allowed_file_types,
            'maxFileSizeMb' => $this->max_file_size_mb,
            'isPublished' => $this->is_published,
            'createdBy' => $this->created_by,
            'submissionsCount' => $this->whenCounted('submissions'),
            'submissions' => AssignmentSubmissionResource::collection($this->whenLoaded('submissions')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

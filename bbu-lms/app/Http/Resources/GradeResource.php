<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courseOfferingId' => $this->course_offering_id,
            'student' => new ConversationUserResource($this->whenLoaded('student')),
            'component' => new GradeComponentResource($this->whenLoaded('component')),
            'points' => $this->points,
            'maxPoints' => $this->max_points,
            'percentage' => $this->percentage,
            'letterGrade' => $this->letter_grade,
            'feedback' => $this->feedback,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

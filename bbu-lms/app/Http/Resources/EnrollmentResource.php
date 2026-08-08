<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
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
            'courseOffering' => new CourseOfferingResource($this->whenLoaded('courseOffering')),
            'student' => new UserResource($this->whenLoaded('student')),
            'status' => $this->status,
            'enrolledAt' => $this->enrolled_at,
            'droppedAt' => $this->dropped_at,
            'finalGrade' => $this->final_grade,
            'isActive' => $this->is_active,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

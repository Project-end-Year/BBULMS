<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A lightweight offering resource that avoids recursively embedding the parent course.
 */
class CourseOfferingSummaryResource extends JsonResource
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
            'semester' => new SemesterResource($this->whenLoaded('semester')),
            'lecturer' => new UserResource($this->whenLoaded('lecturer')),
            'capacity' => $this->capacity,
            'section' => $this->section,
            'room' => $this->room,
            'schedule' => $this->schedule,
            'enrollmentCount' => $this->whenCounted('enrollments'),
            'isActive' => $this->is_active,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

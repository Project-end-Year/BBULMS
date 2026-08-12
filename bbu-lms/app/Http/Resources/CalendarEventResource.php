<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'startAt' => $this->start_at,
            'endAt' => $this->end_at,
            'location' => $this->location,
            'isAllDay' => $this->is_all_day,
            'color' => $this->color,
            'courseId' => $this->course_id,
            'courseOfferingId' => $this->course_offering_id,
            'sourceType' => $this->source_type,
            'sourceId' => $this->source_id,
            'course' => new CourseResource($this->whenLoaded('course')),
            'courseOffering' => new CourseOfferingResource($this->whenLoaded('courseOffering')),
            'createdBy' => $this->created_by,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

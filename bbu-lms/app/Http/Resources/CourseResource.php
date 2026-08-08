<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
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
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'credits' => $this->credits,
            'isActive' => $this->is_active,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'program' => new ProgramResource($this->whenLoaded('program')),
            'offerings' => CourseOfferingResource::collection($this->whenLoaded('offerings')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

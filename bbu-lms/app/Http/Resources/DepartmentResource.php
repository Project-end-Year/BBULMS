<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
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
            'isActive' => $this->is_active,
            'facultyId' => $this->faculty_id,
            'faculty' => $this->whenLoaded('faculty', function () {
                return $this->faculty ? [
                    'id' => $this->faculty->id,
                    'code' => $this->faculty->code,
                    'name' => $this->faculty->name,
                ] : null;
            }),
            'programs' => ProgramResource::collection($this->whenLoaded('programs')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

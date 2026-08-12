<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeComponentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courseOfferingId' => $this->course_offering_id,
            'name' => $this->name,
            'type' => $this->type,
            'weight' => $this->weight,
            'order' => $this->order,
            'settings' => $this->settings,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

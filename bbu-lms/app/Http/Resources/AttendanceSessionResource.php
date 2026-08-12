<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courseOfferingId' => $this->course_offering_id,
            'lecturer' => new ConversationUserResource($this->whenLoaded('lecturer')),
            'title' => $this->title,
            'startsAt' => $this->starts_at,
            'endsAt' => $this->ends_at,
            'code' => $this->code,
            'qrToken' => $this->qr_token,
            'isActive' => $this->is_active,
            'lateThresholdMinutes' => $this->late_threshold_minutes,
            'closedAt' => $this->closed_at,
            'records' => AttendanceRecordResource::collection($this->whenLoaded('records')),
            'presentCount' => $this->whenCounted('records'),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

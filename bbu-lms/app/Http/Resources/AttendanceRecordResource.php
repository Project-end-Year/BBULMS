<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'attendanceSessionId' => $this->attendance_session_id,
            'student' => new ConversationUserResource($this->whenLoaded('student')),
            'status' => $this->status,
            'checkedInAt' => $this->checked_in_at,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'checkInMethod' => $this->check_in_method,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

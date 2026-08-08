<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'avatarUrl' => $this->avatar ? Storage::disk('public')->url($this->avatar) : null,
            'locale' => $this->locale,
            'isActive' => $this->is_active,
            'emailVerifiedAt' => $this->email_verified_at,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'roles' => RoleResource::collection($this->whenLoaded('roles')),
            'studentProfile' => new StudentProfileResource($this->whenLoaded('studentProfile')),
            'lecturerProfile' => new LecturerProfileResource($this->whenLoaded('lecturerProfile')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

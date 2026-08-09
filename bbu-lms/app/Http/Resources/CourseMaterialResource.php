<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseMaterialResource extends JsonResource
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
            'courseOfferingId' => $this->course_offering_id,
            'title' => $this->title,
            'description' => $this->description,
            'fileName' => $this->file_name,
            'fileSize' => $this->file_size,
            'mimeType' => $this->mime_type,
            'externalUrl' => $this->external_url,
            'type' => $this->type,
            'isPublished' => $this->is_published,
            'publishedAt' => $this->published_at,
            'order' => $this->order,
            'isActive' => $this->is_active,
            'uploadedBy' => new UserResource($this->whenLoaded('uploader')),
            'viewCount' => $this->whenCounted('views', fn ($count) => $count, 0),
            'downloadCount' => $this->whenCounted('downloads', fn ($count) => $count, 0),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}

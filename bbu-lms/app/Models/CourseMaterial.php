<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseMaterial extends Model
{
    /** @use HasFactory\Database\Factories\CourseMaterialFactory */
    use HasFactory;

    protected $fillable = [
        'course_offering_id',
        'title',
        'description',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'external_url',
        'type',
        'uploaded_by',
        'is_published',
        'published_at',
        'order',
        'is_active',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function courseOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function views(): HasMany
    {
        return $this->hasMany(CourseMaterialView::class);
    }
}

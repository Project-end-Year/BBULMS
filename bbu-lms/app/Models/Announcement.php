<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    /** @use HasFactory\Database\Factories\AnnouncementFactory */
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'content',
        'posted_by',
        'is_pinned',
        'is_published',
        'published_at',
        'is_active',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}

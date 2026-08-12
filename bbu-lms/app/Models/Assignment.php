<?php

namespace App\Models;

use Database\Factories\AssignmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    /** @use HasFactory<AssignmentFactory> */
    use HasFactory;

    protected $fillable = [
        'course_offering_id',
        'created_by',
        'title',
        'description',
        'instructions',
        'due_at',
        'max_points',
        'allowed_attempts',
        'allowed_file_types',
        'max_file_size_mb',
        'is_published',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'max_points' => 'decimal:2',
        'allowed_attempts' => 'integer',
        'allowed_file_types' => 'array',
        'max_file_size_mb' => 'integer',
        'is_published' => 'boolean',
    ];

    public function courseOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}

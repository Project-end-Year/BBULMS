<?php

namespace App\Models;

use Database\Factories\GradeComponentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeComponent extends Model
{
    /** @use HasFactory<GradeComponentFactory> */
    use HasFactory;

    protected $fillable = [
        'course_offering_id',
        'name',
        'type',
        'weight',
        'order',
        'settings',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'order' => 'integer',
        'settings' => 'array',
    ];

    public function courseOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}

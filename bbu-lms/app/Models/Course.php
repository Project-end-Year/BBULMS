<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    /** @use HasFactory\Database\Factories\CourseFactory */
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'credits', 'department_id', 'program_id', 'is_active'];

    protected $casts = [
        'credits' => 'integer',
        'is_active' => 'boolean',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function offerings(): HasMany
    {
        return $this->hasMany(CourseOffering::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }
}

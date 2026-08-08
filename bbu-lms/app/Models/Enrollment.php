<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    /** @use HasFactory\Database\Factories\EnrollmentFactory */
    use HasFactory;

    protected $fillable = [
        'course_offering_id',
        'student_id',
        'status',
        'enrolled_at',
        'dropped_at',
        'final_grade',
        'is_active',
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
        'dropped_at' => 'datetime',
        'final_grade' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function courseOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}

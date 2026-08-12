<?php

namespace App\Models;

use Database\Factories\QuizFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quiz extends Model
{
    /** @use HasFactory<QuizFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'course_offering_id',
        'created_by',
        'title',
        'description',
        'type',
        'time_limit_minutes',
        'attempts_allowed',
        'shuffle_questions',
        'show_correct_answers',
        'is_published',
        'starts_at',
        'ends_at',
        'total_points',
        'passing_score_percentage',
    ];

    protected $casts = [
        'time_limit_minutes' => 'integer',
        'attempts_allowed' => 'integer',
        'shuffle_questions' => 'boolean',
        'show_correct_answers' => 'boolean',
        'is_published' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'total_points' => 'decimal:2',
        'passing_score_percentage' => 'integer',
    ];

    public function courseOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (Quiz $quiz) {
            $quiz->questions()->delete();
        });
    }
}

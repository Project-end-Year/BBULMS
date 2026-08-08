<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LecturerProfile extends Model
{
    /** @use HasFactory\Database\Factories\LecturerProfileFactory */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'title',
        'office_hours',
    ];

    protected $casts = [
        'office_hours' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}

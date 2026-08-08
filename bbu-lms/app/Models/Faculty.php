<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faculty extends Model
{
    /** @use HasFactory\Database\Factories\FacultyFactory */
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'dean_id', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function dean(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dean_id');
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}

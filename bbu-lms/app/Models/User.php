<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'phone', 'avatar', 'locale', 'department_id', 'is_active', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * The default authentication guard for Spatie Permission.
     */
    protected ?string $guard_name = 'web';

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function lecturerProfile(): HasOne
    {
        return $this->hasOne(LecturerProfile::class);
    }

    public function taughtOfferings(): HasMany
    {
        return $this->hasMany(CourseOffering::class, 'lecturer_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }
}

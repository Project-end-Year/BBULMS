<?php

namespace App\Models;

use Database\Factories\NotificationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    /** @use HasFactory<NotificationFactory> */
    use HasFactory;

    public const TYPE_ANNOUNCEMENT = 'announcement';
    public const TYPE_CHAT_MESSAGE = 'chat_message';
    public const TYPE_EXAM_REMINDER = 'exam_reminder';
    public const TYPE_NEW_ASSIGNMENT = 'new_assignment';
    public const TYPE_DEADLINE = 'deadline';
    public const TYPE_NEW_GRADE = 'new_grade';
    public const TYPE_ATTENDANCE_REMINDER = 'attendance_reminder';

    public static function types(): array
    {
        return [
            self::TYPE_ANNOUNCEMENT,
            self::TYPE_CHAT_MESSAGE,
            self::TYPE_EXAM_REMINDER,
            self::TYPE_NEW_ASSIGNMENT,
            self::TYPE_DEADLINE,
            self::TYPE_NEW_GRADE,
            self::TYPE_ATTENDANCE_REMINDER,
        ];
    }

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'action_url',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        if (is_null($this->read_at)) {
            $this->update(['read_at' => now()]);
        }
    }
}

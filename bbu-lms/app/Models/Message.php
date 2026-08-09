<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
        'type',
        'reply_to_id',
        'edited_at',
        'deleted_at',
    ];

    protected $casts = [
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }
}

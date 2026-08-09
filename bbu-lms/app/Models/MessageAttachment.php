<?php

namespace App\Models;

use Database\Factories\MessageAttachmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttachment extends Model
{
    /** @use HasFactory<MessageAttachmentFactory> */
    use HasFactory;

    protected $fillable = [
        'message_id',
        'file_name',
        'original_name',
        'mime_type',
        'size',
        'disk',
        'file_path',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}

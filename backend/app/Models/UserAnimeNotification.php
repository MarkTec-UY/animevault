<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAnimeNotification extends Model
{
    protected $table = 'schema_user.user_anime_notifications';

    protected $fillable = [
        'user_id',
        'anime_id',
        'type',
        'episode',
        'title',
        'body',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'anime_id' => 'integer',
            'episode' => 'integer',
            'read_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function anime(): BelongsTo
    {
        return $this->belongsTo(Anime::class, 'anime_id');
    }
}

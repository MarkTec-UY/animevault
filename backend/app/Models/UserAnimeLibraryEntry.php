<?php

namespace App\Models;

use App\Enums\UserAnimeStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAnimeLibraryEntry extends Model
{
    protected $table = 'user_anime_library';

    protected $fillable = [
        'user_id',
        'anime_id',
        'status',
        'progress_episodes',
        'score',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'anime_id' => 'integer',
            'status' => UserAnimeStatus::class,
            'progress_episodes' => 'integer',
            'score' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
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

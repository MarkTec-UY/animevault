<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAnimeFavorite extends Model
{
    protected $table = 'schema_user.user_anime_favorite';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'anime_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'anime_id' => 'integer',
            'created_at' => 'datetime',
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

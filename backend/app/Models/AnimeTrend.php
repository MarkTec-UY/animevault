<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnimeTrend extends Model
{
    protected $table = 'schema_anime.anime_trend';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'anime_id' => 'integer',
            'episode' => 'integer',
            'trending' => 'integer',
            'average_score' => 'integer',
            'popularity' => 'integer',
            'trend_date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    public function anime(): BelongsTo
    {
        return $this->belongsTo(Anime::class, 'anime_id');
    }
}

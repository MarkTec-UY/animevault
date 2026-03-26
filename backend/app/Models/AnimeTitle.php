<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnimeTitle extends Model
{
    protected $table = 'anime_title';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): BelongsTo
    {
        return $this->belongsTo(Anime::class, 'anime_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Genre extends Model
{
    protected $table = 'genre';

    protected $primaryKey = 'name';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): BelongsToMany
    {
        return $this->belongsToMany(Anime::class, 'schema_anime.anime_genre', 'genre_name', 'anime_id', 'name', 'id');
    }

    public function manga(): BelongsToMany
    {
        return $this->belongsToMany(Manga::class, 'schema_manga.manga_genre', 'genre_name', 'manga_id', 'name', 'id');
    }
}

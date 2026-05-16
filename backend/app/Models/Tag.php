<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $table = 'tag';

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): BelongsToMany
    {
        return $this->belongsToMany(Anime::class, 'schema_anime.anime_tag', 'tag_id', 'anime_id')
            ->withPivot('rank');
    }

    public function manga(): BelongsToMany
    {
        return $this->belongsToMany(Manga::class, 'schema_manga.manga_tag', 'tag_id', 'manga_id')
            ->withPivot('rank');
    }
}

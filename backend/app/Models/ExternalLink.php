<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ExternalLink extends Model
{
    protected $table = 'external_link';

    public $timestamps = false;

    protected $guarded = [];

    public function type(): BelongsTo
    {
        return $this->belongsTo(ExternalLinkType::class, 'type_code', 'code');
    }

    public function anime(): BelongsToMany
    {
        return $this->belongsToMany(Anime::class, 'schema_anime.anime_external_link', 'external_link_id', 'anime_id');
    }

    public function manga(): BelongsToMany
    {
        return $this->belongsToMany(Manga::class, 'schema_manga.manga_external_link', 'external_link_id', 'manga_id');
    }
}

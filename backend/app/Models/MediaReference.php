<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MediaReference extends Model
{
    protected $table = 'schema_core.media_catalog';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'is_adult' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'id', 'id');
    }

    public function typeReference(): BelongsTo
    {
        return $this->belongsTo(MediaType::class, 'type_code', 'code');
    }

    public function formatReference(): BelongsTo
    {
        return $this->belongsTo(MediaFormat::class, 'format_code', 'code');
    }

    public function statusReference(): BelongsTo
    {
        return $this->belongsTo(MediaStatus::class, 'status_code', 'code');
    }

    public function anime(): HasOne
    {
        return $this->hasOne(Anime::class, 'id', 'id');
    }

    public function manga(): HasOne
    {
        return $this->hasOne(Manga::class, 'id', 'id');
    }

    public function relatedAnime(): BelongsToMany
    {
        return $this->belongsToMany(Anime::class, 'anime_relation', 'related_media_id', 'anime_id', 'id', 'id')
            ->withPivot('relation_type_code', 'sort_order');
    }

    public function relatedManga(): BelongsToMany
    {
        return $this->belongsToMany(Manga::class, 'schema_manga.manga_relation', 'related_media_id', 'manga_id', 'id', 'id')
            ->withPivot('relation_type_code', 'sort_order');
    }
}

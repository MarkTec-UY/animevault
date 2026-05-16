<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Manga extends Model
{
    protected $table = 'schema_manga.manga';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'id_mal' => 'integer',
            'chapters' => 'integer',
            'volumes' => 'integer',
            'is_licensed' => 'boolean',
            'average_score' => 'integer',
            'mean_score' => 'integer',
            'popularity' => 'integer',
            'favourites' => 'integer',
            'is_adult' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'anilist_updated_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'id', 'id');
    }

    public function mediaReference(): HasOne
    {
        return $this->hasOne(MediaReference::class, 'id', 'id');
    }

    public function titles(): HasMany
    {
        return $this->hasMany(MangaTitle::class, 'manga_id');
    }

    public function formatReference(): BelongsTo
    {
        return $this->belongsTo(MediaFormat::class, 'format_code', 'code');
    }

    public function statusReference(): BelongsTo
    {
        return $this->belongsTo(MediaStatus::class, 'status_code', 'code');
    }

    public function sourceReference(): BelongsTo
    {
        return $this->belongsTo(MediaSource::class, 'source_code', 'code');
    }

    public function trailer(): HasOne
    {
        return $this->hasOne(MangaTrailer::class, 'manga_id', 'id');
    }

    public function relatedMedia(): BelongsToMany
    {
        return $this->belongsToMany(MediaReference::class, 'schema_manga.manga_relation', 'manga_id', 'related_media_id', 'id', 'id')
            ->withPivot('relation_type_code', 'sort_order');
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'schema_manga.manga_genre', 'manga_id', 'genre_name', 'id', 'name');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'schema_manga.manga_tag', 'manga_id', 'tag_id')
            ->withPivot('rank');
    }

    public function externalLinks(): BelongsToMany
    {
        return $this->belongsToMany(ExternalLink::class, 'schema_manga.manga_external_link', 'manga_id', 'external_link_id');
    }

    public function staffEntries(): HasMany
    {
        return $this->hasMany(MediaStaff::class, 'media_id', 'id');
    }

    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'schema_characters.media_character', 'media_id', 'character_id', 'id', 'id')
            ->withPivot('role_code', 'character_name_override', 'sort_order', 'created_at');
    }

    public function titleByType(string $type): ?string
    {
        if (! $this->relationLoaded('titles')) {
            return $this->titles()->where('title_type', $type)->value('title');
        }

        return $this->titles->firstWhere('title_type', $type)?->title;
    }
}

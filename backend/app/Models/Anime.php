<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anime extends Model
{
    protected $table = 'anime';

    public $incrementing = false;

    protected $keyType = 'int';

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'episodes' => 'integer',
            'next_airing_episode' => 'integer',
            'duration_minutes' => 'integer',
            'season_year' => 'integer',
            'average_score' => 'integer',
            'popularity' => 'integer',
            'favourites' => 'integer',
            'is_adult' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'next_airing_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function formatReference(): BelongsTo
    {
        return $this->belongsTo(MediaFormat::class, 'format_code', 'code');
    }

    public function statusReference(): BelongsTo
    {
        return $this->belongsTo(MediaStatus::class, 'status_code', 'code');
    }

    public function seasonReference(): BelongsTo
    {
        return $this->belongsTo(MediaSeason::class, 'season_code', 'code');
    }

    public function sourceReference(): BelongsTo
    {
        return $this->belongsTo(MediaSource::class, 'source_code', 'code');
    }

    public function titles(): HasMany
    {
        return $this->hasMany(AnimeTitle::class, 'anime_id');
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'anime_genre', 'anime_id', 'genre_name', 'id', 'name');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'anime_tag', 'anime_id', 'tag_id')
            ->withPivot('rank');
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'anime_company', 'anime_id', 'company_id')
            ->withPivot('is_main');
    }

    public function mainStudios(): BelongsToMany
    {
        return $this->companies()->wherePivot('is_main', true);
    }

    public function externalLinks(): BelongsToMany
    {
        return $this->belongsToMany(ExternalLink::class, 'anime_external_link', 'anime_id', 'external_link_id');
    }

    public function trends(): HasMany
    {
        return $this->hasMany(AnimeTrend::class, 'anime_id');
    }

    public function userLibraryEntries(): HasMany
    {
        return $this->hasMany(UserAnimeLibraryEntry::class, 'anime_id');
    }

    public function userNotifications(): HasMany
    {
        return $this->hasMany(UserAnimeNotification::class, 'anime_id');
    }

    public function favoritedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_anime_favorite', 'anime_id', 'user_id')
            ->withPivot('created_at');
    }

    public function titleByType(string $type): ?string
    {
        if (! $this->relationLoaded('titles')) {
            return $this->titles()->where('title_type', $type)->value('title');
        }

        return $this->titles->firstWhere('title_type', $type)?->title;
    }
}

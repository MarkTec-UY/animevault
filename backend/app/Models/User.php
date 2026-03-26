<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'password',
    'about_me',
    'avatar_path',
    'banner_path',
    'timezone',
    'is_profile_public',
    'preferred_title_language',
    'preferred_scoring_system',
])]
#[Hidden(['password', 'remember_token', 'avatar_path', 'banner_path'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const DEFAULT_TIMEZONE = 'UTC';

    public const DEFAULT_PREFERRED_TITLE_LANGUAGE = 'english';

    public const DEFAULT_PREFERRED_SCORING_SYSTEM = 'point_10';

    /**
     * @var list<string>
     */
    private const ALLOWED_PREFERRED_TITLE_LANGUAGES = ['romaji', 'english', 'native'];

    /**
     * @var list<string>
     */
    private const ALLOWED_PREFERRED_SCORING_SYSTEMS = [
        'point_100',
        'point_10_decimal',
        'point_10',
        'star_5',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_profile_public' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    public static function allowedPreferredTitleLanguages(): array
    {
        return self::ALLOWED_PREFERRED_TITLE_LANGUAGES;
    }

    /**
     * @return list<string>
     */
    public static function allowedPreferredScoringSystems(): array
    {
        return self::ALLOWED_PREFERRED_SCORING_SYSTEMS;
    }

    public function resolvedTimezone(): string
    {
        return in_array($this->timezone, timezone_identifiers_list(), true)
            ? $this->timezone
            : self::DEFAULT_TIMEZONE;
    }

    public function isProfilePubliclyVisible(): bool
    {
        return $this->is_profile_public ?? true;
    }

    public function resolvedPreferredTitleLanguage(): string
    {
        return in_array($this->preferred_title_language, self::ALLOWED_PREFERRED_TITLE_LANGUAGES, true)
            ? $this->preferred_title_language
            : self::DEFAULT_PREFERRED_TITLE_LANGUAGE;
    }

    public function resolvedPreferredScoringSystem(): string
    {
        return in_array($this->preferred_scoring_system, self::ALLOWED_PREFERRED_SCORING_SYSTEMS, true)
            ? $this->preferred_scoring_system
            : self::DEFAULT_PREFERRED_SCORING_SYSTEM;
    }

    /**
     * @param  array{romaji:?string, english:?string, native:?string}  $titles
     */
    public function preferredAnimeTitle(array $titles, ?int $animeId = null): ?string
    {
        $orderedTypes = match ($this->resolvedPreferredTitleLanguage()) {
            'romaji' => ['romaji', 'english', 'native'],
            'native' => ['native', 'romaji', 'english'],
            default => ['english', 'romaji', 'native'],
        };

        foreach ($orderedTypes as $type) {
            if (filled($titles[$type] ?? null)) {
                return $titles[$type];
            }
        }

        return $animeId === null ? null : "Anime #{$animeId}";
    }

    public function avatarUrl(): ?string
    {
        return filled($this->avatar_path)
            ? $this->publicDisk()->url($this->avatar_path)
            : null;
    }

    public function bannerUrl(): ?string
    {
        return filled($this->banner_path)
            ? $this->publicDisk()->url($this->banner_path)
            : null;
    }

    private function publicDisk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk;
    }

    public function animeLibraryEntries(): HasMany
    {
        return $this->hasMany(UserAnimeLibraryEntry::class);
    }

    public function favoriteAnimeEntries(): HasMany
    {
        return $this->hasMany(UserAnimeFavorite::class);
    }

    public function favoriteAnime(): BelongsToMany
    {
        return $this->belongsToMany(Anime::class, 'user_anime_favorite', 'user_id', 'anime_id')
            ->withPivot('created_at');
    }

    public function animeNotifications(): HasMany
    {
        return $this->hasMany(UserAnimeNotification::class);
    }
}

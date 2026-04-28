<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\ApiTokenAbility;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'username',
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

    public const DEFAULT_TIMEZONE = 'America/Montevideo';

    public const DEFAULT_PREFERRED_TITLE_LANGUAGE = 'english';

    public const DEFAULT_PREFERRED_SCORING_SYSTEM = 'point_10';

    /**
     * @var array<string, string>
     */
    private const TIMEZONE_OPTIONS = [
        'Pacific/Pago_Pago' => '(GMT-11:00) Pago Pago',
        'Pacific/Honolulu' => '(GMT-10:00) Hawaii Time',
        'America/Anchorage' => '(GMT-09:00) Alaska Time',
        'America/Los_Angeles' => '(GMT-08:00) Pacific Time',
        'America/Denver' => '(GMT-07:00) Mountain Time',
        'America/Chicago' => '(GMT-06:00) Central Time',
        'America/New_York' => '(GMT-05:00) Eastern Time',
        'America/Halifax' => '(GMT-04:00) Atlantic Time - Halifax',
        'America/Montevideo' => '(GMT-03:00) Montevideo',
        'Atlantic/South_Georgia' => '(GMT-02:00) Mid-Atlantic',
        'Atlantic/Azores' => '(GMT-01:00) Azores',
        'Europe/London' => '(GMT+00:00) London',
        'Europe/Berlin' => '(GMT+01:00) Berlin',
        'Europe/Helsinki' => '(GMT+02:00) Helsinki',
        'Europe/Istanbul' => '(GMT+03:00) Istanbul',
        'Asia/Dubai' => '(GMT+04:00) Dubai',
        'Asia/Kabul' => '(GMT+04:30) Kabul',
        'Indian/Maldives' => '(GMT+05:00) Maldives',
        'Asia/Kolkata' => '(GMT+05:30) India Standard Time',
        'Asia/Kathmandu' => '(GMT+05:45) Kathmandu',
        'Asia/Dhaka' => '(GMT+06:00) Dhaka',
        'Indian/Cocos' => '(GMT+06:30) Cocos',
        'Asia/Bangkok' => '(GMT+07:00) Bangkok',
        'Asia/Hong_Kong' => '(GMT+08:00) Hong Kong',
        'Asia/Pyongyang' => '(GMT+08:30) Pyongyang',
        'Asia/Tokyo' => '(GMT+09:00) Tokyo',
        'Australia/Darwin' => '(GMT+09:30) Central Time - Darwin',
        'Australia/Brisbane' => '(GMT+10:00) Eastern Time - Brisbane',
        'Australia/Adelaide' => '(GMT+10:30) Central Time - Adelaide',
        'Australia/Sydney' => '(GMT+11:00) Eastern Time - Melbourne, Sydney',
        'Pacific/Nauru' => '(GMT+12:00) Nauru',
        'Pacific/Auckland' => '(GMT+13:00) Auckland',
        'Pacific/Kiritimati' => '(GMT+14:00) Kiritimati',
    ];

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
            'role' => UserRole::class,
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

    /**
     * @return list<string>
     */
    public static function allowedTimezones(): array
    {
        return array_keys(self::TIMEZONE_OPTIONS);
    }

    /**
     * @return array<array{value:string, label:string}>
     */
    public static function timezoneOptions(): array
    {
        return array_map(
            fn (string $zone, string $label): array => [
                'value' => $zone,
                'label' => $label,
            ],
            array_keys(self::TIMEZONE_OPTIONS),
            array_values(self::TIMEZONE_OPTIONS),
        );
    }

    public function resolvedTimezone(): string
    {
        return in_array($this->timezone, self::allowedTimezones(), true)
            ? $this->timezone
            : self::DEFAULT_TIMEZONE;
    }

    public function isProfilePubliclyVisible(): bool
    {
        return $this->is_profile_public ?? true;
    }

    public function resolvedRole(): UserRole
    {
        if ($this->role instanceof UserRole) {
            return $this->role;
        }

        return UserRole::tryFrom((string) $this->role) ?? UserRole::User;
    }

    public function hasRole(UserRole|string $role): bool
    {
        $normalizedRole = $this->normalizeRole($role);

        return $normalizedRole !== null && $this->resolvedRole() === $normalizedRole;
    }

    public function hasAnyRole(UserRole|string ...$roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    public function canManageNews(): bool
    {
        return $this->resolvedRole()->canManageNews();
    }

    /**
     * @return list<string>
     */
    public function apiTokenAbilities(): array
    {
        $abilities = [ApiTokenAbility::Authenticated->value];

        if ($this->canManageNews()) {
            $abilities[] = ApiTokenAbility::ManageNews->value;
        }

        return $abilities;
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

    private function normalizeRole(UserRole|string $role): ?UserRole
    {
        return $role instanceof UserRole ? $role : UserRole::tryFrom($role);
    }
}

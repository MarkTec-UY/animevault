<?php

namespace App\Services\User;

use App\Enums\UserAnimeStatus;
use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeFavorite;
use App\Models\UserAnimeLibraryEntry;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class UserAnimeLibraryService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{data:list<array<string, mixed>>, meta:array<string, mixed>}
     */
    public function paginateLibrary(User $user, array $filters): array
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $statuses = $this->normalizeStatuses($filters['status'] ?? null);
        $page = max((int) ($filters['page'] ?? 1), 1);
        $version = $this->currentUserAnimeStateVersion($user);

        return $this->cacheStore()->remember(
            $this->libraryListCacheKey($user, $version, $statuses, $perPage, $page),
            $this->cacheTtl('user_library'),
            function () use ($user, $filters, $perPage, $statuses): array {
                $query = UserAnimeLibraryEntry::query()
                    ->where('user_id', $user->id)
                    ->with($this->libraryRelations())
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id');

                if ($statuses !== []) {
                    $query->whereIn('status', $statuses);
                }

                $paginator = $query->paginate($perPage)->appends($filters);
                $favoriteAnimeIds = $this->favoriteAnimeIds($user, collect($paginator->items())->pluck('anime_id')->all());

                return [
                    'data' => collect($paginator->items())
                        ->map(fn (UserAnimeLibraryEntry $entry): array => [
                            'anime' => $this->mapAnimePreview($entry->anime, $user),
                            'library_entry' => $this->mapLibraryEntry(
                                $entry,
                                in_array($entry->anime_id, $favoriteAnimeIds, true),
                                $user,
                            ),
                        ])
                        ->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'status' => $statuses,
                    ],
                ];
            },
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function state(User $user, Anime $anime): array
    {
        $version = $this->currentUserAnimeStateVersion($user);

        return $this->cacheStore()->remember(
            $this->stateCacheKey($user, $version, (int) $anime->id),
            $this->cacheTtl('user_state'),
            function () use ($user, $anime): array {
                $anime->loadMissing($this->animeRelations());

                $entry = UserAnimeLibraryEntry::query()
                    ->where('user_id', $user->id)
                    ->where('anime_id', $anime->id)
                    ->first();

                $isFavorite = UserAnimeFavorite::query()
                    ->where('user_id', $user->id)
                    ->where('anime_id', $anime->id)
                    ->exists();

                return [
                    'anime' => $this->mapAnimePreview($anime, $user),
                    'is_favorite' => $isFavorite,
                    'library_entry' => $entry === null
                        ? null
                        : $this->mapLibraryEntry($entry->setRelation('anime', $anime), $isFavorite, $user),
                ];
            },
        );
    }

    public function upsert(User $user, Anime $anime, array $payload): UserAnimeLibraryEntry
    {
        $anime->loadMissing($this->animeRelations());

        $entry = UserAnimeLibraryEntry::query()->firstOrNew([
            'user_id' => $user->id,
            'anime_id' => $anime->id,
        ]);

        $normalizedPayload = $this->normalizeLibraryPayload($payload, $anime, $entry);

        $entry->fill($normalizedPayload);
        $entry->save();
        $entry->setRelation('anime', $anime);

        if ($entry->wasRecentlyCreated || $entry->wasChanged()) {
            $this->bumpUserAnimeStateVersion($user);
        }

        return $entry;
    }

    public function remove(User $user, Anime $anime): void
    {
        $deleted = UserAnimeLibraryEntry::query()
            ->where('user_id', $user->id)
            ->where('anime_id', $anime->id)
            ->delete();

        if ($deleted > 0) {
            $this->bumpUserAnimeStateVersion($user);
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data:list<array<string, mixed>>, meta:array<string, mixed>}
     */
    public function paginateFavorites(User $user, array $filters): array
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $page = max((int) ($filters['page'] ?? 1), 1);
        $version = $this->currentUserAnimeStateVersion($user);

        return $this->cacheStore()->remember(
            $this->favoritesListCacheKey($user, $version, $perPage, $page),
            $this->cacheTtl('user_favorites'),
            function () use ($user, $filters, $perPage): array {
                $query = UserAnimeFavorite::query()
                    ->where('user_id', $user->id)
                    ->with([
                        'anime' => fn (BelongsTo $relation) => $relation->with($this->animeRelations()),
                    ])
                    ->orderByDesc('created_at')
                    ->orderByDesc('anime_id');

                $paginator = $query->paginate($perPage)->appends($filters);
                $libraryEntries = $this->libraryEntriesByAnimeId($user, collect($paginator->items())->pluck('anime_id')->all());

                return [
                    'data' => collect($paginator->items())
                        ->map(function (UserAnimeFavorite $favorite) use ($libraryEntries, $user): array {
                            /** @var UserAnimeLibraryEntry|null $libraryEntry */
                            $libraryEntry = $libraryEntries[$favorite->anime_id] ?? null;

                            return [
                                'anime' => $this->mapAnimePreview($favorite->anime, $user),
                                'is_favorite' => true,
                                'favorited_at' => $this->nullableDateTimeString($favorite->created_at, $user),
                                'library_entry' => $libraryEntry === null ? null : $this->mapLibraryEntry($libraryEntry, true, $user),
                            ];
                        })
                        ->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                    ],
                ];
            },
        );
    }

    public function addFavorite(User $user, Anime $anime): UserAnimeFavorite
    {
        $anime->loadMissing($this->animeRelations());

        $favorite = UserAnimeFavorite::query()->firstOrCreate([
            'user_id' => $user->id,
            'anime_id' => $anime->id,
        ]);

        $favorite->setRelation('anime', $anime);

        if ($favorite->wasRecentlyCreated) {
            $this->bumpUserAnimeStateVersion($user);
        }

        return $favorite;
    }

    public function removeFavorite(User $user, Anime $anime): void
    {
        $deleted = UserAnimeFavorite::query()
            ->where('user_id', $user->id)
            ->where('anime_id', $anime->id)
            ->delete();

        if ($deleted > 0) {
            $this->bumpUserAnimeStateVersion($user);
        }
    }

    /**
     * @param  array<int, mixed>|mixed  $values
     * @return list<string>
     */
    private function normalizeStatuses(mixed $values): array
    {
        if (! is_array($values)) {
            return [];
        }

        return collect($values)
            ->filter(fn (mixed $value): bool => filled($value))
            ->map(fn (mixed $value): string => trim((string) $value))
            ->values()
            ->all();
    }

    /**
     * @return array<int, string|\Closure>
     */
    private function animeRelations(): array
    {
        return [
            'formatReference:code,description',
            'statusReference:code,description',
            'titles',
        ];
    }

    /**
     * @return array<int, string|\Closure>
     */
    private function libraryRelations(): array
    {
        return [
            'anime' => fn (BelongsTo $relation) => $relation->with($this->animeRelations()),
        ];
    }

    /**
     * @param  list<int>  $animeIds
     * @return list<int>
     */
    private function favoriteAnimeIds(User $user, array $animeIds): array
    {
        if ($animeIds === []) {
            return [];
        }

        return UserAnimeFavorite::query()
            ->where('user_id', $user->id)
            ->whereIn('anime_id', $animeIds)
            ->pluck('anime_id')
            ->map(fn (mixed $animeId): int => (int) $animeId)
            ->all();
    }

    /**
     * @param  list<int>  $animeIds
     * @return array<int, UserAnimeLibraryEntry>
     */
    private function libraryEntriesByAnimeId(User $user, array $animeIds): array
    {
        if ($animeIds === []) {
            return [];
        }

        return UserAnimeLibraryEntry::query()
            ->where('user_id', $user->id)
            ->whereIn('anime_id', $animeIds)
            ->with([
                'anime' => fn (BelongsTo $relation) => $relation->with($this->animeRelations()),
            ])
            ->get()
            ->keyBy('anime_id')
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAnimePreview(Anime $anime, User $user): array
    {
        $titles = [
            'romaji' => $anime->titleByType('romaji'),
            'english' => $anime->titleByType('english'),
            'native' => $anime->titleByType('native'),
        ];

        return [
            'id' => (int) $anime->id,
            'preferred_title' => $user->preferredAnimeTitle($titles, (int) $anime->id),
            'titles' => $titles,
            'episodes' => $this->nullableInt($anime->episodes),
            'format' => $this->mapReference($anime->formatReference?->code, $anime->formatReference?->description),
            'status' => $this->mapReference($anime->statusReference?->code, $anime->statusReference?->description),
            'cover_image' => [
                'color' => $anime->cover_image_color,
                'large' => $anime->cover_image_large,
            ],
            'banner_image' => $anime->banner_image,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapLibraryEntry(UserAnimeLibraryEntry $entry, bool $isFavorite, User $user): array
    {
        $totalEpisodes = $entry->anime?->episodes;

        return [
            'status' => $entry->status instanceof UserAnimeStatus ? $entry->status->value : (string) $entry->status,
            'progress_episodes' => (int) $entry->progress_episodes,
            'progress_label' => $this->progressLabel((int) $entry->progress_episodes, $this->nullableInt($totalEpisodes)),
            'score' => $this->nullableInt($entry->score),
            'started_at' => $this->nullableDateTimeString($entry->started_at, $user),
            'completed_at' => $this->nullableDateTimeString($entry->completed_at, $user),
            'updated_at' => $this->nullableDateTimeString($entry->updated_at, $user),
            'is_favorite' => $isFavorite,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $existingAttributes
     * @return array<string, mixed>
     */
    private function normalizeLibraryPayload(array $payload, Anime $anime, UserAnimeLibraryEntry $entry): array
    {
        $status = (string) $payload['status'];
        $existingAttributes = $entry->exists ? $entry->getAttributes() : [];
        $progressEpisodes = array_key_exists('progress_episodes', $payload)
            ? (int) $payload['progress_episodes']
            : (int) ($existingAttributes['progress_episodes'] ?? 0);

        if ($status === UserAnimeStatus::Completed->value && ! array_key_exists('progress_episodes', $payload) && $anime->episodes !== null) {
            $progressEpisodes = (int) $anime->episodes;
        }

        if ($anime->episodes !== null && $progressEpisodes > (int) $anime->episodes) {
            throw ValidationException::withMessages([
                'progress_episodes' => ['Progress cannot be greater than the total number of episodes for this anime.'],
            ]);
        }

        return [
            'status' => $status,
            'progress_episodes' => $progressEpisodes,
            'score' => array_key_exists('score', $payload)
                ? $payload['score'] === null ? null : (int) $payload['score']
                : ($existingAttributes['score'] ?? null),
            'started_at' => array_key_exists('started_at', $payload)
                ? $payload['started_at']
                : ($existingAttributes['started_at'] ?? null),
            'completed_at' => array_key_exists('completed_at', $payload)
                ? $payload['completed_at']
                : ($existingAttributes['completed_at'] ?? null),
        ];
    }

    /**
     * @return array{code:string, description:?string}|null
     */
    private function mapReference(?string $code, ?string $description): ?array
    {
        if ($code === null) {
            return null;
        }

        return [
            'code' => $code,
            'description' => $description,
        ];
    }

    private function nullableInt(mixed $value): ?int
    {
        return $value === null ? null : (int) $value;
    }

    private function nullableDateTimeString(mixed $value, ?User $user = null): ?string
    {
        if ($value === null) {
            return null;
        }

        $dateTime = $value instanceof CarbonImmutable
            ? $value
            : CarbonImmutable::parse((string) $value);

        if ($user !== null) {
            return $dateTime->setTimezone($user->resolvedTimezone())->toAtomString();
        }

        return $dateTime->toAtomString();
    }

    private function progressLabel(int $progressEpisodes, ?int $totalEpisodes): string
    {
        return $totalEpisodes === null
            ? (string) $progressEpisodes
            : sprintf('%d/%d', $progressEpisodes, $totalEpisodes);
    }

    private function cacheStore(): CacheRepository
    {
        return Cache::store(config('anime.cache.store', 'redis'));
    }

    private function cacheTtl(string $key): int
    {
        return (int) config("anime.cache.ttls.{$key}", 120);
    }

    private function currentUserAnimeStateVersion(User $user): int
    {
        $versionKey = $this->userAnimeStateVersionKey($user);
        $version = $this->cacheStore()->get($versionKey);

        if (is_numeric($version) && (int) $version > 0) {
            return (int) $version;
        }

        $this->cacheStore()->forever($versionKey, 1);

        return 1;
    }

    private function bumpUserAnimeStateVersion(User $user): void
    {
        $this->cacheStore()->increment($this->userAnimeStateVersionKey($user));
    }

    /**
     * @param  list<string>  $statuses
     */
    private function libraryListCacheKey(User $user, int $version, array $statuses, int $perPage, int $page): string
    {
        return 'user_anime_state:library:'.sha1((string) json_encode([
            'user_id' => $user->id,
            'version' => $version,
            'timezone' => $user->resolvedTimezone(),
            'title_language' => $user->resolvedPreferredTitleLanguage(),
            'status' => $statuses,
            'per_page' => $perPage,
            'page' => $page,
        ]));
    }

    private function favoritesListCacheKey(User $user, int $version, int $perPage, int $page): string
    {
        return 'user_anime_state:favorites:'.sha1((string) json_encode([
            'user_id' => $user->id,
            'version' => $version,
            'timezone' => $user->resolvedTimezone(),
            'title_language' => $user->resolvedPreferredTitleLanguage(),
            'per_page' => $perPage,
            'page' => $page,
        ]));
    }

    private function stateCacheKey(User $user, int $version, int $animeId): string
    {
        return 'user_anime_state:state:'.sha1((string) json_encode([
            'user_id' => $user->id,
            'version' => $version,
            'anime_id' => $animeId,
            'timezone' => $user->resolvedTimezone(),
            'title_language' => $user->resolvedPreferredTitleLanguage(),
        ]));
    }

    private function userAnimeStateVersionKey(User $user): string
    {
        return "user_anime_state:version:{$user->id}";
    }
}

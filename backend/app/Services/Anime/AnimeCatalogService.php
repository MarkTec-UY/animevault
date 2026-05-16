<?php

namespace App\Services\Anime;

use App\Models\Anime;
use App\Models\Genre;
use App\Models\MediaFormat;
use App\Models\MediaSeason;
use App\Models\MediaSource;
use App\Models\MediaStatus;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class AnimeCatalogService
{
    /**
     * @var array<string, string>
     */
    private const SORT_LABELS = [
        'popularity_desc' => 'Most popular',
        'score_desc' => 'Highest score',
        'favourites_desc' => 'Most favourited',
        'recently_updated' => 'Recently updated',
        'start_date_desc' => 'Newest release date',
        'title_asc' => 'Title A-Z',
    ];

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data:list<array<string, mixed>>, meta:array<string, mixed>}
     */
    public function paginate(array $filters, ?User $user = null): array
    {
        $sort = $this->normalizeSort($filters['sort'] ?? null);
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $appliedFilters = $this->appliedFilters($filters);
        $page = max((int) ($filters['page'] ?? 1), 1);
        $titleLanguage = $user?->resolvedPreferredTitleLanguage() ?? User::DEFAULT_PREFERRED_TITLE_LANGUAGE;

        return $this->cacheStore()->remember(
            $this->listCacheKey($appliedFilters, $sort, $perPage, $page, $titleLanguage),
            $this->cacheTtl('list'),
            function () use ($filters, $sort, $perPage, $appliedFilters, $user): array {
                $query = Anime::query()
                    ->select('schema_anime.anime.*')
                    ->with($this->summaryRelations())
                    ->leftJoin('schema_anime.anime_title as title_romaji', function ($join): void {
                        $join->on('title_romaji.anime_id', '=', 'schema_anime.anime.id')
                            ->where('title_romaji.title_type', '=', 'romaji');
                    })
                    ->leftJoin('schema_anime.anime_title as title_english', function ($join): void {
                        $join->on('title_english.anime_id', '=', 'schema_anime.anime.id')
                            ->where('title_english.title_type', '=', 'english');
                    })
                    ->leftJoin('schema_anime.anime_title as title_native', function ($join): void {
                        $join->on('title_native.anime_id', '=', 'schema_anime.anime.id')
                            ->where('title_native.title_type', '=', 'native');
                    });

                $this->applyFilters($query, $filters);
                $this->applySorting($query, $sort);

                $paginator = $query->paginate($perPage)->appends($filters);

                return [
                    'data' => collect($paginator->items())
                        ->map(fn (Anime $anime): array => $this->summary($anime, $user))
                        ->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'sort' => $sort,
                        'filters' => $appliedFilters,
                    ],
                ];
            },
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $animeId, ?User $user = null): ?array
    {
        $cacheKey = $this->detailCacheKey(
            $animeId,
            $user?->resolvedPreferredTitleLanguage() ?? User::DEFAULT_PREFERRED_TITLE_LANGUAGE,
        );
        $cachedAnime = $this->cacheStore()->get($cacheKey);

        if (is_array($cachedAnime)) {
            return $cachedAnime;
        }

        $anime = Anime::query()
            ->with($this->detailRelations())
            ->find($animeId);

        if ($anime === null) {
            return null;
        }

        $payload = array_merge(
            $this->summary($anime, $user),
            [
                'description' => $anime->description,
                'end_date' => $this->nullableDateString($anime->end_date),
                'created_at' => $this->nullableDateTimeString($anime->created_at),
                'companies' => $anime->companies
                    ->map(fn ($company): array => [
                        'id' => (int) $company->id,
                        'name' => $company->name,
                        'is_main' => (bool) $company->pivot->is_main,
                    ])
                    ->values()
                    ->all(),
                'tags' => $anime->tags
                    ->map(fn ($tag): array => [
                        'id' => (int) $tag->id,
                        'name' => $tag->name,
                        'description' => $tag->description,
                        'category' => $tag->category,
                        'rank' => $this->nullableInt($tag->pivot->rank),
                    ])
                    ->values()
                    ->all(),
                'external_links' => $anime->externalLinks
                    ->map(fn ($externalLink): array => [
                        'id' => (int) $externalLink->id,
                        'site' => $externalLink->site,
                        'url' => $externalLink->url,
                        'type' => $this->mapReference($externalLink->type?->code, $externalLink->type?->description),
                        'language' => $externalLink->language,
                        'color' => $externalLink->color,
                        'icon' => $externalLink->icon,
                    ])
                    ->values()
                    ->all(),
                'trends' => $anime->trends
                    ->map(fn ($trend): array => [
                        'trend_date' => $this->nullableDateString($trend->trend_date) ?? '',
                        'episode' => (int) $trend->episode,
                        'trending' => $this->nullableInt($trend->trending),
                        'average_score' => $this->nullableInt($trend->average_score),
                        'popularity' => $this->nullableInt($trend->popularity),
                        'created_at' => $this->nullableDateTimeString($trend->created_at),
                    ])
                    ->values()
                    ->all(),
            ],
        );

        $this->cacheStore()->put($cacheKey, $payload, $this->cacheTtl('detail'));

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return $this->cacheStore()->remember(
            $this->filtersCacheKey(),
            $this->cacheTtl('filters'),
            fn (): array => [
                'formats' => $this->referenceOptions(MediaFormat::query()),
                'statuses' => $this->referenceOptions(MediaStatus::query()),
                'seasons' => $this->referenceOptions(MediaSeason::query()),
                'sources' => $this->referenceOptions(MediaSource::query()),
                'genres' => Genre::query()
                    ->orderBy('name')
                    ->pluck('name')
                    ->all(),
                'years' => Anime::query()
                    ->whereNotNull('season_year')
                    ->distinct()
                    ->orderByDesc('season_year')
                    ->pluck('season_year')
                    ->map(fn (mixed $year): int => (int) $year)
                    ->all(),
                'sort_options' => $this->sortOptions(),
            ],
        );
    }

    /**
     * @return list<array{value:string, label:string}>
     */
    public function sortOptions(): array
    {
        return collect(self::SORT_LABELS)
            ->map(fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, string|\Closure>
     */
    public function summaryRelations(): array
    {
        return [
            'formatReference:code,description',
            'statusReference:code,description',
            'seasonReference:code,description',
            'sourceReference:code,description',
            'titles',
            'genres' => fn (BelongsToMany $relation) => $relation
                ->select('genre.name')
                ->orderBy('genre.name'),
            'mainStudios' => fn (BelongsToMany $relation) => $relation
                ->select('company.id', 'company.name')
                ->orderBy('company.name'),
        ];
    }

    /**
     * @return array<int, string|\Closure>
     */
    private function detailRelations(): array
    {
        return [
            ...$this->summaryRelations(),
            'companies' => fn (BelongsToMany $relation) => $relation
                ->select('company.id', 'company.name')
                ->orderByDesc('anime_company.is_main')
                ->orderBy('company.name'),
            'tags' => fn (BelongsToMany $relation) => $relation
                ->select('tag.id', 'tag.name', 'tag.description', 'tag.category')
                ->orderByDesc('anime_tag.rank')
                ->orderBy('tag.name'),
            'externalLinks' => fn (BelongsToMany $relation) => $relation
                ->select([
                    'external_link.id',
                    'external_link.site',
                    'external_link.url',
                    'external_link.type_code',
                    'external_link.language',
                    'external_link.color',
                    'external_link.icon',
                ])
                ->with('type:code,description')
                ->orderBy('external_link.site'),
            'trends' => fn (HasMany $relation) => $relation
                ->orderBy('trend_date')
                ->orderBy('episode'),
        ];
    }

    /**
     * @param  Builder<Anime>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $searchTerm = '%'.mb_strtolower($search).'%';

            $query->where(function (Builder $searchQuery) use ($search, $searchTerm): void {
                if (ctype_digit($search)) {
                    $searchQuery->orWhereKey((int) $search);
                }

                $searchQuery->orWhereRaw('LOWER(COALESCE(title_romaji.title, \'\')) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(COALESCE(title_english.title, \'\')) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(COALESCE(title_native.title, \'\')) LIKE ?', [$searchTerm]);
            });
        }

        $this->applyWhereIn($query, 'schema_anime.anime.status_code', $filters['status'] ?? null);
        $this->applyWhereIn($query, 'schema_anime.anime.format_code', $filters['format'] ?? null);
        $this->applyWhereIn($query, 'schema_anime.anime.season_code', $filters['season'] ?? null);
        $this->applyWhereIn($query, 'schema_anime.anime.source_code', $filters['source'] ?? null);

        if (($filters['year'] ?? null) !== null) {
            $query->where('schema_anime.anime.season_year', (int) $filters['year']);
        }

        if (($filters['is_adult'] ?? null) !== null) {
            $query->where('schema_anime.anime.is_adult', filter_var($filters['is_adult'], FILTER_VALIDATE_BOOL));
        }

        $genres = $this->normalizeArray($filters['genres'] ?? null);

        if ($genres !== []) {
            $query->whereHas('genres', function (Builder $genreQuery) use ($genres): void {
                $genreQuery->whereIn('genre.name', $genres);
            });
        }
    }

    /**
     * @param  Builder<Anime>  $query
     */
    private function applySorting(Builder $query, string $sort): void
    {
        match ($sort) {
            'score_desc' => $query->orderByDesc('schema_anime.anime.average_score')->orderBy('schema_anime.anime.id'),
            'favourites_desc' => $query->orderByDesc('schema_anime.anime.favourites')->orderBy('schema_anime.anime.id'),
            'recently_updated' => $query->orderByDesc('schema_anime.anime.updated_at')->orderBy('schema_anime.anime.id'),
            'start_date_desc' => $query->orderByDesc('schema_anime.anime.start_date')->orderBy('schema_anime.anime.id'),
            'title_asc' => $query->orderByRaw(
                'COALESCE(title_english.title, title_romaji.title, title_native.title) ASC'
            )->orderBy('schema_anime.anime.id'),
            default => $query->orderByDesc('schema_anime.anime.popularity')->orderBy('schema_anime.anime.id'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(Anime $anime, ?User $user = null): array
    {
        $titles = [
            'romaji' => $anime->titleByType('romaji'),
            'english' => $anime->titleByType('english'),
            'native' => $anime->titleByType('native'),
        ];

        $mainStudio = $anime->mainStudios->first();

        return [
            'id' => (int) $anime->id,
            'preferred_title' => $this->preferredTitle($titles, $anime, $user),
            'titles' => $titles,
            'format' => $this->mapReference($anime->formatReference?->code, $anime->formatReference?->description),
            'status' => $this->mapReference($anime->statusReference?->code, $anime->statusReference?->description),
            'episodes' => $this->nullableInt($anime->episodes),
            'duration_minutes' => $this->nullableInt($anime->duration_minutes),
            'season' => $this->mapReference($anime->seasonReference?->code, $anime->seasonReference?->description),
            'season_year' => $this->nullableInt($anime->season_year),
            'source' => $this->mapReference($anime->sourceReference?->code, $anime->sourceReference?->description),
            'average_score' => $this->nullableInt($anime->average_score),
            'popularity' => $this->nullableInt($anime->popularity),
            'favourites' => $this->nullableInt($anime->favourites),
            'is_adult' => (bool) $anime->is_adult,
            'start_date' => $this->nullableDateString($anime->start_date),
            'updated_at' => $this->nullableDateTimeString($anime->updated_at),
            'cover_image' => [
                'color' => $anime->cover_image_color,
                'large' => $anime->cover_image_large,
            ],
            'banner_image' => $anime->banner_image,
            'genres' => $anime->genres->pluck('name')->values()->all(),
            'main_studio' => $mainStudio === null ? null : [
                'id' => (int) $mainStudio->id,
                'name' => $mainStudio->name,
            ],
        ];
    }

    /**
     * @param  Builder<MediaFormat|MediaSeason|MediaSource|MediaStatus>  $query
     * @return list<array{code:string, description:string}>
     */
    private function referenceOptions(Builder $query): array
    {
        return $query
            ->orderBy('description')
            ->get(['code', 'description'])
            ->map(fn ($row): array => [
                'code' => $row->code,
                'description' => $row->description,
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function appliedFilters(array $filters): array
    {
        return [
            'search' => filled($filters['search'] ?? null) ? trim((string) $filters['search']) : null,
            'status' => $this->normalizeArray($filters['status'] ?? null),
            'format' => $this->normalizeArray($filters['format'] ?? null),
            'season' => $this->normalizeArray($filters['season'] ?? null),
            'source' => $this->normalizeArray($filters['source'] ?? null),
            'genres' => $this->normalizeArray($filters['genres'] ?? null),
            'year' => ($filters['year'] ?? null) === null ? null : (int) $filters['year'],
            'is_adult' => ($filters['is_adult'] ?? null) === null
                ? null
                : filter_var($filters['is_adult'], FILTER_VALIDATE_BOOL),
        ];
    }

    /**
     * @param  array<int, mixed>|mixed  $values
     * @return list<string>
     */
    private function normalizeArray(mixed $values): array
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
     * @param  Builder<Anime>  $query
     * @param  array<int, mixed>|mixed  $values
     */
    private function applyWhereIn(Builder $query, string $column, mixed $values): void
    {
        $normalizedValues = $this->normalizeArray($values);

        if ($normalizedValues !== []) {
            $query->whereIn($column, $normalizedValues);
        }
    }

    private function normalizeSort(mixed $sort): string
    {
        $value = is_string($sort) ? $sort : 'popularity_desc';

        return array_key_exists($value, self::SORT_LABELS) ? $value : 'popularity_desc';
    }

    /**
     * @param  array{romaji:?string, english:?string, native:?string}  $titles
     */
    private function preferredTitle(array $titles, Anime $anime, ?User $user = null): ?string
    {
        return $user?->preferredAnimeTitle($titles, (int) $anime->id)
            ?? $titles['english']
            ?? $titles['romaji']
            ?? $titles['native'];
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

    private function nullableString(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    private function nullableDateString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->toDateString();
        }

        return (string) $value;
    }

    private function nullableDateTimeString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->toDateTimeString();
        }

        return (string) $value;
    }

    private function cacheStore(): CacheRepository
    {
        return Cache::store(config('anime.cache.store', 'redis'));
    }

    private function cacheTtl(string $key): int
    {
        return (int) config("anime.cache.ttls.{$key}", 300);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function listCacheKey(array $filters, string $sort, int $perPage, int $page, string $titleLanguage): string
    {
        return 'anime_api:list:'.sha1((string) json_encode([
            'filters' => $filters,
            'sort' => $sort,
            'per_page' => $perPage,
            'page' => $page,
            'title_language' => $titleLanguage,
        ]));
    }

    private function detailCacheKey(int $animeId, string $titleLanguage): string
    {
        return "anime_api:detail:{$animeId}:{$titleLanguage}";
    }

    private function filtersCacheKey(): string
    {
        return 'anime_api:filters';
    }
}

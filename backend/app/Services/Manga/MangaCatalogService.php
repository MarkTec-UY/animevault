<?php

namespace App\Services\Manga;

use App\Models\Genre;
use App\Models\Manga;
use App\Models\MediaFormat;
use App\Models\MediaSource;
use App\Models\MediaStatus;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Cache;

class MangaCatalogService
{
    /**
     * @var array<string, string>
     */
    private const SORT_LABELS = [
        'trending_desc' => 'Trending now',
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
                $query = Manga::query()
                    ->select('schema_manga.manga.*')
                    ->with($this->summaryRelations())
                    ->leftJoin('schema_manga.manga_title as title_romaji', function ($join): void {
                        $join->on('title_romaji.manga_id', '=', 'schema_manga.manga.id')
                            ->where('title_romaji.title_type', '=', 'romaji');
                    })
                    ->leftJoin('schema_manga.manga_title as title_english', function ($join): void {
                        $join->on('title_english.manga_id', '=', 'schema_manga.manga.id')
                            ->where('title_english.title_type', '=', 'english');
                    })
                    ->leftJoin('schema_manga.manga_title as title_native', function ($join): void {
                        $join->on('title_native.manga_id', '=', 'schema_manga.manga.id')
                            ->where('title_native.title_type', '=', 'native');
                    });

                $this->applyFilters($query, $filters);
                $this->applySorting($query, $sort);

                $paginator = $query->paginate($perPage)->appends($filters);

                return [
                    'data' => collect($paginator->items())
                        ->map(fn (Manga $manga): array => $this->summary($manga, $user))
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
    public function find(int $mangaId, ?User $user = null): ?array
    {
        $cacheKey = $this->detailCacheKey(
            $mangaId,
            $user?->resolvedPreferredTitleLanguage() ?? User::DEFAULT_PREFERRED_TITLE_LANGUAGE,
        );
        $cachedManga = $this->cacheStore()->get($cacheKey);

        if (is_array($cachedManga)) {
            return $cachedManga;
        }

        $manga = Manga::query()
            ->with($this->detailRelations())
            ->find($mangaId);

        if ($manga === null) {
            return null;
        }

        $payload = array_merge(
            $this->summary($manga, $user),
            [
                'description' => $manga->description,
                'end_date' => $this->nullableDateString($manga->end_date),
                'created_at' => $this->nullableDateTimeString($manga->created_at),
                'tags' => $manga->tags
                    ->map(fn ($tag): array => [
                        'id' => (int) $tag->id,
                        'name' => $tag->name,
                        'description' => $tag->description,
                        'category' => $tag->category,
                        'rank' => $this->nullableInt($tag->pivot->rank),
                    ])
                    ->values()
                    ->all(),
                'external_links' => $manga->externalLinks
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
                'trailer' => $manga->trailer ? [
                    'id' => $manga->trailer->trailer_id,
                    'site' => $manga->trailer->site,
                    'thumbnail' => $manga->trailer->thumbnail_url,
                ] : null,
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
                'sources' => $this->referenceOptions(MediaSource::query()),
                'genres' => Genre::query()
                    ->orderBy('name')
                    ->pluck('name')
                    ->all(),
                'years' => Manga::query()
                    ->whereNotNull('start_date')
                    ->selectRaw('EXTRACT(YEAR FROM start_date) as year')
                    ->distinct()
                    ->orderByDesc('year')
                    ->pluck('year')
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
            'sourceReference:code,description',
            'titles',
            'genres' => fn (BelongsToMany $relation) => $relation
                ->select('genre.name')
                ->orderBy('genre.name'),
        ];
    }

    /**
     * @return array<int, string|\Closure>
     */
    private function detailRelations(): array
    {
        return [
            ...$this->summaryRelations(),
            'tags' => fn (BelongsToMany $relation) => $relation
                ->select('tag.id', 'tag.name', 'tag.description', 'tag.category')
                ->orderByDesc('schema_manga.manga_tag.rank')
                ->orderBy('tag.name'),
            'trailer',
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
        ];
    }

    /**
     * @param  Builder<Manga>  $query
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

        $this->applyWhereIn($query, 'schema_manga.manga.status_code', $filters['status'] ?? null);
        $this->applyWhereIn($query, 'schema_manga.manga.format_code', $filters['format'] ?? null);
        $this->applyWhereIn($query, 'schema_manga.manga.source_code', $filters['source'] ?? null);

        if (($filters['year'] ?? null) !== null) {
            $query->whereYear('schema_manga.manga.start_date', (int) $filters['year']);
        }

        if (($filters['is_adult'] ?? null) !== null) {
            $query->where('schema_manga.manga.is_adult', filter_var($filters['is_adult'], FILTER_VALIDATE_BOOL));
        }

        $genres = $this->normalizeArray($filters['genres'] ?? null);

        if ($genres !== []) {
            $query->whereHas('genres', function (Builder $genreQuery) use ($genres): void {
                $genreQuery->whereIn('genre.name', $genres);
            });
        }
    }

    /**
     * @param  Builder<Manga>  $query
     */
    private function applySorting(Builder $query, string $sort): void
    {
        match ($sort) {
            'trending_desc' => $query
                ->orderByDesc('schema_manga.manga.popularity')
                ->orderByDesc('schema_manga.manga.updated_at')
                ->orderBy('schema_manga.manga.id'),
            'score_desc' => $query->orderByDesc('schema_manga.manga.average_score')->orderBy('schema_manga.manga.id'),
            'favourites_desc' => $query->orderByDesc('schema_manga.manga.favourites')->orderBy('schema_manga.manga.id'),
            'recently_updated' => $query->orderByDesc('schema_manga.manga.updated_at')->orderBy('schema_manga.manga.id'),
            'start_date_desc' => $query->orderByDesc('schema_manga.manga.start_date')->orderBy('schema_manga.manga.id'),
            'title_asc' => $query->orderByRaw(
                'COALESCE(title_english.title, title_romaji.title, title_native.title) ASC'
            )->orderBy('schema_manga.manga.id'),
            default => $query->orderByDesc('schema_manga.manga.popularity')->orderBy('schema_manga.manga.id'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(Manga $manga, ?User $user = null): array
    {
        $titles = [
            'romaji' => $manga->titleByType('romaji'),
            'english' => $manga->titleByType('english'),
            'native' => $manga->titleByType('native'),
        ];

        return [
            'id' => (int) $manga->id,
            'preferred_title' => $this->preferredTitle($titles, $manga, $user),
            'titles' => $titles,
            'format' => $this->mapReference($manga->formatReference?->code, $manga->formatReference?->description),
            'status' => $this->mapReference($manga->statusReference?->code, $manga->statusReference?->description),
            'chapters' => $this->nullableInt($manga->chapters),
            'volumes' => $this->nullableInt($manga->volumes),
            'source' => $this->mapReference($manga->sourceReference?->code, $manga->sourceReference?->description),
            'average_score' => $this->nullableInt($manga->average_score),
            'popularity' => $this->nullableInt($manga->popularity),
            'favourites' => $this->nullableInt($manga->favourites),
            'is_adult' => (bool) $manga->is_adult,
            'start_date' => $this->nullableDateString($manga->start_date),
            'updated_at' => $this->nullableDateTimeString($manga->updated_at),
            'cover_image' => [
                'color' => $manga->cover_image_color,
                'large' => $manga->cover_image_large,
            ],
            'banner_image' => $manga->banner_image,
            'genres' => $manga->genres->pluck('name')->values()->all(),
        ];
    }

    /**
     * @param  Builder<MediaFormat|MediaStatus|MediaSource>  $query
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
     * @param  Builder<Manga>  $query
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
    private function preferredTitle(array $titles, Manga $manga, ?User $user = null): ?string
    {
        // Assuming User model has a similar method or it's generic enough
        return $titles['english']
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
        return 'manga_api:list:'.sha1((string) json_encode([
            'filters' => $filters,
            'sort' => $sort,
            'per_page' => $perPage,
            'page' => $page,
            'title_language' => $titleLanguage,
        ]));
    }

    private function detailCacheKey(int $mangaId, string $titleLanguage): string
    {
        return "manga_api:detail:{$mangaId}:{$titleLanguage}";
    }

    private function filtersCacheKey(): string
    {
        return 'manga_api:filters';
    }
}

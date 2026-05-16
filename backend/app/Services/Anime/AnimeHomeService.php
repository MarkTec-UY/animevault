<?php

namespace App\Services\Anime;

use App\Models\Anime;
use App\Models\Genre;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnimeHomeService
{
    public function __construct(
        private readonly AnimeCatalogService $catalog,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return $this->cacheStore()->remember(
            'anime_api:home:v1',
            $this->cacheTtl(),
            function (): array {
                $featured = $this->featuredAnime();
                $spotlight = $this->spotlightAnime($featured?->id);
                $season = $this->resolveSeason();

                return [
                    'hero' => [
                        'featured' => $featured === null
                            ? null
                            : array_merge($this->catalog->summary($featured), [
                                'description' => $featured->description,
                            ]),
                        'spotlight' => $spotlight
                            ->map(fn (Anime $anime): array => $this->catalog->summary($anime))
                            ->values()
                            ->all(),
                    ],
                    'trending' => $this->trendingAnime()
                        ->map(fn (Anime $anime): array => $this->catalog->summary($anime))
                        ->values()
                        ->all(),
                    'seasonal' => [
                        'label' => $season['label'],
                        'season_code' => $season['season_code'],
                        'season_year' => $season['season_year'],
                        'items' => $this->seasonalAnime($season['season_code'], $season['season_year'])
                            ->map(fn (Anime $anime): array => $this->catalog->summary($anime))
                            ->values()
                            ->all(),
                    ],
                    'top_rated' => $this->topRatedAnime()
                        ->map(fn (Anime $anime): array => $this->catalog->summary($anime))
                        ->values()
                        ->all(),
                    'genres' => $this->topGenres(),
                    'stats' => $this->stats(),
                    'generated_at' => now()->toIso8601String(),
                ];
            },
        );
    }

    /**
     * @return Collection<int, Anime>
     */
    private function spotlightAnime(?int $excludeAnimeId = null)
    {
        return $this->baseAnimeQuery()
            ->when($excludeAnimeId !== null, fn (Builder $query) => $query->whereKeyNot($excludeAnimeId))
            ->orderByDesc('schema_anime.anime.popularity')
            ->orderByDesc('schema_anime.anime.average_score')
            ->limit(3)
            ->get();
    }

    /**
     * @return Collection<int, Anime>
     */
    private function trendingAnime()
    {
        return $this->baseAnimeQuery()
            ->withMax('trends as peak_trending', 'trending')
            ->orderByDesc('peak_trending')
            ->orderByDesc('schema_anime.anime.popularity')
            ->limit(6)
            ->get();
    }

    /**
     * @return Collection<int, Anime>
     */
    private function seasonalAnime(?string $seasonCode, ?int $seasonYear)
    {
        if ($seasonCode === null || $seasonYear === null) {
            return collect();
        }

        return $this->baseAnimeQuery()
            ->where('schema_anime.anime.season_code', $seasonCode)
            ->where('schema_anime.anime.season_year', $seasonYear)
            ->orderByDesc('schema_anime.anime.popularity')
            ->orderByDesc('schema_anime.anime.average_score')
            ->limit(4)
            ->get();
    }

    /**
     * @return Collection<int, Anime>
     */
    private function topRatedAnime()
    {
        return $this->baseAnimeQuery()
            ->orderByDesc('schema_anime.anime.average_score')
            ->orderByDesc('schema_anime.anime.favourites')
            ->limit(4)
            ->get();
    }

    private function featuredAnime(): ?Anime
    {
        $season = $this->resolveSeason();

        $featured = $this->baseAnimeQuery()
            ->whereNotNull('schema_anime.anime.banner_image')
            ->whereNotNull('schema_anime.anime.cover_image_large')
            ->where('schema_anime.anime.season_code', $season['season_code'])
            ->where('schema_anime.anime.season_year', $season['season_year'])
            ->orderByDesc('schema_anime.anime.average_score')
            ->orderByDesc('schema_anime.anime.popularity')
            ->first();

        if ($featured !== null) {
            return $featured;
        }

        return $this->baseAnimeQuery()
            ->whereNotNull('schema_anime.anime.banner_image')
            ->whereNotNull('schema_anime.anime.cover_image_large')
            ->orderByDesc('schema_anime.anime.average_score')
            ->orderByDesc('schema_anime.anime.popularity')
            ->first();
    }

    /**
     * @return array{label:string, season_code:?string, season_year:?int}
     */
    private function resolveSeason(): array
    {
        $now = CarbonImmutable::now();
        $currentSeasonCode = $this->seasonCodeForMonth($now->month);
        $currentSeasonYear = $now->year;

        $currentSeasonExists = Anime::query()
            ->where('schema_anime.anime.season_code', $currentSeasonCode)
            ->where('schema_anime.anime.season_year', $currentSeasonYear)
            ->exists();

        if ($currentSeasonExists) {
            return [
                'label' => "{$this->seasonLabel($currentSeasonCode)} {$currentSeasonYear}",
                'season_code' => $currentSeasonCode,
                'season_year' => $currentSeasonYear,
            ];
        }

        $latestSeason = Anime::query()
            ->selectRaw(
                "schema_anime.anime.season_code, schema_anime.anime.season_year, case schema_anime.anime.season_code
                    when 'WINTER' then 1
                    when 'SPRING' then 2
                    when 'SUMMER' then 3
                    when 'FALL' then 4
                    else 0
                end as season_rank"
            )
            ->whereNotNull('schema_anime.anime.season_code')
            ->whereNotNull('schema_anime.anime.season_year')
            ->groupBy('schema_anime.anime.season_code', 'schema_anime.anime.season_year')
            ->orderByDesc('schema_anime.anime.season_year')
            ->orderByDesc('season_rank')
            ->first();

        if ($latestSeason === null) {
            return [
                'label' => 'Latest season',
                'season_code' => null,
                'season_year' => null,
            ];
        }

        $seasonCode = $latestSeason->season_code;
        $seasonYear = (int) $latestSeason->season_year;

        return [
            'label' => "{$this->seasonLabel($seasonCode)} {$seasonYear}",
            'season_code' => $seasonCode,
            'season_year' => $seasonYear,
        ];
    }

    /**
     * @return list<array{name:string, slug:string, anime_count:int}>
     */
    private function topGenres(): array
    {
        return Genre::query()
            ->withCount('anime')
            ->orderByDesc('anime_count')
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(fn (Genre $genre): array => [
                'name' => $genre->name,
                'slug' => $this->slugify($genre->name),
                'anime_count' => (int) $genre->anime_count,
            ])
            ->all();
    }

    /**
     * @return list<array{label:string, value:int, description:string}>
     */
    private function stats(): array
    {
        $animeCount = (int) Anime::query()->count();
        $genreCount = (int) Genre::query()->count();
        $studioCount = (int) DB::table('company')->distinct()->count('id');
        $airingCount = (int) Anime::query()
            ->where('schema_anime.anime.status_code', 'RELEASING')
            ->count();

        return [
            [
                'label' => 'Anime Titles',
                'value' => $animeCount,
                'description' => 'Indexed in the public catalog',
            ],
            [
                'label' => 'Genres',
                'value' => $genreCount,
                'description' => 'Available to explore',
            ],
            [
                'label' => 'Studios',
                'value' => $studioCount,
                'description' => 'Represented in the database',
            ],
            [
                'label' => 'Airing Now',
                'value' => $airingCount,
                'description' => 'Currently releasing series',
            ],
        ];
    }

    /**
     * @return Builder<Anime>
     */
    private function baseAnimeQuery(): Builder
    {
        return Anime::query()
            ->select('schema_anime.anime.*')
            ->where('schema_anime.anime.is_adult', false)
            ->with($this->catalog->summaryRelations());
    }

    private function cacheStore(): CacheRepository
    {
        return Cache::store(config('anime.cache.store', 'redis'));
    }

    private function cacheTtl(): int
    {
        return (int) config('anime.cache.ttls.home', 300);
    }

    private function seasonCodeForMonth(int $month): string
    {
        return match (true) {
            $month >= 1 && $month <= 3 => 'WINTER',
            $month >= 4 && $month <= 6 => 'SPRING',
            $month >= 7 && $month <= 9 => 'SUMMER',
            default => 'FALL',
        };
    }

    private function seasonLabel(?string $seasonCode): string
    {
        return match ($seasonCode) {
            'WINTER' => 'Winter',
            'SPRING' => 'Spring',
            'SUMMER' => 'Summer',
            'FALL' => 'Fall',
            default => 'Season',
        };
    }

    private function slugify(string $value): string
    {
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $normalized = $normalized === false ? $value : $normalized;
        $normalized = mb_strtolower($normalized);
        $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized);

        return trim((string) $normalized, '-');
    }
}

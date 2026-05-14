<?php

namespace App\Services\AniList;

use App\Models\Anime;
use App\Services\Anime\AnimeAiringNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class AniListAnimePersister
{
    private const UNKNOWN_LOOKUP_CODE = 'UNKNOWN';

    public function __construct(private AnimeAiringNotificationService $airingNotifications) {}

    public function persist(array $media): void
    {
        $repairedSequence = false;
        $airedEpisodes = [];
        $persistedAnimeId = (int) $media['id'];

        while (true) {
            try {
                DB::transaction(function () use ($media, &$airedEpisodes, &$persistedAnimeId): void {
                    $animeId = (int) $media['id'];
                    $persistedAnimeId = $animeId;
                    $existingAnime = DB::table('anime')
                        ->select('next_airing_episode', 'next_airing_at')
                        ->where('id', $animeId)
                        ->first();

                    $format = $this->normalizeRequiredEnum($media['format'] ?? null);
                    $status = $this->normalizeRequiredEnum($media['status'] ?? null);
                    $season = $this->normalizeEnum($media['season'] ?? null);
                    $source = $this->normalizeEnum($media['source'] ?? null);
                    $nextAiringEpisode = $this->nullableInt(data_get($media, 'nextAiringEpisode.episode'));
                    $nextAiringAt = $this->timestampToDateTimeString(data_get($media, 'nextAiringEpisode.airingAt'));

                    $airedEpisodes = $this->airingNotifications->detectNewlyAiredEpisodes(
                        previousNextEpisode: $this->nullableInt($existingAnime?->next_airing_episode ?? null),
                        previousNextAiringAt: $existingAnime?->next_airing_at ?? null,
                        currentNextEpisode: $nextAiringEpisode,
                        totalEpisodes: $this->nullableInt($media['episodes'] ?? null),
                        now: now()->toImmutable(),
                    );

                    $this->upsertLookup('media_format', $format);
                    $this->upsertLookup('media_status', $status);
                    $this->upsertLookup('media_season', $season);
                    $this->upsertLookup('media_source', $source);

                    DB::table('anime')->updateOrInsert(
                        ['id' => $animeId],
                        [
                            'format_code' => $format,
                            'status_code' => $status,
                            'episodes' => $media['episodes'] ?? null,
                            'next_airing_episode' => $nextAiringEpisode,
                            'next_airing_at' => $nextAiringAt,
                            'duration_minutes' => $media['duration'] ?? null,
                            'season_code' => $season,
                            'season_year' => $media['seasonYear'] ?? null,
                            'source_code' => $source,
                            'description' => $media['description'] ?? null,
                            'cover_image_color' => data_get($media, 'coverImage.color'),
                            'cover_image_large' => data_get($media, 'coverImage.large'),
                            'banner_image' => $media['bannerImage'] ?? null,
                            'average_score' => $media['averageScore'] ?? null,
                            'popularity' => $media['popularity'] ?? null,
                            'is_adult' => (bool) ($media['isAdult'] ?? false),
                            'favourites' => $media['favourites'] ?? null,
                            'start_date' => $this->buildFuzzyDate($media['startDate'] ?? null),
                            'end_date' => $this->buildFuzzyDate($media['endDate'] ?? null),
                            'updated_at' => now(),
                        ],
                    );

                    $this->syncTitles($animeId, $media['title'] ?? []);
                    $this->syncGenres($animeId, $media['genres'] ?? []);
                    $this->syncTags($animeId, $media['tags'] ?? []);
                    $this->syncCompanies($animeId, data_get($media, 'studios.edges', []));
                    $this->syncExternalLinks($animeId, $media['externalLinks'] ?? []);
                    $this->syncTrends($animeId, data_get($media, 'trends.edges', []));
                });

                $this->dispatchAiringNotifications($persistedAnimeId, $airedEpisodes);

                return;
            } catch (UniqueConstraintViolationException $exception) {
                if ($repairedSequence || ! $this->isExternalLinkPrimaryKeySequenceCollision($exception)) {
                    throw $exception;
                }

                $this->syncPostgresSequenceToMaxId('external_link', 'id');
                $repairedSequence = true;
            }
        }
    }

    public function syncTitles(int $animeId, array $titles): void
    {
        DB::table('anime_title')->where('anime_id', $animeId)->delete();

        $rows = collect([
            'romaji' => $titles['romaji'] ?? null,
            'english' => $titles['english'] ?? null,
            'native' => $titles['native'] ?? null,
        ])
            ->filter(fn (?string $title): bool => filled($title))
            ->map(fn (string $title, string $type): array => [
                'anime_id' => $animeId,
                'title_type' => $type,
                'title' => $title,
            ])
            ->values()
            ->all();

        if ($rows !== []) {
            DB::table('anime_title')->insert($rows);
        }
    }

    public function syncGenres(int $animeId, array $genres): void
    {
        DB::table('anime_genre')->where('anime_id', $animeId)->delete();

        $genres = collect($genres)
            ->filter(fn ($genre): bool => filled($genre))
            ->values();

        foreach ($genres as $genre) {
            DB::table('genre')->updateOrInsert(['name' => $genre], []);
        }

        if ($genres->isNotEmpty()) {
            DB::table('anime_genre')->insert(
                $genres->map(fn (string $genre): array => [
                    'anime_id' => $animeId,
                    'genre_name' => $genre,
                ])->all(),
            );
        }
    }

    public function syncTags(int $animeId, array $tags): void
    {
        DB::table('anime_tag')->where('anime_id', $animeId)->delete();

        $rowsByTagId = [];

        foreach ($tags as $tag) {
            if (! is_array($tag) || ! isset($tag['id'], $tag['name'])) {
                continue;
            }

            DB::table('tag')->updateOrInsert(
                ['id' => $tag['id']],
                [
                    'name' => $tag['name'],
                    'description' => $tag['description'] ?? null,
                    'category' => $tag['category'] ?? null,
                ],
            );

            $tagId = (int) $tag['id'];
            $rowsByTagId[$tagId] = [
                'anime_id' => $animeId,
                'tag_id' => $tagId,
                'rank' => $this->maxNullableInt($rowsByTagId[$tagId]['rank'] ?? null, $tag['rank'] ?? null),
            ];
        }

        $rows = array_values($rowsByTagId);

        if ($rows !== []) {
            DB::table('anime_tag')->insert($rows);
        }
    }

    public function syncCompanies(int $animeId, array $studioEdges): void
    {
        DB::table('anime_company')->where('anime_id', $animeId)->delete();

        $rowsByCompanyId = [];

        foreach ($studioEdges as $edge) {
            $studio = $edge['node'] ?? null;

            if (! is_array($studio) || ! isset($studio['id'], $studio['name'])) {
                continue;
            }

            $companyId = $this->resolveCompanyId(
                externalId: (int) $studio['id'],
                name: (string) $studio['name'],
            );

            $rowsByCompanyId[$companyId] = [
                'anime_id' => $animeId,
                'company_id' => $companyId,
                'is_main' => ($rowsByCompanyId[$companyId]['is_main'] ?? false) || (bool) ($edge['isMain'] ?? false),
            ];
        }

        $rows = array_values($rowsByCompanyId);

        if ($rows !== []) {
            DB::table('anime_company')->insert($rows);
        }
    }

    public function syncExternalLinks(int $animeId, array $externalLinks): void
    {
        DB::table('anime_external_link')->where('anime_id', $animeId)->delete();

        $rowsByExternalLinkId = [];

        foreach ($externalLinks as $link) {
            if (! is_array($link) || ! isset($link['site'], $link['url'])) {
                continue;
            }

            $type = $this->normalizeEnum($link['type'] ?? null);
            $this->upsertLookup('external_link_type', $type);

            $externalLinkId = $this->upsertExternalLinkAndGetId(
                site: $link['site'],
                url: $link['url'],
                values: [
                    'type_code' => $type,
                    'language' => $link['language'] ?? null,
                    'color' => $link['color'] ?? null,
                    'icon' => $link['icon'] ?? null,
                ],
            );

            if ($externalLinkId === null) {
                continue;
            }

            $rowsByExternalLinkId[(int) $externalLinkId] = [
                'anime_id' => $animeId,
                'external_link_id' => (int) $externalLinkId,
            ];
        }

        $rows = array_values($rowsByExternalLinkId);

        if ($rows !== []) {
            DB::table('anime_external_link')->insert($rows);
        }
    }

    public function syncTrends(int $animeId, array $trendEdges): void
    {
        DB::table('anime_trend')->where('anime_id', $animeId)->delete();

        $rowsByKey = [];

        foreach ($trendEdges as $edge) {
            $trend = $edge['node'] ?? null;

            if (! is_array($trend) || blank($trend['date'] ?? null)) {
                continue;
            }

            $trendDate = $this->normalizeTrendDate($trend['date']);
            $rowKey = "{$trendDate}:0";
            $existingRow = $rowsByKey[$rowKey] ?? null;

            $rowsByKey[$rowKey] = [
                'anime_id' => $animeId,
                'trend_date' => $trendDate,
                'episode' => 0,
                'trending' => $this->maxNullableInt($existingRow['trending'] ?? null, $trend['trending'] ?? null),
                'average_score' => $this->maxNullableInt($existingRow['average_score'] ?? null, null),
                'popularity' => $this->maxNullableInt($existingRow['popularity'] ?? null, $trend['popularity'] ?? null),
                'created_at' => now(),
            ];
        }

        $rows = array_values($rowsByKey);

        if ($rows !== []) {
            DB::table('anime_trend')->insert($rows);
        }
    }

    public function isExternalLinkPrimaryKeySequenceCollision(UniqueConstraintViolationException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'external_link_pkey')
            && str_contains($message, 'key (id)=(')
            && $exception->getConnectionName() === 'pgsql';
    }

    private function dispatchAiringNotifications(int $animeId, array $airedEpisodes): void
    {
        if ($airedEpisodes === []) {
            return;
        }

        $anime = Anime::query()
            ->with('titles')
            ->find($animeId);

        if ($anime !== null) {
            $this->airingNotifications->createEpisodeAiredNotifications($anime, $airedEpisodes);
        }
    }

    private function upsertLookup(string $table, ?string $code): void
    {
        if ($code === null) {
            return;
        }

        DB::table($table)->updateOrInsert(
            ['code' => $code],
            ['description' => $this->humanizeEnum($code)],
        );
    }

    private function resolveCompanyId(int $externalId, string $name): int
    {
        $existingCompany = DB::table('company')
            ->where('id', $externalId)
            ->orWhere('name', $name)
            ->orderByRaw('CASE WHEN id = ? THEN 0 ELSE 1 END', [$externalId])
            ->first(['id', 'name']);

        if ($existingCompany !== null) {
            if ($existingCompany->name !== $name) {
                DB::table('company')
                    ->where('id', $existingCompany->id)
                    ->update(['name' => $name]);
            }

            return (int) $existingCompany->id;
        }

        DB::table('company')->insert([
            'id' => $externalId,
            'name' => $name,
        ]);

        return $externalId;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function upsertExternalLinkAndGetId(string $site, string $url, array $values): ?int
    {
        DB::table('external_link')->updateOrInsert(
            [
                'site' => $site,
                'url' => $url,
            ],
            $values,
        );

        $externalLinkId = DB::table('external_link')
            ->where('site', $site)
            ->where('url', $url)
            ->value('id');

        return $externalLinkId === null ? null : (int) $externalLinkId;
    }

    private function syncPostgresSequenceToMaxId(string $table, string $column): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            "SELECT setval(pg_get_serial_sequence('{$table}', '{$column}'), COALESCE((SELECT MAX({$column}) FROM {$table}), 0) + 1, false)"
        );
    }

    private function normalizeEnum(?string $value): ?string
    {
        return filled($value) ? trim($value) : null;
    }

    private function normalizeRequiredEnum(?string $value): string
    {
        return $this->normalizeEnum($value) ?? self::UNKNOWN_LOOKUP_CODE;
    }

    private function humanizeEnum(string $value): string
    {
        return str($value)
            ->replace('_', ' ')
            ->lower()
            ->title()
            ->toString();
    }

    private function buildFuzzyDate(?array $fuzzyDate): ?string
    {
        if (! is_array($fuzzyDate) || blank($fuzzyDate['year'] ?? null)) {
            return null;
        }

        $year = (int) $fuzzyDate['year'];
        $month = (int) ($fuzzyDate['month'] ?? 1);
        $day = (int) ($fuzzyDate['day'] ?? 1);

        try {
            return CarbonImmutable::create($year, $month, $day, 0, 0, 0, 'UTC')->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function timestampToDateTimeString(mixed $value): ?string
    {
        if (! is_numeric($value)) {
            return null;
        }

        return CarbonImmutable::createFromTimestampUTC((int) $value)->toAtomString();
    }

    private function nullableInt(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function maxNullableInt(mixed $left, mixed $right): ?int
    {
        $values = collect([$left, $right])
            ->filter(fn (mixed $value): bool => is_numeric($value))
            ->map(fn (mixed $value): int => (int) $value)
            ->all();

        if ($values === []) {
            return null;
        }

        return max($values);
    }

    private function normalizeTrendDate(int|string $rawDate): string
    {
        $value = (string) $rawDate;
        $digits = preg_replace('/\D+/', '', $value) ?? $value;

        if (strlen($digits) === 8) {
            $year = (int) substr($digits, 0, 4);
            $month = (int) substr($digits, 4, 2);
            $day = (int) substr($digits, 6, 2);

            if ($year >= 1900 && $year <= 2100 && checkdate($month, $day, $year)) {
                return CarbonImmutable::create($year, $month, $day, 0, 0, 0, 'UTC')->toDateString();
            }
        }

        return CarbonImmutable::createFromTimestampUTC((int) $rawDate)->toDateString();
    }
}

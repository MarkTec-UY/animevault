<?php

namespace App\Services\AniList;

use App\Models\Anime;
use App\Services\Anime\AnimeAiringNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Console\OutputStyle;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use RuntimeException;

class AniListAnimeImporter
{
    private const CHECKPOINT_KEY = 'anilist_import:anime_checkpoint';

    private const UNKNOWN_LOOKUP_CODE = 'UNKNOWN';

    public function __construct(public AnimeAiringNotificationService $airingNotifications) {}

    private const ENDPOINT = 'https://graphql.anilist.co';

    private const QUERY = <<<'GRAPHQL'
query ($page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      perPage
    }
    media(type: ANIME, sort: ID) {
      id
      title { romaji english native }
      coverImage { color large }
      bannerImage
      description
      format
      status
      episodes
      duration
      season
      seasonYear
      source
      genres
      averageScore
      popularity
      isAdult
      favourites
      startDate { year month day }
      endDate { year month day }
      nextAiringEpisode {
        episode
        airingAt
      }
      studios {
        edges {
          isMain
          node { id name }
        }
      }
      tags {
        id
        name
        description
        category
        rank
      }
      externalLinks {
        id
        site
        url
        type
        language
        color
        icon
      }
      trends {
        edges {
          node {
            date
            trending
            popularity
          }
        }
      }
    }
  }
}
GRAPHQL;

    /**
     * @return array{imported:int, checked:int, pages:int, last_id:int}
     */
    public function importFirstAvailableAnime(
        int $limit = 50,
        int $startId = 1,
        int $startPage = 1,
        int $perPage = 50,
        int $delayMs = 2200,
        int $maxRateLimitRetries = 10,
        int $maxServerErrorRetries = 3,
        ?OutputStyle $output = null,
    ): array {
        $imported = 0;
        $checked = 0;
        $pages = 0;
        $currentPage = max(1, $startPage);
        $lastImportedId = max(0, $startId - 1);
        $pageSize = min(max($perPage, 1), 50);

        while ($imported < $limit) {
            $result = $this->fetchAnimePage(
                page: $currentPage,
                perPage: $pageSize,
                maxRateLimitRetries: $maxRateLimitRetries,
                maxServerErrorRetries: $maxServerErrorRetries,
                output: $output,
            );
            $pages++;

            if ($result['media'] === []) {
                break;
            }

            $pageMedia = collect($result['media'])
                ->filter(fn (array $anime): bool => (int) $anime['id'] >= $startId)
                ->values()
                ->all();

            if ($output !== null) {
                $pageIds = collect($result['media'])
                    ->map(fn (array $anime): int => (int) $anime['id']);
                $firstPageId = $pageIds->first();
                $lastPageId = $pageIds->last();
                $pageRange = $firstPageId === null || $lastPageId === null
                    ? 'sin resultados'
                    : "IDs {$firstPageId}-{$lastPageId}";

                if ($pageMedia === []) {
                    $output->writeln(
                        " · Pagina {$result['current_page']} revisada ({$pageRange}); todavia no hay anime con ID >= {$startId}."
                    );
                } else {
                    $output->writeln(
                        " · Pagina {$result['current_page']} revisada ({$pageRange}); ".
                        count($pageMedia)." anime listos para importar desde el umbral {$startId}."
                    );
                }
            }

            foreach ($pageMedia as $anime) {
                if ($imported >= $limit) {
                    break;
                }

                $this->persistAnime($anime);
                $imported++;
                $checked++;
                $lastImportedId = (int) $anime['id'];

                if ($output !== null) {
                    $title = $anime['title']['romaji']
                        ?? $anime['title']['english']
                        ?? $anime['title']['native']
                        ?? 'Sin titulo';

                    $output->writeln(" + ID {$anime['id']}: importado {$title}");
                }
            }

            $nextStartId = $pageMedia !== []
                ? max($startId, ((int) end($pageMedia)['id']) + 1)
                : $startId;

            $this->writeImportCheckpoint(
                nextPage: $currentPage + 1,
                nextStartId: $nextStartId,
                lastImportedId: $lastImportedId,
                perPage: $pageSize,
            );

            if (! $result['has_next_page'] || $imported >= $limit) {
                break;
            }

            $currentPage++;
            $this->sleep($delayMs, $imported, $limit);
        }

        return [
            'imported' => $imported,
            'checked' => $checked,
            'pages' => $pages,
            'last_id' => $lastImportedId,
        ];
    }

    /**
     * @return array{next_page:int, next_start_id:int, last_imported_id:int, per_page:int}|null
     */
    public function readImportCheckpoint(): ?array
    {
        $checkpoint = Cache::store(config('anime.cache.store', 'redis'))->get(self::CHECKPOINT_KEY);

        if (! is_array($checkpoint)) {
            return null;
        }

        $nextPage = (int) ($checkpoint['next_page'] ?? 0);
        $nextStartId = (int) ($checkpoint['next_start_id'] ?? 0);
        $lastImportedId = (int) ($checkpoint['last_imported_id'] ?? 0);
        $perPage = (int) ($checkpoint['per_page'] ?? 0);

        if ($nextPage < 1 || $nextStartId < 1 || $perPage < 1) {
            return null;
        }

        return [
            'next_page' => $nextPage,
            'next_start_id' => $nextStartId,
            'last_imported_id' => max(0, $lastImportedId),
            'per_page' => $perPage,
        ];
    }

    public function forgetImportCheckpoint(): void
    {
        Cache::store(config('anime.cache.store', 'redis'))->forget(self::CHECKPOINT_KEY);
    }

    private function sleep(int $delayMs, int $imported, int $limit): void
    {
        if ($delayMs <= 0 || $imported >= $limit) {
            return;
        }

        Sleep::for($delayMs)->milliseconds();
    }

    /**
     * @return array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool}
     */
    private function fetchAnimePage(
        int $page,
        int $perPage,
        int $maxRateLimitRetries = 10,
        int $maxServerErrorRetries = 3,
        ?OutputStyle $output = null,
    ): array {
        $rateLimitAttempt = 0;
        $serverErrorAttempt = 0;
        $connectionAttempt = 0;

        while (true) {
            try {
                $response = Http::acceptJson()
                    ->timeout(30)
                    ->connectTimeout(10)
                    ->post(self::ENDPOINT, [
                        'query' => self::QUERY,
                        'variables' => [
                            'page' => $page,
                            'perPage' => $perPage,
                        ],
                    ]);
            } catch (ConnectionException $exception) {
                $connectionError = $this->handleConnectionError(
                    page: $page,
                    message: $exception->getMessage(),
                    attempt: $connectionAttempt,
                    maxRetries: $maxServerErrorRetries,
                    output: $output,
                );

                if ($connectionError !== null) {
                    throw new RuntimeException($connectionError['message'], previous: $exception);
                }

                continue;
            }

            if ($response->status() === 429) {
                $retryAfter = max(1, (int) $response->header('Retry-After', 60));

                if ($rateLimitAttempt >= $maxRateLimitRetries) {
                    throw new RuntimeException(
                        "AniList devolvio rate limit para la pagina {$page} y se agotaron los reintentos automaticos. Espera {$retryAfter} segundos y vuelve a intentar."
                    );
                }

                $rateLimitAttempt++;

                if ($output !== null) {
                    $output->writeln(" ! AniList rate limit en la pagina {$page}. Esperando {$retryAfter}s antes del reintento {$rateLimitAttempt}/{$maxRateLimitRetries}...");
                }

                Sleep::for($retryAfter)->seconds();

                continue;
            }

            $payload = $response->json();
            $errors = data_get($payload, 'errors', []);
            $errors = is_array($errors) ? $errors : [];

            if ($response->serverError()) {
                $serverError = $this->handleServerError(
                    id: $page,
                    status: $response->status(),
                    messages: $this->extractErrorMessages($errors),
                    attempt: $serverErrorAttempt,
                    maxRetries: $maxServerErrorRetries,
                    output: $output,
                );

                if ($serverError !== null) {
                    throw new RuntimeException($serverError['message']);
                }

                continue;
            }

            if ($errors !== []) {
                $serverErrorOnly = collect($errors)->every(function ($error): bool {
                    $message = strtolower((string) ($error['message'] ?? ''));
                    $status = (int) ($error['status'] ?? 0);

                    return $status >= 500 || str_contains($message, 'internal server error');
                });

                if ($serverErrorOnly) {
                    $serverError = $this->handleServerError(
                        id: $page,
                        status: $this->resolveGraphQlErrorStatus($errors),
                        messages: $this->extractErrorMessages($errors),
                        attempt: $serverErrorAttempt,
                        maxRetries: $maxServerErrorRetries,
                        output: $output,
                    );

                    if ($serverError !== null) {
                        throw new RuntimeException($serverError['message']);
                    }

                    continue;
                }

                $messages = $this->extractErrorMessages($errors);

                throw new RuntimeException("AniList devolvio un error para la pagina {$page}: {$messages}");
            }

            $response->throw();

            $pagePayload = data_get($payload, 'data.Page');

            if (! is_array($pagePayload)) {
                throw new RuntimeException("AniList devolvio una respuesta sin pagina valida para la pagina {$page}.");
            }

            $media = collect(data_get($pagePayload, 'media', []))
                ->filter(fn (mixed $item): bool => is_array($item))
                ->values()
                ->all();

            return [
                'media' => $media,
                'current_page' => (int) data_get($pagePayload, 'pageInfo.currentPage', $page),
                'has_next_page' => (bool) data_get($pagePayload, 'pageInfo.hasNextPage', false),
            ];
        }
    }

    private function writeImportCheckpoint(int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
    {
        Cache::store(config('anime.cache.store', 'redis'))->forever(self::CHECKPOINT_KEY, [
            'next_page' => $nextPage,
            'next_start_id' => $nextStartId,
            'last_imported_id' => $lastImportedId,
            'per_page' => $perPage,
            'updated_at' => now()->toAtomString(),
        ]);
    }

    /**
     * @return array{message:string}|null
     */
    private function handleServerError(
        int $id,
        int $status,
        string $messages,
        int &$attempt,
        int $maxRetries,
        ?OutputStyle $output = null,
    ): ?array {
        $status = max(500, $status);
        $messages = $messages !== '' ? $messages : 'Internal Server Error';

        if ($attempt >= $maxRetries) {
            return [
                'message' => "AniList devolvio error {$status} para la pagina {$id} tras {$maxRetries} reintentos ({$messages})",
            ];
        }

        $attempt++;
        $waitSeconds = min(30, $attempt * 2);

        if ($output !== null) {
            $output->writeln(" ! AniList devolvio error {$status} en la pagina {$id}. Esperando {$waitSeconds}s antes del reintento {$attempt}/{$maxRetries}...");
        }

        Sleep::for($waitSeconds)->seconds();

        return null;
    }

    /**
     * @return array{message:string}|null
     */
    private function handleConnectionError(
        int $page,
        string $message,
        int &$attempt,
        int $maxRetries,
        ?OutputStyle $output = null,
    ): ?array {
        $message = $message !== '' ? $message : 'Connection error';

        if ($attempt >= $maxRetries) {
            return [
                'message' => "AniList no respondio por un error de conexion en la pagina {$page} tras {$maxRetries} reintentos ({$message})",
            ];
        }

        $attempt++;
        $waitSeconds = min(30, $attempt * 2);

        if ($output !== null) {
            $output->writeln(" ! AniList devolvio un error de conexion en la pagina {$page}. Esperando {$waitSeconds}s antes del reintento {$attempt}/{$maxRetries}...");
        }

        Sleep::for($waitSeconds)->seconds();

        return null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     */
    private function resolveGraphQlErrorStatus(array $errors): int
    {
        return (int) collect($errors)
            ->pluck('status')
            ->filter(fn ($status) => is_numeric($status))
            ->max();
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     */
    private function extractErrorMessages(array $errors): string
    {
        return collect($errors)
            ->pluck('message')
            ->filter()
            ->implode('; ');
    }

    private function persistAnime(array $media): void
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

                if ($airedEpisodes !== []) {
                    $anime = Anime::query()
                        ->with('titles')
                        ->find($persistedAnimeId);

                    if ($anime !== null) {
                        $this->airingNotifications->createEpisodeAiredNotifications($anime, $airedEpisodes);
                    }
                }

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

    private function syncTitles(int $animeId, array $titles): void
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

    private function syncGenres(int $animeId, array $genres): void
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

    private function syncTags(int $animeId, array $tags): void
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

    private function syncCompanies(int $animeId, array $studioEdges): void
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

    private function syncExternalLinks(int $animeId, array $externalLinks): void
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

    private function isExternalLinkPrimaryKeySequenceCollision(UniqueConstraintViolationException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'external_link_pkey')
            && str_contains($message, 'key (id)=(')
            && $exception->getConnectionName() === 'pgsql';
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

    private function syncTrends(int $animeId, array $trendEdges): void
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

<?php

namespace App\Services\AniList;

use Illuminate\Console\OutputStyle;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Sleep;

class AniListAnimeImporter
{
    public function __construct(
        private AniListAnimePageFetcher $pageFetcher,
        private AniListAnimePersister $persister,
        private AniListImportCheckpointStore $checkpointStore,
    ) {}

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
        $summary = $this->makeSummary($startId);
        $currentPage = max(1, $startPage);
        $pageSize = $this->normalizePageSize($perPage);

        while ($summary['imported'] < $limit) {
            $result = $this->fetchAnimePage(
                page: $currentPage,
                perPage: $pageSize,
                maxRateLimitRetries: $maxRateLimitRetries,
                maxServerErrorRetries: $maxServerErrorRetries,
                output: $output,
            );
            $summary['pages']++;

            if ($result['media'] === []) {
                break;
            }

            $pageMedia = collect($result['media'])
                ->filter(fn (array $anime): bool => (int) $anime['id'] >= $startId)
                ->values()
                ->all();

            $this->reportPagedImportStatus(
                result: $result,
                pageMedia: $pageMedia,
                startId: $startId,
                output: $output,
            );

            $this->persistMediaBatch(
                media: $pageMedia,
                summary: $summary,
                limit: $limit,
                output: $output,
            );

            $nextStartId = $pageMedia !== []
                ? max($startId, ((int) end($pageMedia)['id']) + 1)
                : $startId;

            $this->writeImportCheckpoint(
                nextPage: $currentPage + 1,
                nextStartId: $nextStartId,
                lastImportedId: $summary['last_id'],
                perPage: $pageSize,
            );

            if (! $result['has_next_page'] || $summary['imported'] >= $limit) {
                break;
            }

            $currentPage++;
            $this->sleep($delayMs, $summary['imported'], $limit);
        }

        return $summary;
    }

    /**
     * @return array{imported:int, checked:int, pages:int, last_id:int}
     */
    public function importAllAnimeWithCursors(
        int $limit = 0,
        int $startId = 1,
        int $perPage = 50,
        int $startYear = 0,
        int $startPage = 1,
        int $delayMs = 2200,
        int $maxRateLimitRetries = 10,
        int $maxServerErrorRetries = 3,
        ?OutputStyle $output = null,
    ): array {
        $summary = $this->makeSummary($startId);
        $pageSize = $this->normalizePageSize($perPage);
        $hasLimit = $limit > 0;

        foreach ($this->buildStartDateBuckets($startYear) as $bucketIndex => $bucket) {
            $page = $bucketIndex === 0 ? max(1, $startPage) : 1;

            while (true) {
                $result = $this->fetchAnimePageByStartDateRange(
                    page: $page,
                    perPage: $pageSize,
                    startDateGreater: $bucket['start_date_greater'],
                    startDateLesser: $bucket['start_date_lesser'],
                    bucketLabel: $bucket['label'],
                    maxRateLimitRetries: $maxRateLimitRetries,
                    maxServerErrorRetries: $maxServerErrorRetries,
                    output: $output,
                );
                $summary['pages']++;

                if ($result['media'] === []) {
                    $this->writeDateRangeCheckpoint(
                        nextYear: $this->resolveNextBucketCheckpoint($startYear, $bucket['year']),
                        nextPage: 1,
                        lastImportedId: $summary['last_id'],
                        perPage: $pageSize,
                    );

                    break;
                }

                $pageMedia = collect($result['media'])
                    ->filter(fn (array $anime): bool => (int) $anime['id'] >= $startId)
                    ->values()
                    ->all();

                $this->persistMediaBatch(
                    media: $pageMedia,
                    summary: $summary,
                    limit: $hasLimit ? $limit : PHP_INT_MAX,
                    output: $output,
                );

                $shouldStop = $hasLimit && $summary['imported'] >= $limit;
                $nextBucketYear = $result['has_next_page']
                    ? $bucket['year']
                    : $this->resolveNextBucketCheckpoint($startYear, $bucket['year']);
                $nextPage = $result['has_next_page'] ? $page + 1 : 1;

                $this->writeDateRangeCheckpoint(
                    nextYear: $nextBucketYear,
                    nextPage: $nextPage,
                    lastImportedId: $summary['last_id'],
                    perPage: $pageSize,
                );

                if ($shouldStop) {
                    break 2;
                }

                if (! $result['has_next_page']) {
                    break;
                }

                $page++;
                $this->sleep($delayMs, $summary['imported'], $hasLimit ? $limit : PHP_INT_MAX);
            }
        }

        return $summary;
    }

    /**
     * @return array{mode:string, next_page:int, next_start_id:int, last_imported_id:int, per_page:int, next_year:int}|null
     */
    public function readImportCheckpoint(): ?array
    {
        return $this->checkpointStore->read();
    }

    public function forgetImportCheckpoint(): void
    {
        $this->checkpointStore->forget();
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
    private function fetchAnimePageByStartDateRange(
        int $page,
        int $perPage = 50,
        ?int $startDateGreater = null,
        ?int $startDateLesser = null,
        string $bucketLabel = 'sin rango',
        int $maxRateLimitRetries = 10,
        int $maxServerErrorRetries = 3,
        ?OutputStyle $output = null,
    ): array {
        return $this->pageFetcher->fetchPageByStartDateRange(
            page: $page,
            perPage: $perPage,
            startDateGreater: $startDateGreater,
            startDateLesser: $startDateLesser,
            bucketLabel: $bucketLabel,
            maxRateLimitRetries: $maxRateLimitRetries,
            maxServerErrorRetries: $maxServerErrorRetries,
            output: $output,
        );
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
        return $this->pageFetcher->fetchPage(
            page: $page,
            perPage: $perPage,
            maxRateLimitRetries: $maxRateLimitRetries,
            maxServerErrorRetries: $maxServerErrorRetries,
            output: $output,
        );
    }

    private function writeImportCheckpoint(int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
    {
        $this->checkpointStore->writePageCheckpoint($nextPage, $nextStartId, $lastImportedId, $perPage);
    }

    private function writeDateRangeCheckpoint(int $nextYear, int $nextPage, int $lastImportedId, int $perPage): void
    {
        $this->checkpointStore->writeDateRangeCheckpoint($nextYear, $nextPage, $lastImportedId, $perPage);
    }

    /**
     * @return list<array{year:int,label:string,start_date_greater:int|null,start_date_lesser:int|null}>
     */
    private function buildStartDateBuckets(int $startYear): array
    {
        return $this->checkpointStore->buildStartDateBuckets($startYear);
    }

    private function resolveNextBucketCheckpoint(int $startYear, int $currentYear): int
    {
        return $this->checkpointStore->resolveNextBucketCheckpoint($startYear, $currentYear);
    }

    private function persistAnime(array $media): void
    {
        $this->persister->persist($media);
    }

    private function syncTitles(int $animeId, array $titles): void
    {
        $this->persister->syncTitles($animeId, $titles);
    }

    private function syncGenres(int $animeId, array $genres): void
    {
        $this->persister->syncGenres($animeId, $genres);
    }

    private function syncTags(int $animeId, array $tags): void
    {
        $this->persister->syncTags($animeId, $tags);
    }

    private function syncCompanies(int $animeId, array $studioEdges): void
    {
        $this->persister->syncCompanies($animeId, $studioEdges);
    }

    private function syncExternalLinks(int $animeId, array $externalLinks): void
    {
        $this->persister->syncExternalLinks($animeId, $externalLinks);
    }

    private function syncTrends(int $animeId, array $trendEdges): void
    {
        $this->persister->syncTrends($animeId, $trendEdges);
    }

    private function isExternalLinkPrimaryKeySequenceCollision(UniqueConstraintViolationException $exception): bool
    {
        return $this->persister->isExternalLinkPrimaryKeySequenceCollision($exception);
    }

    /**
     * @param  array{imported:int, checked:int, pages:int, last_id:int}  $summary
     * @param  list<array<string, mixed>>  $media
     */
    private function persistMediaBatch(array $media, array &$summary, int $limit, ?OutputStyle $output): void
    {
        foreach ($media as $anime) {
            if ($summary['imported'] >= $limit) {
                break;
            }

            $this->persistAnime($anime);
            $summary['imported']++;
            $summary['checked']++;
            $summary['last_id'] = (int) $anime['id'];

            if ($output !== null) {
                $output->writeln(" + ID {$anime['id']}: importado ".$this->resolveAnimeTitle($anime));
            }
        }
    }

    /**
     * @param  array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool}  $result
     * @param  list<array<string, mixed>>  $pageMedia
     */
    private function reportPagedImportStatus(array $result, array $pageMedia, int $startId, ?OutputStyle $output): void
    {
        if ($output === null) {
            return;
        }

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

            return;
        }

        $output->writeln(
            " · Pagina {$result['current_page']} revisada ({$pageRange}); ".count($pageMedia)." anime listos para importar desde el umbral {$startId}."
        );
    }

    /**
     * @return array{imported:int, checked:int, pages:int, last_id:int}
     */
    private function makeSummary(int $startId): array
    {
        return [
            'imported' => 0,
            'checked' => 0,
            'pages' => 0,
            'last_id' => max(0, $startId - 1),
        ];
    }

    private function normalizePageSize(int $perPage): int
    {
        return min(max($perPage, 1), 50);
    }

    /**
     * @param  array<string, mixed>  $anime
     */
    private function resolveAnimeTitle(array $anime): string
    {
        return $anime['title']['romaji']
            ?? $anime['title']['english']
            ?? $anime['title']['native']
            ?? 'Sin titulo';
    }
}
<?php

namespace App\Services\AniList;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

class AniListImportCheckpointStore
{
    private const CHECKPOINT_KEY = 'anilist_import:anime_checkpoint';

    /**
     * @return array{mode:string, next_page:int, next_start_id:int, last_imported_id:int, per_page:int, next_year:int}|null
     */
    public function read(): ?array
    {
        $checkpoint = Cache::store(config('anime.cache.store', 'redis'))->get(self::CHECKPOINT_KEY);

        if (! is_array($checkpoint)) {
            return null;
        }

        $mode = (string) ($checkpoint['mode'] ?? 'page');
        $nextPage = (int) ($checkpoint['next_page'] ?? 0);
        $nextStartId = (int) ($checkpoint['next_start_id'] ?? 0);
        $lastImportedId = (int) ($checkpoint['last_imported_id'] ?? 0);
        $perPage = (int) ($checkpoint['per_page'] ?? 0);
        $nextYear = (int) ($checkpoint['next_year'] ?? 0);

        if ($nextPage < 1 || $perPage < 1) {
            return null;
        }

        if ($mode !== 'date_range' && $nextStartId < 1) {
            return null;
        }

        if ($mode === 'date_range' && $nextYear < 0) {
            return null;
        }

        return [
            'mode' => $mode,
            'next_page' => $nextPage,
            'next_start_id' => $nextStartId,
            'last_imported_id' => max(0, $lastImportedId),
            'per_page' => $perPage,
            'next_year' => $nextYear,
        ];
    }

    public function forget(): void
    {
        Cache::store(config('anime.cache.store', 'redis'))->forget(self::CHECKPOINT_KEY);
    }

    public function writePageCheckpoint(int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
    {
        Cache::store(config('anime.cache.store', 'redis'))->forever(self::CHECKPOINT_KEY, [
            'mode' => 'page',
            'next_page' => $nextPage,
            'next_start_id' => $nextStartId,
            'last_imported_id' => $lastImportedId,
            'per_page' => $perPage,
            'updated_at' => now()->toAtomString(),
        ]);
    }

    public function writeDateRangeCheckpoint(int $nextYear, int $nextPage, int $lastImportedId, int $perPage): void
    {
        Cache::store(config('anime.cache.store', 'redis'))->forever(self::CHECKPOINT_KEY, [
            'mode' => 'date_range',
            'next_year' => $nextYear,
            'next_page' => $nextPage,
            'next_start_id' => max(0, $lastImportedId),
            'last_imported_id' => $lastImportedId,
            'per_page' => $perPage,
            'updated_at' => now()->toAtomString(),
        ]);
    }

    /**
     * @return list<array{year:int,label:string,start_date_greater:int|null,start_date_lesser:int|null}>
     */
    public function buildStartDateBuckets(int $startYear): array
    {
        $buckets = [];

        if ($startYear <= 0) {
            $buckets[] = [
                'year' => 0,
                'label' => 'sin fecha de estreno',
                'start_date_greater' => null,
                'start_date_lesser' => 10000,
            ];

            $startYear = 1900;
        }

        $currentYear = CarbonImmutable::now()->year + 5;

        for ($year = max(1900, $startYear); $year <= $currentYear; $year++) {
            $buckets[] = [
                'year' => $year,
                'label' => "estrenos de {$year}",
                'start_date_greater' => ($year * 10000) - 1,
                'start_date_lesser' => ($year + 1) * 10000,
            ];
        }

        return $buckets;
    }

    public function resolveNextBucketCheckpoint(int $startYear, int $currentYear): int
    {
        if ($currentYear === 0) {
            return max(1900, $startYear > 0 ? $startYear : 1900);
        }

        return $currentYear + 1;
    }
}

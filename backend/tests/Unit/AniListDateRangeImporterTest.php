<?php

use App\Services\AniList\AbstractAniListImporter;

test('it splits overflowing monthly ranges into daily buckets', function () {
    $importer = new class extends AbstractAniListImporter
    {
        public array $persistedIds = [];

        public array $fetchedBuckets = [];

        public ?array $checkpoint = null;

        /**
         * @var array<string, array<int, array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool, last_page:int}>>
         */
        public array $responses = [
            'estrenos de 2025 sin mes exacto' => [
                1 => [
                    'media' => [],
                    'current_page' => 1,
                    'has_next_page' => false,
                    'last_page' => 1,
                ],
            ],
            'estrenos de 2025-01' => [
                1 => [
                    'media' => [],
                    'current_page' => 1,
                    'has_next_page' => true,
                    'last_page' => 101,
                ],
            ],
            'estrenos de 2025-01 sin dia exacto' => [
                1 => [
                    'media' => [[
                        'id' => 100,
                        'title' => ['romaji' => 'Unknown Day Title'],
                    ]],
                    'current_page' => 1,
                    'has_next_page' => false,
                    'last_page' => 1,
                ],
            ],
            'estrenos de 2025-01-01' => [
                1 => [
                    'media' => [[
                        'id' => 200,
                        'title' => ['romaji' => 'Day One Title'],
                    ]],
                    'current_page' => 1,
                    'has_next_page' => false,
                    'last_page' => 1,
                ],
            ],
        ];

        /**
         * @return array{imported:int, checked:int, pages:int, last_id:int}
         */
        public function run(): array
        {
            return $this->importUsingYearRanges(
                limit: 2,
                startId: 1,
                perPage: 50,
                startYear: 2025,
                startMonth: 0,
                startDay: null,
                startPage: 1,
                delayMs: 0,
                maxRateLimitRetries: 0,
                maxServerErrorRetries: 0,
                output: null,
            );
        }

        public function readImportCheckpoint(): ?array
        {
            return $this->checkpoint;
        }

        public function forgetImportCheckpoint(): void
        {
            $this->checkpoint = null;
        }

        protected function mediaPluralLabel(): string
        {
            return 'mangas';
        }

        protected function persistMedia(array $media): void
        {
            $this->persistedIds[] = (int) $media['id'];
        }

        protected function fetchPage(int $page, int $perPage, int $maxRateLimitRetries, int $maxServerErrorRetries, ?\Illuminate\Console\OutputStyle $output): array
        {
            throw new RuntimeException('Not used in this test.');
        }

        protected function fetchPageByStartDateRange(
            int $page,
            int $perPage,
            ?int $startDateGreater,
            ?int $startDateLesser,
            string $bucketLabel,
            array $excludedIds,
            int $maxRateLimitRetries,
            int $maxServerErrorRetries,
            ?\Illuminate\Console\OutputStyle $output,
        ): array {
            $this->fetchedBuckets[] = $bucketLabel.'#'.$page;

            return $this->responses[$bucketLabel][$page] ?? [
                'media' => [],
                'current_page' => $page,
                'has_next_page' => false,
                'last_page' => $page,
            ];
        }

        protected function rememberPageCheckpoint(int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
        {
            $this->checkpoint = [
                'mode' => 'page',
                'next_page' => $nextPage,
                'next_start_id' => $nextStartId,
                'last_imported_id' => $lastImportedId,
                'per_page' => $perPage,
            ];
        }

        protected function rememberDateRangeCheckpoint(int $nextYear, int $nextMonth, ?int $nextDay, int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
        {
            $this->checkpoint = [
                'mode' => 'date_range',
                'next_year' => $nextYear,
                'next_month' => $nextMonth,
                'next_day' => $nextDay,
                'next_page' => $nextPage,
                'next_start_id' => $nextStartId,
                'last_imported_id' => $lastImportedId,
                'per_page' => $perPage,
            ];
        }
    };

    $summary = $importer->run();

    expect($summary)->toMatchArray([
        'imported' => 2,
        'checked' => 2,
        'pages' => 4,
        'last_id' => 200,
    ])
        ->and($importer->persistedIds)->toBe([100, 200])
        ->and($importer->fetchedBuckets)->toBe([
            'estrenos de 2025 sin mes exacto#1',
            'estrenos de 2025-01#1',
            'estrenos de 2025-01 sin dia exacto#1',
            'estrenos de 2025-01-01#1',
        ])
        ->and($importer->checkpoint)->toMatchArray([
            'mode' => 'date_range',
            'next_year' => 2025,
            'next_month' => 1,
            'next_day' => 2,
            'next_page' => 1,
            'next_start_id' => 1,
            'last_imported_id' => 200,
            'per_page' => 50,
        ]);
});

test('it can resume directly from a day-level checkpoint', function () {
    $importer = new class extends AbstractAniListImporter
    {
        public array $fetchedBuckets = [];

        public ?array $checkpoint = null;

        /**
         * @return array{imported:int, checked:int, pages:int, last_id:int}
         */
        public function run(): array
        {
            return $this->importUsingYearRanges(
                limit: 1,
                startId: 1,
                perPage: 50,
                startYear: 2025,
                startMonth: 1,
                startDay: 2,
                startPage: 1,
                delayMs: 0,
                maxRateLimitRetries: 0,
                maxServerErrorRetries: 0,
                output: null,
            );
        }

        public function readImportCheckpoint(): ?array
        {
            return $this->checkpoint;
        }

        public function forgetImportCheckpoint(): void
        {
            $this->checkpoint = null;
        }

        protected function mediaPluralLabel(): string
        {
            return 'mangas';
        }

        protected function persistMedia(array $media): void
        {
        }

        protected function fetchPage(int $page, int $perPage, int $maxRateLimitRetries, int $maxServerErrorRetries, ?\Illuminate\Console\OutputStyle $output): array
        {
            throw new RuntimeException('Not used in this test.');
        }

        protected function fetchPageByStartDateRange(
            int $page,
            int $perPage,
            ?int $startDateGreater,
            ?int $startDateLesser,
            string $bucketLabel,
            array $excludedIds,
            int $maxRateLimitRetries,
            int $maxServerErrorRetries,
            ?\Illuminate\Console\OutputStyle $output,
        ): array {
            $this->fetchedBuckets[] = $bucketLabel.'#'.$page;

            return [
                'media' => [[
                    'id' => 300,
                    'title' => ['romaji' => 'Day Two Title'],
                ]],
                'current_page' => 1,
                'has_next_page' => false,
                'last_page' => 1,
            ];
        }

        protected function rememberPageCheckpoint(int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
        {
            $this->checkpoint = [];
        }

        protected function rememberDateRangeCheckpoint(int $nextYear, int $nextMonth, ?int $nextDay, int $nextPage, int $nextStartId, int $lastImportedId, int $perPage): void
        {
            $this->checkpoint = [
                'mode' => 'date_range',
                'next_year' => $nextYear,
                'next_month' => $nextMonth,
                'next_day' => $nextDay,
                'next_page' => $nextPage,
                'next_start_id' => $nextStartId,
                'last_imported_id' => $lastImportedId,
                'per_page' => $perPage,
            ];
        }
    };

    $summary = $importer->run();

    expect($summary)->toMatchArray([
        'imported' => 1,
        'checked' => 1,
        'pages' => 1,
        'last_id' => 300,
    ])
        ->and($importer->fetchedBuckets)->toBe([
            'estrenos de 2025-01-02#1',
        ])
        ->and($importer->checkpoint)->toMatchArray([
            'mode' => 'date_range',
            'next_year' => 2025,
            'next_month' => 1,
            'next_day' => 3,
            'next_page' => 1,
            'next_start_id' => 1,
            'last_imported_id' => 300,
            'per_page' => 50,
        ]);
});

<?php

use App\Services\AniList\AniListAnimeImporter;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Sleep;

it('retries a paginated request after exhausting server error retries', function () {
    Sleep::fake();

    Http::fake([
        'https://graphql.anilist.co' => Http::sequence()
            ->push([
                'errors' => [
                    ['message' => 'Internal Server Error', 'status' => 500],
                ],
                'data' => ['Page' => null],
            ], 500)
            ->push([
                'errors' => [
                    ['message' => 'Internal Server Error', 'status' => 500],
                ],
                'data' => ['Page' => null],
            ], 500)
            ->push([
                'errors' => [
                    ['message' => 'Internal Server Error', 'status' => 500],
                ],
                'data' => ['Page' => null],
            ], 500),
    ]);

    expect(fn () => fetchAnimePageResult(
        importer: app(AniListAnimeImporter::class),
        page: 1,
        perPage: 50,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 2,
    ))->toThrow(RuntimeException::class, 'pagina 1');

    Sleep::assertSequence([
        Sleep::for(2)->seconds(),
        Sleep::for(4)->seconds(),
    ]);
});

it('retries paginated server errors and returns the page once AniList recovers', function () {
    Sleep::fake();

    Http::fake([
        'https://graphql.anilist.co' => Http::sequence()
            ->push([
                'errors' => [
                    ['message' => 'Internal Server Error', 'status' => 500],
                ],
                'data' => ['Page' => null],
            ], 500)
            ->push([
                'data' => [
                    'Page' => [
                        'pageInfo' => [
                            'currentPage' => 1,
                            'hasNextPage' => false,
                            'perPage' => 50,
                        ],
                        'media' => [[
                            'id' => 76,
                            'title' => [
                                'romaji' => 'Mahou Sensei Negima!',
                                'english' => null,
                                'native' => null,
                            ],
                        ]],
                    ],
                ],
            ], 200),
    ]);

    $result = fetchAnimePageResult(
        importer: app(AniListAnimeImporter::class),
        page: 1,
        perPage: 50,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 2,
    );

    expect($result['current_page'])->toBe(1)
        ->and($result['has_next_page'])->toBeFalse()
        ->and($result['media'][0]['id'])->toBe(76)
        ->and($result['media'][0]['title']['romaji'])->toBe('Mahou Sensei Negima!');

    Sleep::assertSequence([
        Sleep::for(2)->seconds(),
    ]);
});

it('retries temporary connection errors and returns the paginated response once AniList recovers', function () {
    Sleep::fake();

    Http::fake(function () {
        static $attempt = 0;

        $attempt++;

        if ($attempt === 1) {
            throw new ConnectionException('cURL error 6: Could not resolve host: graphql.anilist.co');
        }

        return Http::response([
            'data' => [
                'Page' => [
                    'pageInfo' => [
                        'currentPage' => 228,
                        'hasNextPage' => true,
                        'perPage' => 50,
                    ],
                    'media' => [[
                        'id' => 103403,
                        'title' => [
                            'romaji' => 'Sensou no Tsukurikata',
                            'english' => null,
                            'native' => null,
                        ],
                    ]],
                ],
            ],
        ], 200);
    });

    $result = fetchAnimePageResult(
        importer: app(AniListAnimeImporter::class),
        page: 228,
        perPage: 50,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 2,
    );

    expect($result['current_page'])->toBe(228)
        ->and($result['has_next_page'])->toBeTrue()
        ->and($result['media'][0]['id'])->toBe(103403);

    Sleep::assertSequence([
        Sleep::for(2)->seconds(),
    ]);
});

it('imports multiple paginated anime in fewer requests', function () {
    recreateAniListImportTables();
    Sleep::fake();
    Cache::store(config('anime.cache.store', 'redis'))->flush();

    Http::fake([
        'https://graphql.anilist.co' => Http::sequence()
            ->push(paginatedMediaPayload([
                fakeAniListMedia(id: 100, title: 'Cowboy Bebop'),
                fakeAniListMedia(id: 200, title: 'Monster'),
            ], hasNextPage: true, currentPage: 1, perPage: 2), 200)
            ->push(paginatedMediaPayload([
                fakeAniListMedia(id: 300, title: 'Ping Pong'),
            ], hasNextPage: false, currentPage: 2, perPage: 2), 200),
    ]);

    $summary = app(AniListAnimeImporter::class)->importFirstAvailableAnime(
        limit: 3,
        startId: 1,
        perPage: 2,
        delayMs: 0,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 0,
        output: null,
    );

    expect($summary)->toMatchArray([
        'imported' => 3,
        'checked' => 3,
        'pages' => 2,
        'last_id' => 300,
    ]);

    expect(DB::table('anime')->orderBy('id')->pluck('id')->all())->toBe([100, 200, 300])
        ->and(DB::table('anime_title')->where('title_type', 'romaji')->orderBy('anime_id')->pluck('title')->all())
        ->toBe(['Cowboy Bebop', 'Monster', 'Ping Pong']);

    Http::assertSentCount(2);
    Http::assertSent(fn (Request $request): bool => data_get($request->data(), 'variables.page') === 1);
    Http::assertSent(fn (Request $request): bool => data_get($request->data(), 'variables.page') === 2);
});

it('falls back to UNKNOWN for required media lookups when AniList omits format or status', function () {
    recreateAniListImportTables();
    Cache::store(config('anime.cache.store', 'redis'))->flush();

    Http::fake([
        'https://graphql.anilist.co' => Http::sequence()
            ->push(paginatedMediaPayload([
                fakeAniListMedia(
                    id: 103403,
                    title: 'Sensou no Tsukurikata',
                    overrides: [
                        'format' => null,
                        'status' => null,
                    ],
                ),
            ], hasNextPage: false, currentPage: 1, perPage: 1), 200),
    ]);

    $summary = app(AniListAnimeImporter::class)->importFirstAvailableAnime(
        limit: 1,
        startId: 1,
        perPage: 1,
        delayMs: 0,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 0,
        output: null,
    );

    expect($summary['imported'])->toBe(1)
        ->and(DB::table('anime')->where('id', 103403)->value('format_code'))->toBe('UNKNOWN')
        ->and(DB::table('anime')->where('id', 103403)->value('status_code'))->toBe('UNKNOWN')
        ->and(DB::table('media_format')->where('code', 'UNKNOWN')->exists())->toBeTrue()
        ->and(DB::table('media_status')->where('code', 'UNKNOWN')->exists())->toBeTrue();
});

it('applies start id filtering while paginating aniList pages', function () {
    recreateAniListImportTables();
    Cache::store(config('anime.cache.store', 'redis'))->flush();

    Http::fake([
        'https://graphql.anilist.co' => Http::sequence()
            ->push(paginatedMediaPayload([
                fakeAniListMedia(id: 100, title: 'Cowboy Bebop'),
                fakeAniListMedia(id: 200, title: 'Monster'),
            ], hasNextPage: true, currentPage: 1, perPage: 2), 200)
            ->push(paginatedMediaPayload([
                fakeAniListMedia(id: 300, title: 'Ping Pong'),
                fakeAniListMedia(id: 400, title: 'Blue Box'),
            ], hasNextPage: false, currentPage: 2, perPage: 2), 200),
    ]);

    $summary = app(AniListAnimeImporter::class)->importFirstAvailableAnime(
        limit: 2,
        startId: 250,
        perPage: 2,
        delayMs: 0,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 0,
        output: null,
    );

    expect($summary)->toMatchArray([
        'imported' => 2,
        'checked' => 2,
        'pages' => 2,
        'last_id' => 400,
    ]);

    expect(DB::table('anime')->orderBy('id')->pluck('id')->all())->toBe([300, 400]);
});

it('starts from an explicit AniList page and persists a resume checkpoint', function () {
    recreateAniListImportTables();
    Cache::store(config('anime.cache.store', 'redis'))->flush();

    Http::fake([
        'https://graphql.anilist.co' => Http::sequence()
            ->push(paginatedMediaPayload([
                fakeAniListMedia(id: 300, title: 'Ping Pong'),
                fakeAniListMedia(id: 400, title: 'Blue Box'),
            ], hasNextPage: true, currentPage: 3, perPage: 2), 200)
            ->push(paginatedMediaPayload([
                fakeAniListMedia(id: 500, title: 'Witch Watch'),
            ], hasNextPage: false, currentPage: 4, perPage: 2), 200),
    ]);

    $importer = app(AniListAnimeImporter::class);

    $summary = $importer->importFirstAvailableAnime(
        limit: 3,
        startId: 350,
        startPage: 3,
        perPage: 2,
        delayMs: 0,
        maxRateLimitRetries: 0,
        maxServerErrorRetries: 0,
        output: null,
    );

    expect($summary)->toMatchArray([
        'imported' => 2,
        'checked' => 2,
        'pages' => 2,
        'last_id' => 500,
    ]);

    $checkpoint = $importer->readImportCheckpoint();

    expect($checkpoint)->not->toBeNull()
        ->and($checkpoint['next_page'])->toBe(5)
        ->and($checkpoint['next_start_id'])->toBe(501)
        ->and($checkpoint['last_imported_id'])->toBe(500);

    Http::assertSent(fn (Request $request): bool => data_get($request->data(), 'variables.page') === 3);
    Http::assertSent(fn (Request $request): bool => data_get($request->data(), 'variables.page') === 4);
});

it('deduplicates AniList trends that share the same date before inserting', function () {
    recreateAniListImportTables();

    $method = new ReflectionMethod(app(AniListAnimeImporter::class), 'syncTrends');

    $method->invoke(
        app(AniListAnimeImporter::class),
        2710,
        [
            [
                'node' => [
                    'date' => '20190614',
                    'trending' => 1,
                    'popularity' => 50,
                ],
            ],
            [
                'node' => [
                    'date' => '20190614',
                    'trending' => 3,
                    'popularity' => 55,
                ],
            ],
            [
                'node' => [
                    'date' => '20190830',
                    'trending' => 2,
                    'popularity' => 52,
                ],
            ],
        ],
    );

    $trends = DB::table('anime_trend')
        ->where('anime_id', 2710)
        ->orderBy('trend_date')
        ->get(['trend_date', 'episode', 'trending', 'popularity']);

    expect($trends)->toHaveCount(2)
        ->and($trends[0]->trend_date)->toBe('2019-06-14')
        ->and((int) $trends[0]->episode)->toBe(0)
        ->and((int) $trends[0]->trending)->toBe(3)
        ->and((int) $trends[0]->popularity)->toBe(55)
        ->and($trends[1]->trend_date)->toBe('2019-08-30');
});

it('deduplicates repeated AniList tags before inserting the anime tag pivot rows', function () {
    recreateAniListImportTables();

    $method = new ReflectionMethod(app(AniListAnimeImporter::class), 'syncTags');

    $method->invoke(
        app(AniListAnimeImporter::class),
        7411,
        [
            [
                'id' => 483,
                'name' => 'Primarily Adult Cast',
                'description' => 'Adults are the primary characters.',
                'category' => 'Cast-Main Cast',
                'rank' => 20,
            ],
            [
                'id' => 483,
                'name' => 'Primarily Adult Cast',
                'description' => 'Adults are the primary characters.',
                'category' => 'Cast-Main Cast',
                'rank' => 18,
            ],
            [
                'id' => 483,
                'name' => 'Primarily Adult Cast',
                'description' => 'Adults are the primary characters.',
                'category' => 'Cast-Main Cast',
                'rank' => 25,
            ],
            [
                'id' => 23,
                'name' => 'Female Protagonist',
                'description' => null,
                'category' => 'Cast-Main Cast',
                'rank' => 96,
            ],
        ],
    );

    $animeTags = DB::table('anime_tag')
        ->where('anime_id', 7411)
        ->orderBy('tag_id')
        ->get(['tag_id', 'rank']);

    expect($animeTags)->toHaveCount(2)
        ->and((int) $animeTags[0]->tag_id)->toBe(23)
        ->and((int) $animeTags[0]->rank)->toBe(96)
        ->and((int) $animeTags[1]->tag_id)->toBe(483)
        ->and((int) $animeTags[1]->rank)->toBe(25)
        ->and(DB::table('tag')->where('id', 483)->count())->toBe(1);
});

it('reuses an existing company when AniList returns the same studio name with a different id', function () {
    recreateAniListImportTables();

    DB::table('company')->insert([
        'id' => 9001,
        'name' => 'Sunlight Entertainment',
    ]);

    $method = new ReflectionMethod(app(AniListAnimeImporter::class), 'syncCompanies');

    $method->invoke(
        app(AniListAnimeImporter::class),
        7411,
        [[
            'isMain' => true,
            'node' => [
                'id' => 7578,
                'name' => 'Sunlight Entertainment',
            ],
        ]],
    );

    expect(DB::table('company')->where('name', 'Sunlight Entertainment')->count())->toBe(1)
        ->and(DB::table('company')->value('id'))->toBe(9001)
        ->and(DB::table('anime_company')->first())->toMatchObject((object) [
            'anime_id' => 7411,
            'company_id' => 9001,
            'is_main' => true,
        ]);
});

it('reuses an existing external link with the same site and url', function () {
    recreateExternalLinkTables();

    DB::table('external_link')->insert([
        'id' => 1,
        'site' => 'Hulu',
        'url' => 'http://www.hulu.com/vandread',
        'type_code' => 'STREAMING',
        'language' => null,
        'color' => '#000000',
        'icon' => 'https://example.com/original.png',
    ]);

    $method = new ReflectionMethod(app(AniListAnimeImporter::class), 'syncExternalLinks');

    $method->invoke(
        app(AniListAnimeImporter::class),
        180,
        [[
            'id' => 1909,
            'site' => 'Hulu',
            'url' => 'http://www.hulu.com/vandread',
            'type' => 'STREAMING',
            'language' => null,
            'color' => '#1CE783',
            'icon' => 'https://s4.anilist.co/file/anilistcdn/link/icon/7-rM06PQyWONGC.png',
        ]],
    );

    expect(DB::table('external_link')->count())->toBe(1)
        ->and(DB::table('external_link')->value('id'))->toBe(1)
        ->and(DB::table('external_link')->value('color'))->toBe('#1CE783')
        ->and(DB::table('external_link')->value('icon'))->toBe('https://s4.anilist.co/file/anilistcdn/link/icon/7-rM06PQyWONGC.png')
        ->and(DB::table('anime_external_link')->first())->toMatchObject((object) [
            'anime_id' => 180,
            'external_link_id' => 1,
        ]);
});

it('detects postgres external link primary key collisions caused by a desynced sequence', function () {
    $importer = app(AniListAnimeImporter::class);
    $method = new ReflectionMethod($importer, 'isExternalLinkPrimaryKeySequenceCollision');

    $primaryKeyException = new UniqueConstraintViolationException(
        'pgsql',
        'insert into "external_link" ("site", "url") values (?, ?)',
        ['Crunchyroll', 'https://www.crunchyroll.com/gad-guard'],
        new \PDOException('SQLSTATE[23505]: Unique violation: 7 ERROR: duplicate key value violates unique constraint "external_link_pkey" DETAIL: Key (id)=(122) already exists.')
    );

    $siteUrlException = new UniqueConstraintViolationException(
        'pgsql',
        'insert into "external_link" ("site", "url") values (?, ?)',
        ['Hulu', 'http://www.hulu.com/vandread'],
        new \PDOException('SQLSTATE[23505]: Unique violation: 7 ERROR: duplicate key value violates unique constraint "external_link_site_url_unique" DETAIL: Key (site, url)=(Hulu, http://www.hulu.com/vandread) already exists.')
    );

    expect($method->invoke($importer, $primaryKeyException))->toBeTrue()
        ->and($method->invoke($importer, $siteUrlException))->toBeFalse();
});

function fetchAnimePageResult(
    AniListAnimeImporter $importer,
    int $page,
    int $perPage,
    int $maxRateLimitRetries,
    int $maxServerErrorRetries,
): array {
    $method = new ReflectionMethod($importer, 'fetchAnimePage');

    /** @var array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool} $result */
    $result = $method->invoke(
        $importer,
        $page,
        $perPage,
        $maxRateLimitRetries,
        $maxServerErrorRetries,
        null,
    );

    return $result;
}

/**
 * @param  list<array<string, mixed>>  $media
 * @return array<string, mixed>
 */
function paginatedMediaPayload(array $media, bool $hasNextPage, int $currentPage, int $perPage): array
{
    return [
        'data' => [
            'Page' => [
                'pageInfo' => [
                    'currentPage' => $currentPage,
                    'hasNextPage' => $hasNextPage,
                    'perPage' => $perPage,
                ],
                'media' => $media,
            ],
        ],
    ];
}

/**
 * @return array<string, mixed>
 */
function fakeAniListMedia(int $id, string $title, array $overrides = []): array
{
    return array_replace_recursive([
        'id' => $id,
        'title' => [
            'romaji' => $title,
            'english' => null,
            'native' => null,
        ],
        'coverImage' => [
            'color' => '#101010',
            'large' => "https://img.example.com/{$id}.jpg",
        ],
        'bannerImage' => "https://img.example.com/banner-{$id}.jpg",
        'description' => null,
        'format' => 'TV',
        'status' => 'RELEASING',
        'episodes' => 12,
        'duration' => 24,
        'season' => 'SPRING',
        'seasonYear' => 2026,
        'source' => 'MANGA',
        'genres' => [],
        'averageScore' => 80,
        'popularity' => 1000,
        'isAdult' => false,
        'favourites' => 500,
        'startDate' => [
            'year' => 2026,
            'month' => 3,
            'day' => 26,
        ],
        'endDate' => null,
        'nextAiringEpisode' => null,
        'studios' => ['edges' => []],
        'tags' => [],
        'externalLinks' => [],
        'trends' => ['edges' => []],
    ], $overrides);
}

function recreateAniListImportTables(): void
{
    Schema::dropIfExists('anime_trend');
    Schema::dropIfExists('anime_external_link');
    Schema::dropIfExists('external_link');
    Schema::dropIfExists('external_link_type');
    Schema::dropIfExists('anime_company');
    Schema::dropIfExists('company');
    Schema::dropIfExists('anime_tag');
    Schema::dropIfExists('tag');
    Schema::dropIfExists('anime_genre');
    Schema::dropIfExists('genre');
    Schema::dropIfExists('anime_title');
    Schema::dropIfExists('anime');
    Schema::dropIfExists('media_source');
    Schema::dropIfExists('media_season');
    Schema::dropIfExists('media_status');
    Schema::dropIfExists('media_format');

    Schema::create('media_format', function ($table): void {
        $table->text('code');
        $table->text('description')->nullable();
        $table->primary('code');
    });

    Schema::create('media_status', function ($table): void {
        $table->text('code');
        $table->text('description')->nullable();
        $table->primary('code');
    });

    Schema::create('media_season', function ($table): void {
        $table->text('code');
        $table->text('description')->nullable();
        $table->primary('code');
    });

    Schema::create('media_source', function ($table): void {
        $table->text('code');
        $table->text('description')->nullable();
        $table->primary('code');
    });

    Schema::create('anime', function ($table): void {
        $table->integer('id')->primary();
        $table->text('format_code');
        $table->text('status_code');
        $table->integer('episodes')->nullable();
        $table->integer('next_airing_episode')->nullable();
        $table->timestamp('next_airing_at')->nullable();
        $table->integer('duration_minutes')->nullable();
        $table->text('season_code')->nullable();
        $table->integer('season_year')->nullable();
        $table->text('source_code')->nullable();
        $table->text('description')->nullable();
        $table->integer('average_score')->nullable();
        $table->integer('popularity')->nullable();
        $table->boolean('is_adult')->default(false);
        $table->integer('favourites')->nullable();
        $table->date('start_date')->nullable();
        $table->date('end_date')->nullable();
        $table->text('cover_image_color')->nullable();
        $table->text('cover_image_large')->nullable();
        $table->text('banner_image')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
    });

    Schema::create('anime_title', function ($table): void {
        $table->integer('anime_id');
        $table->text('title_type');
        $table->text('title');
    });

    Schema::create('genre', function ($table): void {
        $table->text('name');
        $table->primary('name');
    });

    Schema::create('anime_genre', function ($table): void {
        $table->integer('anime_id');
        $table->text('genre_name');
    });

    Schema::create('tag', function ($table): void {
        $table->integer('id')->primary();
        $table->text('name');
        $table->text('description')->nullable();
        $table->text('category')->nullable();
    });

    Schema::create('anime_tag', function ($table): void {
        $table->integer('anime_id');
        $table->integer('tag_id');
        $table->integer('rank')->nullable();
    });

    Schema::create('company', function ($table): void {
        $table->integer('id')->primary();
        $table->text('name');
    });

    Schema::create('anime_company', function ($table): void {
        $table->integer('anime_id');
        $table->integer('company_id');
        $table->boolean('is_main')->default(false);
    });

    Schema::create('external_link_type', function ($table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

    Schema::create('external_link', function ($table): void {
        $table->bigIncrements('id');
        $table->text('site');
        $table->text('url');
        $table->text('type_code')->nullable();
        $table->text('language')->nullable();
        $table->text('color')->nullable();
        $table->text('icon')->nullable();
        $table->unique(['site', 'url']);
    });

    Schema::create('anime_external_link', function ($table): void {
        $table->integer('anime_id');
        $table->unsignedBigInteger('external_link_id');
    });

    Schema::create('anime_trend', function ($table): void {
        $table->integer('anime_id');
        $table->date('trend_date');
        $table->integer('episode');
        $table->integer('trending')->nullable();
        $table->integer('average_score')->nullable();
        $table->integer('popularity')->nullable();
        $table->timestamp('created_at')->nullable();
    });
}

function recreateExternalLinkTables(): void
{
    Schema::dropIfExists('anime_external_link');
    Schema::dropIfExists('external_link');
    Schema::dropIfExists('external_link_type');

    Schema::create('external_link_type', function ($table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

    Schema::create('external_link', function ($table): void {
        $table->bigIncrements('id');
        $table->text('site');
        $table->text('url');
        $table->text('type_code')->nullable();
        $table->text('language')->nullable();
        $table->text('color')->nullable();
        $table->text('icon')->nullable();
        $table->unique(['site', 'url']);
    });

    Schema::create('anime_external_link', function ($table): void {
        $table->integer('anime_id');
        $table->unsignedBigInteger('external_link_id');
        $table->primary(['anime_id', 'external_link_id']);
    });
}

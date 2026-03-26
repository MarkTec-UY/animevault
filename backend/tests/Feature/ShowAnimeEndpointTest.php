<?php

require_once __DIR__.'/../Support/AnimeCatalogTestData.php';

use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    flushAnimeApiCache();
    recreateAnimeCatalogTables();
    seedAnimeReferenceData();
    seedAnimeCatalogFixtures();
});

it('returns an anime with its related metadata', function () {
    $response = $this->getJson('/api/v1/anime/1');

    $response->assertOk()
        ->assertJsonPath('id', 1)
        ->assertJsonPath('preferred_title', 'Cowboy Bebop')
        ->assertJsonPath('format.code', 'TV')
        ->assertJsonPath('format.description', 'Television')
        ->assertJsonPath('status.code', 'FINISHED')
        ->assertJsonPath('season.code', 'SPRING')
        ->assertJsonPath('season_year', 1998)
        ->assertJsonPath('source.code', 'ORIGINAL')
        ->assertJsonPath('titles.romaji', 'Cowboy Bebop')
        ->assertJsonPath('titles.native', 'カウボーイビバップ')
        ->assertJsonPath('genres.0', 'Action')
        ->assertJsonPath('genres.1', 'Sci-Fi')
        ->assertJsonPath('main_studio.name', 'Sunrise')
        ->assertJsonPath('tags.0.id', 10)
        ->assertJsonPath('tags.0.name', 'Space')
        ->assertJsonPath('tags.0.rank', 90)
        ->assertJsonPath('companies.0.id', 100)
        ->assertJsonPath('companies.0.is_main', true)
        ->assertJsonPath('external_links.0.site', 'AniList')
        ->assertJsonPath('external_links.1.type.code', 'STREAMING')
        ->assertJsonPath('trends.0.episode', 1)
        ->assertJsonPath('trends.1.trending', 1180);
});

it('returns 404 when the anime does not exist', function () {
    $response = $this->getJson('/api/v1/anime/999');

    $response->assertNotFound()
        ->assertJson([
            'message' => 'Anime not found.',
        ]);
});

it('caches anime detail responses because they are expensive to rebuild', function () {
    $firstResponse = $this->getJson('/api/v1/anime/1');

    DB::table('anime_title')
        ->where('anime_id', 1)
        ->where('title_type', 'english')
        ->update(['title' => 'Modified Title']);

    $secondResponse = $this->getJson('/api/v1/anime/1');

    $firstResponse->assertOk()
        ->assertJsonPath('titles.english', 'Cowboy Bebop');

    $secondResponse->assertOk()
        ->assertJsonPath('titles.english', 'Cowboy Bebop');
});

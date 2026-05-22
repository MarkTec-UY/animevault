<?php

require_once __DIR__.'/../Support/AnimeCatalogTestData.php';

use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    flushAnimeApiCache();
    recreateAnimeCatalogTables();
    seedAnimeReferenceData();
    seedAnimeCatalogFixtures();
});

it('returns metadata required to build anime discovery filters', function () {
    $response = $this->getJson('/api/v1/anime/filters');

    $response->assertOk()
        ->assertJsonPath('formats.0.code', 'TV')
        ->assertJsonPath('formats.0.description', 'TV Show')
        ->assertJsonPath('statuses.0.code', 'RELEASING')
        ->assertJsonPath('statuses.0.description', 'Airing')
        ->assertJsonPath('statuses.1.code', 'NOT_YET_RELEASED')
        ->assertJsonPath('statuses.1.description', 'Not Yet Aired')
        ->assertJsonPath('seasons.0.code', 'WINTER')
        ->assertJsonPath('seasons.1.code', 'SPRING')
        ->assertJsonPath('sources.0.code', 'MANGA')
        ->assertJsonPath('genres.0', 'Action')
        ->assertJsonPath('years.0', 2023)
        ->assertJsonPath('years.1', 1998)
        ->assertJsonPath('sort_options.0.value', 'popularity_desc')
        ->assertJsonPath('sort_options.5.value', 'title_asc');
});

it('caches anime filter metadata because it is reused heavily by the frontend', function () {
    $firstResponse = $this->getJson('/api/v1/anime/filters');

    DB::table('genre')->where('name', 'Action')->delete();

    $secondResponse = $this->getJson('/api/v1/anime/filters');

    $firstResponse->assertOk()
        ->assertJsonPath('genres.0', 'Action');

    $secondResponse->assertOk()
        ->assertJsonPath('genres.0', 'Action');
});

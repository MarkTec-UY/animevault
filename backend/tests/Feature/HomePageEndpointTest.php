<?php

require_once __DIR__.'/../Support/AnimeCatalogTestData.php';

use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    flushAnimeApiCache();
    recreateAnimeCatalogTables();
    seedAnimeReferenceData();
    seedAnimeCatalogFixtures();
});

it('returns the aggregated public home page feed', function () {
    $response = $this->getJson('/api/v1/home');

    $response->assertOk()
        ->assertJsonPath('hero.featured.id', 2)
        ->assertJsonPath('hero.featured.preferred_title', 'Frieren: Beyond Journey\'s End')
        ->assertJsonPath('hero.spotlight.0.id', 1)
        ->assertJsonPath('trending.0.id', 1)
        ->assertJsonPath('seasonal.label', 'Fall 2023')
        ->assertJsonPath('seasonal.items.0.id', 2)
        ->assertJsonPath('top_rated.0.id', 2)
        ->assertJsonPath('genres.0.name', 'Drama')
        ->assertJsonPath('genres.0.anime_count', 2)
        ->assertJsonPath('stats.0.label', 'Anime Titles')
        ->assertJsonPath('stats.0.value', 3);
});

it('caches the public home page payload', function () {
    $firstResponse = $this->getJson('/api/v1/home');

    DB::table('anime_title')
        ->where('anime_id', 2)
        ->where('title_type', 'english')
        ->update(['title' => 'Modified Home Title']);

    $secondResponse = $this->getJson('/api/v1/home');

    $firstResponse->assertOk()
        ->assertJsonPath('hero.featured.preferred_title', 'Frieren: Beyond Journey\'s End');

    $secondResponse->assertOk()
        ->assertJsonPath('hero.featured.preferred_title', 'Frieren: Beyond Journey\'s End');
});

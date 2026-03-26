<?php

require_once __DIR__.'/../Support/AnimeCatalogTestData.php';

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    flushAnimeApiCache();
    recreateAnimeCatalogTables();
    seedAnimeReferenceData();
    seedAnimeCatalogFixtures();
});

it('lists anime with pagination and default sorting', function () {
    $response = $this->getJson('/api/v1/anime?per_page=2');

    $response->assertOk()
        ->assertJsonPath('data.0.id', 2)
        ->assertJsonPath('data.0.preferred_title', 'Frieren: Beyond Journey\'s End')
        ->assertJsonPath('data.0.main_studio.name', 'Madhouse')
        ->assertJsonPath('data.1.id', 1)
        ->assertJsonPath('data.1.genres.0', 'Action')
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonPath('meta.sort', 'popularity_desc');
});

it('applies search and filter parameters to the anime list', function () {
    $response = $this->getJson(
        '/api/v1/anime?search=frieren&genres=Fantasy&status=FINISHED&format=TV&year=2023&sort=title_asc'
    );

    $response->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.filters.search', 'frieren')
        ->assertJsonPath('meta.filters.genres.0', 'Fantasy')
        ->assertJsonPath('data.0.id', 2)
        ->assertJsonPath('data.0.titles.romaji', 'Sousou no Frieren');
});

it('accepts boolean query parameters from swagger style requests', function () {
    $response = $this->getJson('/api/v1/anime?is_adult=true');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.filters.is_adult', true)
        ->assertJsonPath('data.0.is_adult', true);
});

it('validates unsupported query parameters', function () {
    $response = $this->getJson('/api/v1/anime?sort=unknown-order');

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['sort']);
});

it('caches paginated anime lists for repeated filter combinations', function () {
    $firstResponse = $this->getJson('/api/v1/anime?per_page=2&sort=popularity_desc');

    DB::table('anime')
        ->where('id', 2)
        ->update(['popularity' => 1]);

    $secondResponse = $this->getJson('/api/v1/anime?per_page=2&sort=popularity_desc');

    $firstResponse->assertOk()
        ->assertJsonPath('data.0.id', 2);

    $secondResponse->assertOk()
        ->assertJsonPath('data.0.id', 2);
});

it('uses the authenticated user preferred title language when listing anime', function () {
    $user = User::factory()->create([
        'preferred_title_language' => 'romaji',
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/anime?search=frieren');

    $response->assertOk()
        ->assertJsonPath('data.0.id', 2)
        ->assertJsonPath('data.0.preferred_title', 'Sousou no Frieren');
});

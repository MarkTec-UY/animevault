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

it('accepts trending sorting and orders anime by trend momentum', function () {
    $response = $this->getJson('/api/v1/anime?sort=trending_desc');

    $response->assertOk()
        ->assertJsonPath('meta.sort', 'trending_desc')
        ->assertJsonPath('data.0.id', 2)
        ->assertJsonPath('data.1.id', 1);
});

it('keeps obscure high-score anime behind established top-rated titles', function () {
    DB::table('anime')->insert([
        'id' => 999,
        'format_code' => 'TV',
        'status_code' => 'FINISHED',
        'episodes' => 12,
        'duration_minutes' => 24,
        'season_code' => 'SPRING',
        'season_year' => 2026,
        'source_code' => 'ORIGINAL',
        'description' => 'Very obscure but highly scored title.',
        'cover_image_color' => '#111111',
        'cover_image_large' => 'https://cdn.example.com/unknown-cover.jpg',
        'banner_image' => 'https://cdn.example.com/unknown-banner.jpg',
        'average_score' => 100,
        'popularity' => 125,
        'is_adult' => false,
        'favourites' => 12,
        'start_date' => '2026-03-01',
        'end_date' => '2026-06-01',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('anime_title')->insert([
        'anime_id' => 999,
        'title_type' => 'english',
        'title' => 'Unknown Masterpiece',
    ]);

    $response = $this->getJson('/api/v1/anime?sort=score_desc&per_page=3');

    $response->assertOk()
        ->assertJsonPath('data.0.id', 2)
        ->assertJsonPath('data.1.id', 1)
        ->assertJsonPath('data.2.id', 999);
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

<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    config(['anime.cache.store' => 'array']);
    flushUserAnimeApiCache();
    recreateUserAnimeApiTables();
});

it('creates or updates a user anime library entry and exposes its state', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    Sanctum::actingAs($user);

    $createResponse = $this->putJson('/api/v1/me/library/100', [
        'status' => 'watching',
        'progress_episodes' => 18,
        'score' => 9,
    ]);

    $createResponse->assertCreated()
        ->assertJsonPath('anime.id', 100)
        ->assertJsonPath('library_entry.status', 'watching')
        ->assertJsonPath('library_entry.progress_label', '18/25')
        ->assertJsonPath('library_entry.score', 9)
        ->assertJsonPath('library_entry.is_favorite', false);

    $stateResponse = $this->getJson('/api/v1/me/anime/100');

    $stateResponse->assertOk()
        ->assertJsonPath('anime.preferred_title', 'Cowboy Bebop')
        ->assertJsonPath('is_favorite', false)
        ->assertJsonPath('library_entry.status', 'watching')
        ->assertJsonPath('library_entry.progress_episodes', 18);

    $updateResponse = $this->putJson('/api/v1/me/library/100', [
        'status' => 'completed',
        'score' => 10,
    ]);

    $updateResponse->assertOk()
        ->assertJsonPath('library_entry.status', 'completed')
        ->assertJsonPath('library_entry.progress_episodes', 25)
        ->assertJsonPath('library_entry.progress_label', '25/25')
        ->assertJsonPath('library_entry.score', 10);
});

it('lists authenticated user library entries with status filtering', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    createAnimeRecord(100, 25, 'Cowboy Bebop');
    createAnimeRecord(200, 24, 'Monster');
    createAnimeRecord(300, 12, 'Ping Pong');

    DB::table('user_anime_library')->insert([
        [
            'user_id' => $user->id,
            'anime_id' => 100,
            'status' => 'watching',
            'progress_episodes' => 18,
            'score' => 9,
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ],
        [
            'user_id' => $user->id,
            'anime_id' => 200,
            'status' => 'completed',
            'progress_episodes' => 24,
            'score' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $otherUser->id,
            'anime_id' => 300,
            'status' => 'watching',
            'progress_episodes' => 12,
            'score' => 8,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    DB::table('user_anime_favorite')->insert([
        'user_id' => $user->id,
        'anime_id' => 100,
        'created_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/me/library?status=watching');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.status.0', 'watching')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.anime.id', 100)
        ->assertJsonPath('data.0.library_entry.status', 'watching')
        ->assertJsonPath('data.0.library_entry.is_favorite', true);
});

it('caches user anime state between repeated reads', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    Sanctum::actingAs($user);

    $firstResponse = $this->getJson('/api/v1/me/anime/100');

    DB::table('user_anime_favorite')->insert([
        'user_id' => $user->id,
        'anime_id' => 100,
        'created_at' => now(),
    ]);

    $secondResponse = $this->getJson('/api/v1/me/anime/100');

    $firstResponse->assertOk()
        ->assertJsonPath('is_favorite', false);

    $secondResponse->assertOk()
        ->assertJsonPath('is_favorite', false);
});

it('invalidates cached user state views when library or favorites change', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    Sanctum::actingAs($user);

    $initialLibrary = $this->getJson('/api/v1/me/library');
    $initialFavorites = $this->getJson('/api/v1/me/favorites');
    $initialState = $this->getJson('/api/v1/me/anime/100');

    $initialLibrary->assertOk()
        ->assertJsonPath('meta.total', 0);

    $initialFavorites->assertOk()
        ->assertJsonPath('meta.total', 0);

    $initialState->assertOk()
        ->assertJsonPath('is_favorite', false)
        ->assertJsonPath('library_entry', null);

    $favoriteResponse = $this->putJson('/api/v1/me/favorites/100');

    $favoriteResponse->assertCreated()
        ->assertJsonPath('is_favorite', true);

    $favoritesAfterCreate = $this->getJson('/api/v1/me/favorites');
    $stateAfterFavorite = $this->getJson('/api/v1/me/anime/100');

    $favoritesAfterCreate->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.is_favorite', true);

    $stateAfterFavorite->assertOk()
        ->assertJsonPath('is_favorite', true);

    $libraryCreateResponse = $this->putJson('/api/v1/me/library/100', [
        'status' => 'watching',
        'progress_episodes' => 5,
    ]);

    $libraryCreateResponse->assertCreated()
        ->assertJsonPath('library_entry.status', 'watching');

    $libraryAfterCreate = $this->getJson('/api/v1/me/library');
    $favoritesAfterLibraryCreate = $this->getJson('/api/v1/me/favorites');
    $stateAfterLibraryCreate = $this->getJson('/api/v1/me/anime/100');

    $libraryAfterCreate->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.library_entry.status', 'watching');

    $favoritesAfterLibraryCreate->assertOk()
        ->assertJsonPath('data.0.library_entry.status', 'watching');

    $stateAfterLibraryCreate->assertOk()
        ->assertJsonPath('library_entry.status', 'watching');

    $deleteFavoriteResponse = $this->deleteJson('/api/v1/me/favorites/100');
    $deleteFavoriteResponse->assertNoContent();

    $favoritesAfterDelete = $this->getJson('/api/v1/me/favorites');
    $stateAfterDelete = $this->getJson('/api/v1/me/anime/100');

    $favoritesAfterDelete->assertOk()
        ->assertJsonPath('meta.total', 0);

    $stateAfterDelete->assertOk()
        ->assertJsonPath('is_favorite', false)
        ->assertJsonPath('library_entry.status', 'watching');
});

it('increments the shared user anime state version on each mutation', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    Sanctum::actingAs($user);

    expect(userAnimeStateVersion($user->id))->toBeNull();

    $this->getJson('/api/v1/me/library')->assertOk();
    expect(userAnimeStateVersion($user->id))->toBe(1);

    $this->putJson('/api/v1/me/favorites/100')->assertCreated();
    expect(userAnimeStateVersion($user->id))->toBe(2);

    $this->putJson('/api/v1/me/library/100', [
        'status' => 'watching',
        'progress_episodes' => 3,
    ])->assertCreated();
    expect(userAnimeStateVersion($user->id))->toBe(3);

    $this->deleteJson('/api/v1/me/favorites/100')->assertNoContent();
    expect(userAnimeStateVersion($user->id))->toBe(4);
});

it('adds, lists and removes favorites independently from library status', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    Sanctum::actingAs($user);

    $storeResponse = $this->putJson('/api/v1/me/favorites/100');

    $storeResponse->assertCreated()
        ->assertJsonPath('anime.id', 100)
        ->assertJsonPath('is_favorite', true)
        ->assertJsonPath('library_entry', null);

    $listResponse = $this->getJson('/api/v1/me/favorites');

    $listResponse->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.anime.preferred_title', 'Cowboy Bebop')
        ->assertJsonPath('data.0.is_favorite', true)
        ->assertJsonPath('data.0.library_entry', null);

    $deleteResponse = $this->deleteJson('/api/v1/me/favorites/100');
    $deleteResponse->assertNoContent();

    $stateResponse = $this->getJson('/api/v1/me/anime/100');
    $stateResponse->assertOk()
        ->assertJsonPath('is_favorite', false);
});

it('rejects progress greater than the anime total episodes', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    Sanctum::actingAs($user);

    $response = $this->putJson('/api/v1/me/library/100', [
        'status' => 'watching',
        'progress_episodes' => 26,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['progress_episodes']);
});

it('removes a library entry without affecting favorites', function () {
    $user = User::factory()->create();
    createAnimeRecord(100, 25, 'Cowboy Bebop');

    DB::table('user_anime_library')->insert([
        'user_id' => $user->id,
        'anime_id' => 100,
        'status' => 'paused',
        'progress_episodes' => 10,
        'score' => 7,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('user_anime_favorite')->insert([
        'user_id' => $user->id,
        'anime_id' => 100,
        'created_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $response = $this->deleteJson('/api/v1/me/library/100');

    $response->assertNoContent();

    $stateResponse = $this->getJson('/api/v1/me/anime/100');

    $stateResponse->assertOk()
        ->assertJsonPath('library_entry', null)
        ->assertJsonPath('is_favorite', true);
});

it('uses the user preferred title language and timezone in user anime responses', function () {
    $user = User::factory()->create([
        'timezone' => 'America/Montevideo',
        'preferred_title_language' => 'native',
    ]);

    createAnimeRecord(400, 12, 'Blue Box', [
        'romaji' => 'Ao no Hako',
        'english' => 'Blue Box',
        'native' => 'アオのハコ',
    ]);

    DB::table('user_anime_library')->insert([
        'user_id' => $user->id,
        'anime_id' => 400,
        'status' => 'watching',
        'progress_episodes' => 3,
        'started_at' => '2026-03-26T03:00:00+00:00',
        'updated_at' => '2026-03-26T03:00:00+00:00',
        'created_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/me/anime/400');

    $response->assertOk()
        ->assertJsonPath('anime.preferred_title', 'アオのハコ')
        ->assertJsonPath('library_entry.started_at', '2026-03-26T00:00:00-03:00')
        ->assertJsonPath('library_entry.updated_at', '2026-03-26T00:00:00-03:00');
});

function recreateUserAnimeApiTables(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('user_anime_favorite');
    Schema::dropIfExists('user_anime_library');
    Schema::dropIfExists('anime_title');
    Schema::dropIfExists('anime');
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table): void {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->text('about_me')->nullable();
        $table->string('avatar_path')->nullable();
        $table->string('banner_path')->nullable();
        $table->string('timezone')->default('UTC');
        $table->boolean('is_profile_public')->default(true);
        $table->string('preferred_title_language')->default('english');
        $table->string('preferred_scoring_system')->default('point_10');
        $table->rememberToken();
        $table->timestamps();
    });

    Schema::create('anime', function (Blueprint $table): void {
        $table->integer('id')->primary();
        $table->string('format_code')->nullable();
        $table->string('status_code')->nullable();
        $table->integer('episodes')->nullable();
        $table->text('cover_image_color')->nullable();
        $table->text('cover_image_large')->nullable();
        $table->text('banner_image')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
    });

    Schema::create('anime_title', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->string('title_type');
        $table->string('title');
    });

    Schema::create('media_format', function (Blueprint $table): void {
        $table->string('code')->primary();
        $table->string('description')->nullable();
    });

    Schema::create('media_status', function (Blueprint $table): void {
        $table->string('code')->primary();
        $table->string('description')->nullable();
    });

    Schema::create('user_anime_library', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('user_id');
        $table->integer('anime_id');
        $table->string('status');
        $table->integer('progress_episodes')->default(0);
        $table->integer('score')->nullable();
        $table->timestamp('started_at')->nullable();
        $table->timestamp('completed_at')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
        $table->unique(['user_id', 'anime_id']);
    });

    Schema::create('user_anime_favorite', function (Blueprint $table): void {
        $table->unsignedBigInteger('user_id');
        $table->integer('anime_id');
        $table->timestamp('created_at')->nullable();
        $table->primary(['user_id', 'anime_id']);
    });

    Schema::enableForeignKeyConstraints();
}

function flushUserAnimeApiCache(): void
{
    Cache::store(config('anime.cache.store'))->flush();
}

function userAnimeStateVersion(int $userId): mixed
{
    return Cache::store(config('anime.cache.store'))
        ->get("user_anime_state:version:{$userId}");
}

/**
 * @param  array{romaji?:?string, english?:?string, native?:?string}  $titles
 */
function createAnimeRecord(int $id, int $episodes, string $title, array $titles = []): void
{
    DB::table('media_format')->insert([
        'code' => "TV-{$id}",
        'description' => 'TV',
    ]);

    DB::table('media_status')->insert([
        'code' => "STATUS-{$id}",
        'description' => 'Releasing',
    ]);

    DB::table('anime')->insert([
        'id' => $id,
        'format_code' => "TV-{$id}",
        'status_code' => "STATUS-{$id}",
        'episodes' => $episodes,
        'cover_image_color' => '#101010',
        'cover_image_large' => "https://img.example.com/{$id}.jpg",
        'banner_image' => "https://img.example.com/banner-{$id}.jpg",
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $resolvedTitles = [
        'romaji' => $titles['romaji'] ?? null,
        'english' => $titles['english'] ?? $title,
        'native' => $titles['native'] ?? null,
    ];

    DB::table('anime_title')->insert(
        collect($resolvedTitles)
            ->filter(fn (?string $value): bool => filled($value))
            ->map(fn (string $value, string $type): array => [
                'anime_id' => $id,
                'title_type' => $type,
                'title' => $value,
            ])
            ->values()
            ->all(),
    );
}

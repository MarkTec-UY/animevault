<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    recreateUserAnimeNotificationApiTables();
});

it('lists authenticated user notifications with unread filtering and unread counts', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    createNotificationApiAnimeRecord(100, 'Blue Box');

    DB::table('user_anime_notifications')->insert([
        [
            'user_id' => $user->id,
            'anime_id' => 100,
            'type' => 'episode_aired',
            'episode' => 18,
            'title' => 'New episode aired',
            'body' => 'Episode 18 of Blue Box aired.',
            'read_at' => null,
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ],
        [
            'user_id' => $user->id,
            'anime_id' => 100,
            'type' => 'episode_aired',
            'episode' => 17,
            'title' => 'New episode aired',
            'body' => 'Episode 17 of Blue Box aired.',
            'read_at' => now(),
            'created_at' => now()->subMinutes(2),
            'updated_at' => now(),
        ],
        [
            'user_id' => $otherUser->id,
            'anime_id' => 100,
            'type' => 'episode_aired',
            'episode' => 19,
            'title' => 'New episode aired',
            'body' => 'Episode 19 of Blue Box aired.',
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/me/notifications?unread_only=true');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.unread_count', 1)
        ->assertJsonPath('meta.unread_only', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.episode', 18)
        ->assertJsonPath('data.0.body', 'Episode 18 of Blue Box aired.')
        ->assertJsonPath('data.0.anime.preferred_title', 'Blue Box');
});

it('marks a single notification and then all remaining notifications as read', function () {
    $user = User::factory()->create();
    createNotificationApiAnimeRecord(100, 'My Dress-Up Darling Season 2');

    DB::table('user_anime_notifications')->insert([
        [
            'id' => 1,
            'user_id' => $user->id,
            'anime_id' => 100,
            'type' => 'episode_aired',
            'episode' => 1,
            'title' => 'New episode aired',
            'body' => 'Episode 1 of My Dress-Up Darling Season 2 aired.',
            'read_at' => null,
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ],
        [
            'id' => 2,
            'user_id' => $user->id,
            'anime_id' => 100,
            'type' => 'episode_aired',
            'episode' => 2,
            'title' => 'New episode aired',
            'body' => 'Episode 2 of My Dress-Up Darling Season 2 aired.',
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    Sanctum::actingAs($user);

    $readOneResponse = $this->postJson('/api/v1/me/notifications/1/read');

    $readOneResponse->assertOk()
        ->assertJsonPath('id', 1)
        ->assertJsonPath('episode', 1)
        ->assertJsonPath('body', 'Episode 1 of My Dress-Up Darling Season 2 aired.');

    expect(DB::table('user_anime_notifications')->where('id', 1)->value('read_at'))->not->toBeNull();

    $readAllResponse = $this->postJson('/api/v1/me/notifications/read-all');

    $readAllResponse->assertOk()
        ->assertJsonPath('updated', 1)
        ->assertJsonPath('unread_count', 0);

    expect(DB::table('user_anime_notifications')->whereNull('read_at')->count())->toBe(0);
});

it('does not allow reading another users notification', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    createNotificationApiAnimeRecord(100, 'Blue Box');

    DB::table('user_anime_notifications')->insert([
        'id' => 10,
        'user_id' => $otherUser->id,
        'anime_id' => 100,
        'type' => 'episode_aired',
        'episode' => 19,
        'title' => 'New episode aired',
        'body' => 'Episode 19 of Blue Box aired.',
        'read_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/me/notifications/10/read')
        ->assertNotFound();
});

function recreateUserAnimeNotificationApiTables(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('user_anime_notifications');
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
        $table->integer('next_airing_episode')->nullable();
        $table->timestamp('next_airing_at')->nullable();
        $table->text('cover_image_color')->nullable();
        $table->text('cover_image_large')->nullable();
        $table->text('banner_image')->nullable();
        $table->date('start_date')->nullable();
        $table->date('end_date')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
    });

    Schema::create('anime_title', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->string('title_type');
        $table->string('title');
    });

    Schema::create('user_anime_notifications', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('user_id');
        $table->integer('anime_id');
        $table->string('type');
        $table->integer('episode');
        $table->string('title');
        $table->text('body');
        $table->timestamp('read_at')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
        $table->unique(['user_id', 'anime_id', 'type', 'episode']);
    });

    Schema::enableForeignKeyConstraints();
}

function createNotificationApiAnimeRecord(int $id, string $title): void
{
    DB::table('anime')->insert([
        'id' => $id,
        'episodes' => 24,
        'cover_image_color' => '#101010',
        'cover_image_large' => "https://img.example.com/{$id}.jpg",
        'banner_image' => "https://img.example.com/banner-{$id}.jpg",
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('anime_title')->insert([
        'anime_id' => $id,
        'title_type' => 'english',
        'title' => $title,
    ]);
}

<?php

use App\Models\Anime;
use App\Models\User;
use App\Services\Anime\AnimeAiringNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    config(['anime.cache.store' => 'array']);
    recreateAnimeAiringNotificationTables();
    Cache::store(config('anime.cache.store'))->flush();
});

it('detects newly aired episodes from next airing state transitions', function () {
    $service = app(AnimeAiringNotificationService::class);
    $now = CarbonImmutable::parse('2026-03-26T12:00:00+00:00');

    expect($service->detectNewlyAiredEpisodes(
        previousNextEpisode: 19,
        previousNextAiringAt: $now->subHour()->toAtomString(),
        currentNextEpisode: 22,
        totalEpisodes: 26,
        now: $now,
    ))->toBe([19, 20, 21])
        ->and($service->detectNewlyAiredEpisodes(
            previousNextEpisode: 26,
            previousNextAiringAt: $now->subHour(),
            currentNextEpisode: null,
            totalEpisodes: 26,
            now: $now,
        ))->toBe([26])
        ->and($service->detectNewlyAiredEpisodes(
            previousNextEpisode: null,
            previousNextAiringAt: null,
            currentNextEpisode: 1,
            totalEpisodes: 12,
            now: $now,
        ))->toBe([]);
});

it('creates first episode notifications for planning users and watching users who are behind', function () {
    $planningUser = User::factory()->create();
    $watchingUser = User::factory()->create();
    $caughtUpUser = User::factory()->create();
    $pausedUser = User::factory()->create();
    $anime = createAnimeNotificationRecord(100, 'My Dress-Up Darling Season 2');

    DB::table('user_anime_library')->insert([
        [
            'user_id' => $planningUser->id,
            'anime_id' => 100,
            'status' => 'planning',
            'progress_episodes' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $watchingUser->id,
            'anime_id' => 100,
            'status' => 'watching',
            'progress_episodes' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $caughtUpUser->id,
            'anime_id' => 100,
            'status' => 'watching',
            'progress_episodes' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $pausedUser->id,
            'anime_id' => 100,
            'status' => 'paused',
            'progress_episodes' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    app(AnimeAiringNotificationService::class)->createEpisodeAiredNotifications($anime, [1]);

    $notifications = DB::table('user_anime_notifications')
        ->orderBy('user_id')
        ->get(['user_id', 'episode', 'body']);

    expect($notifications)->toHaveCount(2)
        ->and($notifications->pluck('user_id')->all())->toBe([$planningUser->id, $watchingUser->id])
        ->and($notifications->pluck('episode')->all())->toBe([1, 1])
        ->and($notifications->pluck('body')->unique()->values()->all())
        ->toBe(['Episode 1 of My Dress-Up Darling Season 2 aired.']);
});

it('deduplicates notifications and only alerts watching users who are behind the aired episode', function () {
    $behindUser = User::factory()->create();
    $caughtUpUser = User::factory()->create();
    $planningUser = User::factory()->create();
    $anime = createAnimeNotificationRecord(200, 'Blue Box');

    DB::table('user_anime_library')->insert([
        [
            'user_id' => $behindUser->id,
            'anime_id' => 200,
            'status' => 'watching',
            'progress_episodes' => 18,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $caughtUpUser->id,
            'anime_id' => 200,
            'status' => 'watching',
            'progress_episodes' => 19,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $planningUser->id,
            'anime_id' => 200,
            'status' => 'planning',
            'progress_episodes' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $service = app(AnimeAiringNotificationService::class);
    $service->createEpisodeAiredNotifications($anime, [19]);
    $service->createEpisodeAiredNotifications($anime, [19]);

    $notifications = DB::table('user_anime_notifications')->get(['user_id', 'episode', 'body']);

    expect($notifications)->toHaveCount(1)
        ->and((int) $notifications[0]->user_id)->toBe($behindUser->id)
        ->and((int) $notifications[0]->episode)->toBe(19)
        ->and($notifications[0]->body)->toBe('Episode 19 of Blue Box aired.');
});

it('uses each user preferred title language when generating aired episode notifications', function () {
    $romajiUser = User::factory()->create([
        'preferred_title_language' => 'romaji',
    ]);
    $nativeUser = User::factory()->create([
        'preferred_title_language' => 'native',
    ]);
    $anime = createAnimeNotificationRecord(300, 'Blue Box', [
        'romaji' => 'Ao no Hako',
        'native' => 'アオのハコ',
    ]);

    DB::table('user_anime_library')->insert([
        [
            'user_id' => $romajiUser->id,
            'anime_id' => 300,
            'status' => 'watching',
            'progress_episodes' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'user_id' => $nativeUser->id,
            'anime_id' => 300,
            'status' => 'watching',
            'progress_episodes' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    app(AnimeAiringNotificationService::class)->createEpisodeAiredNotifications($anime, [4]);

    $notifications = DB::table('user_anime_notifications')
        ->orderBy('user_id')
        ->pluck('body')
        ->all();

    expect($notifications)->toBe([
        'Episode 4 of Ao no Hako aired.',
        'Episode 4 of アオのハコ aired.',
    ]);
});

function recreateAnimeAiringNotificationTables(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('user_anime_notifications');
    Schema::dropIfExists('user_anime_library');
    Schema::dropIfExists('anime_title');
    Schema::dropIfExists('anime');
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table): void {
        $table->id();
        $table->string('username');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->string('role')->default('user');
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

/**
 * @param  array{romaji?:?string, native?:?string}  $titles
 */
function createAnimeNotificationRecord(int $id, string $title, array $titles = []): Anime
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

    DB::table('anime_title')->insert(
        collect([
            'english' => $title,
            'romaji' => $titles['romaji'] ?? null,
            'native' => $titles['native'] ?? null,
        ])
            ->filter(fn (?string $value): bool => filled($value))
            ->map(fn (string $value, string $type): array => [
                'anime_id' => $id,
                'title_type' => $type,
                'title' => $value,
            ])
            ->values()
            ->all(),
    );

    /** @var Anime $anime */
    $anime = Anime::query()->with('titles')->findOrFail($id);

    return $anime;
}

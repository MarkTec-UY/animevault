<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

function recreateAnimeCatalogTables(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('anime_trend');
    Schema::dropIfExists('anime_external_link');
    Schema::dropIfExists('external_link');
    Schema::dropIfExists('anime_company');
    Schema::dropIfExists('company');
    Schema::dropIfExists('personal_access_tokens');
    Schema::dropIfExists('users');
    Schema::dropIfExists('anime_tag');
    Schema::dropIfExists('tag');
    Schema::dropIfExists('anime_genre');
    Schema::dropIfExists('anime_title');
    Schema::dropIfExists('anime');
    Schema::dropIfExists('external_link_type');
    Schema::dropIfExists('genre');
    Schema::dropIfExists('media_source');
    Schema::dropIfExists('media_season');
    Schema::dropIfExists('media_status');
    Schema::dropIfExists('media_format');

    Schema::create('media_format', function (Blueprint $table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

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

    Schema::create('personal_access_tokens', function (Blueprint $table): void {
        $table->id();
        $table->morphs('tokenable');
        $table->text('name');
        $table->string('token', 64)->unique();
        $table->text('abilities')->nullable();
        $table->timestamp('last_used_at')->nullable();
        $table->timestamp('expires_at')->nullable()->index();
        $table->timestamps();
    });

    Schema::create('media_status', function (Blueprint $table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

    Schema::create('media_season', function (Blueprint $table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

    Schema::create('media_source', function (Blueprint $table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

    Schema::create('genre', function (Blueprint $table): void {
        $table->text('name');
        $table->primary('name');
    });

    Schema::create('external_link_type', function (Blueprint $table): void {
        $table->text('code');
        $table->text('description');
        $table->primary('code');
    });

    Schema::create('anime', function (Blueprint $table): void {
        $table->integer('id')->primary();
        $table->text('format_code')->nullable();
        $table->text('status_code')->nullable();
        $table->integer('episodes')->nullable();
        $table->integer('duration_minutes')->nullable();
        $table->text('season_code')->nullable();
        $table->integer('season_year')->nullable();
        $table->text('source_code')->nullable();
        $table->text('description')->nullable();
        $table->text('cover_image_color')->nullable();
        $table->text('cover_image_large')->nullable();
        $table->text('banner_image')->nullable();
        $table->integer('average_score')->nullable();
        $table->integer('popularity')->nullable();
        $table->boolean('is_adult')->default(false);
        $table->integer('favourites')->nullable();
        $table->date('start_date')->nullable();
        $table->date('end_date')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
    });

    Schema::create('anime_title', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->text('title_type');
        $table->text('title');
        $table->primary(['anime_id', 'title_type']);
    });

    Schema::create('anime_genre', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->text('genre_name');
        $table->primary(['anime_id', 'genre_name']);
    });

    Schema::create('tag', function (Blueprint $table): void {
        $table->integer('id')->primary();
        $table->text('name');
        $table->text('description')->nullable();
        $table->text('category')->nullable();
    });

    Schema::create('anime_tag', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->integer('tag_id');
        $table->integer('rank')->nullable();
        $table->primary(['anime_id', 'tag_id']);
    });

    Schema::create('company', function (Blueprint $table): void {
        $table->integer('id')->primary();
        $table->text('name');
    });

    Schema::create('anime_company', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->integer('company_id');
        $table->boolean('is_main')->default(false);
        $table->primary(['anime_id', 'company_id']);
    });

    Schema::create('external_link', function (Blueprint $table): void {
        $table->bigInteger('id')->primary();
        $table->text('site');
        $table->text('url');
        $table->text('type_code')->nullable();
        $table->text('language')->nullable();
        $table->text('color')->nullable();
        $table->text('icon')->nullable();
    });

    Schema::create('anime_external_link', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->unsignedBigInteger('external_link_id');
        $table->primary(['anime_id', 'external_link_id']);
    });

    Schema::create('anime_trend', function (Blueprint $table): void {
        $table->integer('anime_id');
        $table->date('trend_date');
        $table->integer('episode');
        $table->integer('trending')->nullable();
        $table->integer('average_score')->nullable();
        $table->integer('popularity')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->primary(['anime_id', 'trend_date', 'episode']);
    });

    Schema::enableForeignKeyConstraints();
}

function flushAnimeApiCache(): void
{
    Cache::store(config('anime.cache.store'))->flush();
}

function seedAnimeReferenceData(): void
{
    DB::table('media_format')->insert([
        ['code' => 'MOVIE', 'description' => 'Movie'],
        ['code' => 'OVA', 'description' => 'Original Video Animation'],
        ['code' => 'TV', 'description' => 'Television'],
    ]);

    DB::table('media_status')->insert([
        ['code' => 'FINISHED', 'description' => 'Finished'],
        ['code' => 'RELEASING', 'description' => 'Releasing'],
    ]);

    DB::table('media_season')->insert([
        ['code' => 'SPRING', 'description' => 'Spring'],
        ['code' => 'SUMMER', 'description' => 'Summer'],
        ['code' => 'FALL', 'description' => 'Fall'],
    ]);

    DB::table('media_source')->insert([
        ['code' => 'MANGA', 'description' => 'Manga'],
        ['code' => 'NOVEL', 'description' => 'Novel'],
        ['code' => 'ORIGINAL', 'description' => 'Original'],
    ]);

    DB::table('genre')->insert([
        ['name' => 'Action'],
        ['name' => 'Adventure'],
        ['name' => 'Drama'],
        ['name' => 'Fantasy'],
        ['name' => 'Psychological'],
        ['name' => 'Sci-Fi'],
    ]);

    DB::table('external_link_type')->insert([
        ['code' => 'INFO', 'description' => 'Information'],
        ['code' => 'STREAMING', 'description' => 'Streaming'],
    ]);
}

function seedAnimeCatalogFixtures(): void
{
    DB::table('anime')->insert([
        [
            'id' => 1,
            'format_code' => 'TV',
            'status_code' => 'FINISHED',
            'episodes' => 26,
            'duration_minutes' => 24,
            'season_code' => 'SPRING',
            'season_year' => 1998,
            'source_code' => 'ORIGINAL',
            'description' => 'Space bounty hunters traveling aboard the Bebop.',
            'cover_image_color' => '#0D223A',
            'cover_image_large' => 'https://cdn.example.com/cowboy-bebop-cover.jpg',
            'banner_image' => 'https://cdn.example.com/cowboy-bebop-banner.jpg',
            'average_score' => 89,
            'popularity' => 99999,
            'is_adult' => false,
            'favourites' => 25000,
            'start_date' => '1998-04-03',
            'end_date' => '1999-04-24',
            'created_at' => '2026-03-25 00:00:00',
            'updated_at' => '2026-03-25 00:00:00',
        ],
        [
            'id' => 2,
            'format_code' => 'TV',
            'status_code' => 'FINISHED',
            'episodes' => 28,
            'duration_minutes' => 24,
            'season_code' => 'FALL',
            'season_year' => 2023,
            'source_code' => 'MANGA',
            'description' => 'An elf mage reflects on friendship after the hero journey ends.',
            'cover_image_color' => '#B6D7B0',
            'cover_image_large' => 'https://cdn.example.com/frieren-cover.jpg',
            'banner_image' => 'https://cdn.example.com/frieren-banner.jpg',
            'average_score' => 92,
            'popularity' => 150000,
            'is_adult' => false,
            'favourites' => 48000,
            'start_date' => '2023-09-29',
            'end_date' => '2024-03-22',
            'created_at' => '2026-03-25 00:00:00',
            'updated_at' => '2026-03-24 00:00:00',
        ],
        [
            'id' => 3,
            'format_code' => 'MOVIE',
            'status_code' => 'FINISHED',
            'episodes' => 1,
            'duration_minutes' => 81,
            'season_code' => 'SUMMER',
            'season_year' => 1998,
            'source_code' => 'NOVEL',
            'description' => 'A pop idol faces a disturbing psychological descent.',
            'cover_image_color' => '#7F1D1D',
            'cover_image_large' => 'https://cdn.example.com/perfect-blue-cover.jpg',
            'banner_image' => 'https://cdn.example.com/perfect-blue-banner.jpg',
            'average_score' => 85,
            'popularity' => 40000,
            'is_adult' => true,
            'favourites' => 16000,
            'start_date' => '1998-02-28',
            'end_date' => '1998-02-28',
            'created_at' => '2026-03-25 00:00:00',
            'updated_at' => '2026-03-23 00:00:00',
        ],
    ]);

    DB::table('anime_title')->insert([
        ['anime_id' => 1, 'title_type' => 'romaji', 'title' => 'Cowboy Bebop'],
        ['anime_id' => 1, 'title_type' => 'english', 'title' => 'Cowboy Bebop'],
        ['anime_id' => 1, 'title_type' => 'native', 'title' => 'カウボーイビバップ'],
        ['anime_id' => 2, 'title_type' => 'romaji', 'title' => 'Sousou no Frieren'],
        ['anime_id' => 2, 'title_type' => 'english', 'title' => 'Frieren: Beyond Journey\'s End'],
        ['anime_id' => 2, 'title_type' => 'native', 'title' => '葬送のフリーレン'],
        ['anime_id' => 3, 'title_type' => 'romaji', 'title' => 'Perfect Blue'],
        ['anime_id' => 3, 'title_type' => 'english', 'title' => 'Perfect Blue'],
        ['anime_id' => 3, 'title_type' => 'native', 'title' => 'パーフェクトブルー'],
    ]);

    DB::table('anime_genre')->insert([
        ['anime_id' => 1, 'genre_name' => 'Action'],
        ['anime_id' => 1, 'genre_name' => 'Sci-Fi'],
        ['anime_id' => 2, 'genre_name' => 'Adventure'],
        ['anime_id' => 2, 'genre_name' => 'Drama'],
        ['anime_id' => 2, 'genre_name' => 'Fantasy'],
        ['anime_id' => 3, 'genre_name' => 'Drama'],
        ['anime_id' => 3, 'genre_name' => 'Psychological'],
    ]);

    DB::table('tag')->insert([
        ['id' => 10, 'name' => 'Space', 'description' => 'Stories set in outer space.', 'category' => 'Setting'],
        ['id' => 20, 'name' => 'Found Family', 'description' => 'Characters forming close bonds.', 'category' => 'Theme'],
        ['id' => 30, 'name' => 'Melancholy', 'description' => 'Emotionally reflective stories.', 'category' => 'Mood'],
    ]);

    DB::table('anime_tag')->insert([
        ['anime_id' => 1, 'tag_id' => 10, 'rank' => 90],
        ['anime_id' => 1, 'tag_id' => 20, 'rank' => 70],
        ['anime_id' => 2, 'tag_id' => 30, 'rank' => 88],
    ]);

    DB::table('company')->insert([
        ['id' => 100, 'name' => 'Sunrise'],
        ['id' => 200, 'name' => 'Bandai Visual'],
        ['id' => 300, 'name' => 'Madhouse'],
    ]);

    DB::table('anime_company')->insert([
        ['anime_id' => 1, 'company_id' => 100, 'is_main' => true],
        ['anime_id' => 1, 'company_id' => 200, 'is_main' => false],
        ['anime_id' => 2, 'company_id' => 300, 'is_main' => true],
        ['anime_id' => 3, 'company_id' => 300, 'is_main' => true],
    ]);

    DB::table('external_link')->insert([
        [
            'id' => 300,
            'site' => 'Crunchyroll',
            'url' => 'https://example.com/cowboy-bebop',
            'type_code' => 'STREAMING',
            'language' => 'en',
            'color' => '#F47521',
            'icon' => 'https://cdn.example.com/crunchyroll.png',
        ],
        [
            'id' => 301,
            'site' => 'AniList',
            'url' => 'https://anilist.co/anime/1',
            'type_code' => 'INFO',
            'language' => 'en',
            'color' => '#2B2D42',
            'icon' => 'https://cdn.example.com/anilist.png',
        ],
    ]);

    DB::table('anime_external_link')->insert([
        ['anime_id' => 1, 'external_link_id' => 300],
        ['anime_id' => 1, 'external_link_id' => 301],
    ]);

    DB::table('anime_trend')->insert([
        [
            'anime_id' => 1,
            'trend_date' => '1998-04-03',
            'episode' => 1,
            'trending' => 1200,
            'average_score' => 89,
            'popularity' => 99999,
            'created_at' => '2026-03-25 00:00:00',
        ],
        [
            'anime_id' => 1,
            'trend_date' => '1998-04-10',
            'episode' => 2,
            'trending' => 1180,
            'average_score' => 89,
            'popularity' => 99999,
            'created_at' => '2026-03-25 00:00:00',
        ],
    ]);
}

<?php

use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    recreateUserAnimeTablePrerequisites();
    runUserAnimeTablesMigration();
});

it('creates the user anime tracking and favorites tables', function () {
    expect(Schema::hasTable('user_anime_library'))->toBeTrue()
        ->and(Schema::hasTable('user_anime_favorite'))->toBeTrue();
});

it('stores a user anime library entry with status, score and progress', function () {
    DB::table('users')->insert([
        'id' => 1,
        'name' => 'Jose',
        'email' => 'jose@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('anime')->insert([
        'id' => 100,
        'format_code' => 'TV',
        'status_code' => 'RELEASING',
        'episodes' => 25,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('user_anime_library')->insert([
        'user_id' => 1,
        'anime_id' => 100,
        'status' => 'watching',
        'progress_episodes' => 18,
        'score' => 9,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    expect(DB::table('user_anime_library')->first())->not->toBeNull();
});

it('prevents duplicate library or favorite records for the same user and anime', function () {
    DB::table('users')->insert([
        'id' => 1,
        'name' => 'Jose',
        'email' => 'jose@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('anime')->insert([
        'id' => 100,
        'format_code' => 'TV',
        'status_code' => 'RELEASING',
        'episodes' => 25,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('user_anime_library')->insert([
        'user_id' => 1,
        'anime_id' => 100,
        'status' => 'planning',
        'progress_episodes' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    expect(fn () => DB::table('user_anime_library')->insert([
        'user_id' => 1,
        'anime_id' => 100,
        'status' => 'watching',
        'progress_episodes' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]))->toThrow(QueryException::class);

    DB::table('user_anime_favorite')->insert([
        'user_id' => 1,
        'anime_id' => 100,
        'created_at' => now(),
    ]);

    expect(fn () => DB::table('user_anime_favorite')->insert([
        'user_id' => 1,
        'anime_id' => 100,
        'created_at' => now(),
    ]))->toThrow(QueryException::class);
});

function recreateUserAnimeTablePrerequisites(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('user_anime_favorite');
    Schema::dropIfExists('user_anime_library');
    Schema::dropIfExists('anime');
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table): void {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('password');
        $table->text('about_me')->nullable();
        $table->string('avatar_path')->nullable();
        $table->string('banner_path')->nullable();
        $table->string('timezone')->default('UTC');
        $table->boolean('is_profile_public')->default(true);
        $table->string('preferred_title_language')->default('english');
        $table->string('preferred_scoring_system')->default('point_10');
        $table->timestamps();
    });

    Schema::create('anime', function (Blueprint $table): void {
        $table->integer('id')->primary();
        $table->string('format_code');
        $table->string('status_code');
        $table->integer('episodes')->nullable();
        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
    });

    Schema::enableForeignKeyConstraints();
}

function runUserAnimeTablesMigration(): void
{
    $migration = require database_path('migrations/2026_03_25_220000_create_user_anime_tables.php');

    $migration->up();
}

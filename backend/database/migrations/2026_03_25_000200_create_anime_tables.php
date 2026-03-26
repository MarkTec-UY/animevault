<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('anime', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('format_code');
            $table->text('status_code');
            $table->integer('episodes')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->text('season_code')->nullable();
            $table->integer('season_year')->nullable();
            $table->text('source_code')->nullable();
            $table->text('description')->nullable();
            $table->integer('average_score')->nullable();
            $table->integer('popularity')->nullable();
            $table->integer('favourites')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('format_code')->references('code')->on('media_format');
            $table->foreign('status_code')->references('code')->on('media_status');
            $table->foreign('season_code')->references('code')->on('media_season');
            $table->foreign('source_code')->references('code')->on('media_source');

            $table->index('status_code', 'idx_anime_status_code');
            $table->index('season_code', 'idx_anime_season_code');
            $table->index('source_code', 'idx_anime_source_code');
        });

        DB::statement(
            'ALTER TABLE anime ADD CONSTRAINT anime_episodes_nonnegative CHECK (episodes IS NULL OR episodes >= 0)'
        );
        DB::statement(
            'ALTER TABLE anime ADD CONSTRAINT anime_duration_nonnegative CHECK (duration_minutes IS NULL OR duration_minutes >= 0)'
        );
        DB::statement(
            'ALTER TABLE anime ADD CONSTRAINT anime_average_score_range CHECK (average_score IS NULL OR (average_score >= 0 AND average_score <= 100))'
        );
        DB::statement(
            'ALTER TABLE anime ADD CONSTRAINT anime_popularity_nonnegative CHECK (popularity IS NULL OR popularity >= 0)'
        );
        DB::statement(
            'ALTER TABLE anime ADD CONSTRAINT anime_favourites_nonnegative CHECK (favourites IS NULL OR favourites >= 0)'
        );

        Schema::create('anime_title', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->text('title_type');
            $table->text('title');

            $table->primary(['anime_id', 'title_type']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->index('title_type', 'idx_anime_title_type');
        });

        DB::statement(
            "ALTER TABLE anime_title ADD CONSTRAINT anime_title_title_type_check CHECK (title_type IN ('romaji', 'english', 'native'))"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anime_title');
        Schema::dropIfExists('anime');
    }
};

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
        Schema::create('anime_genre', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->text('genre_name');

            $table->primary(['anime_id', 'genre_name']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->foreign('genre_name')->references('name')->on('genre');
        });

        Schema::create('tag', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('name')->unique();
            $table->text('description')->nullable();
            $table->text('category')->nullable();
        });

        Schema::create('anime_tag', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->integer('tag_id');
            $table->integer('rank')->nullable();

            $table->primary(['anime_id', 'tag_id']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->foreign('tag_id')->references('id')->on('tag')->cascadeOnDelete();
        });

        DB::statement(
            'ALTER TABLE anime_tag ADD CONSTRAINT anime_tag_rank_range CHECK (rank IS NULL OR (rank >= 0 AND rank <= 100))'
        );
        DB::statement('CREATE INDEX idx_anime_tag_rank ON anime_tag (rank DESC)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anime_tag');
        Schema::dropIfExists('tag');
        Schema::dropIfExists('anime_genre');
    }
};

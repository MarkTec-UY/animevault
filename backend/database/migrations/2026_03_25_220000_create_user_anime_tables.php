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
        Schema::create('user_anime_library', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('anime_id');
            $table->enum('status', ['watching', 'completed', 'paused', 'dropped', 'planning']);
            $table->integer('progress_episodes')->default(0);
            $table->integer('score')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->unique(['user_id', 'anime_id'], 'uq_user_anime_library_user_anime');
            $table->index(['user_id', 'status'], 'idx_user_anime_library_user_status');
            $table->index(['anime_id', 'status'], 'idx_user_anime_library_anime_status');
        });

        Schema::create('user_anime_favorite', function (Blueprint $table): void {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('anime_id');
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['user_id', 'anime_id']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->index('anime_id', 'idx_user_anime_favorite_anime');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE user_anime_library ADD CONSTRAINT user_anime_library_progress_nonnegative CHECK (progress_episodes >= 0)'
            );
            DB::statement(
                'ALTER TABLE user_anime_library ADD CONSTRAINT user_anime_library_score_range CHECK (score IS NULL OR (score >= 1 AND score <= 10))'
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_anime_favorite');
        Schema::dropIfExists('user_anime_library');
    }
};

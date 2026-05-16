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
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE SCHEMA IF NOT EXISTS schema_core');
        }

        Schema::create('media_type', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('media_relation', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('schema_core.media', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('type_code');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('type_code')->references('code')->on('media_type');

            $table->index('type_code', 'idx_schema_core_media_type_code');
        });

        Schema::create('anime_relation', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->integer('related_media_id');
            $table->text('relation_type_code');
            $table->integer('sort_order')->default(1);
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['anime_id', 'related_media_id', 'relation_type_code']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->foreign('related_media_id')->references('id')->on('schema_core.media')->cascadeOnDelete();
            $table->foreign('relation_type_code')->references('code')->on('media_relation');

            $table->index('related_media_id', 'idx_anime_relation_related_media_id');
            $table->index('relation_type_code', 'idx_anime_relation_relation_type_code');
            $table->index(['anime_id', 'sort_order'], 'idx_anime_relation_anime_sort_order');
        });

        Schema::create('anime_trailer', function (Blueprint $table) {
            $table->integer('anime_id')->primary();
            $table->text('trailer_id');
            $table->text('site');
            $table->text('thumbnail_url')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->index('site', 'idx_anime_trailer_site');
        });

        DB::statement(
            'ALTER TABLE anime_relation ADD CONSTRAINT anime_relation_sort_order_positive CHECK (sort_order > 0)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anime_trailer');
        Schema::dropIfExists('anime_relation');
        Schema::dropIfExists('schema_core.media');
        Schema::dropIfExists('media_relation');
        Schema::dropIfExists('media_type');

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP SCHEMA IF EXISTS schema_core');
        }
    }
};

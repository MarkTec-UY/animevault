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

        Schema::create('media_reference', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('type_code');
            $table->text('format_code')->nullable();
            $table->text('status_code')->nullable();
            $table->text('title_romaji')->nullable();
            $table->text('title_english')->nullable();
            $table->text('title_native')->nullable();
            $table->text('cover_image_color')->nullable();
            $table->text('cover_image_large')->nullable();
            $table->text('banner_image')->nullable();
            $table->boolean('is_adult')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('type_code')->references('code')->on('media_type');
            $table->foreign('format_code')->references('code')->on('media_format');
            $table->foreign('status_code')->references('code')->on('media_status');

            $table->index('type_code', 'idx_media_reference_type_code');
            $table->index('format_code', 'idx_media_reference_format_code');
            $table->index('status_code', 'idx_media_reference_status_code');
        });

        Schema::create('anime_relation', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->integer('related_media_id');
            $table->text('relation_type_code');
            $table->integer('sort_order')->default(1);
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['anime_id', 'related_media_id', 'relation_type_code']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->foreign('related_media_id')->references('id')->on('media_reference')->cascadeOnDelete();
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
        Schema::dropIfExists('media_reference');
        Schema::dropIfExists('media_relation');
        Schema::dropIfExists('media_type');
    }
};

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
        DB::statement('CREATE SCHEMA IF NOT EXISTS schema_manga');
        DB::statement('CREATE SCHEMA IF NOT EXISTS schema_staff');
        DB::statement('CREATE SCHEMA IF NOT EXISTS schema_characters');

        Schema::create('schema_characters.character_role', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('schema_staff.staff', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('given_name')->nullable();
            $table->text('middle_name')->nullable();
            $table->text('family_name')->nullable();
            $table->text('full_name')->nullable();
            $table->text('native_name')->nullable();
            $table->text('user_preferred_name')->nullable();
            $table->text('language')->nullable();
            $table->text('image_large')->nullable();
            $table->text('image_medium')->nullable();
            $table->text('description')->nullable();
            $table->text('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->date('date_of_death')->nullable();
            $table->integer('age_years')->nullable();
            $table->integer('years_active_start')->nullable();
            $table->integer('years_active_end')->nullable();
            $table->text('home_town')->nullable();
            $table->text('blood_type')->nullable();
            $table->text('site_url')->nullable();
            $table->integer('favourites')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index('language', 'idx_schema_staff_staff_language');
        });

        Schema::create('schema_staff.staff_name_alias', function (Blueprint $table) {
            $table->integer('staff_id');
            $table->text('alias');
            $table->integer('sort_order')->default(1);

            $table->primary(['staff_id', 'alias']);
            $table->foreign('staff_id')->references('id')->on('schema_staff.staff')->cascadeOnDelete();
        });

        Schema::create('schema_staff.staff_primary_occupation', function (Blueprint $table) {
            $table->integer('staff_id');
            $table->text('occupation');
            $table->integer('sort_order')->default(1);

            $table->primary(['staff_id', 'occupation']);
            $table->foreign('staff_id')->references('id')->on('schema_staff.staff')->cascadeOnDelete();
        });

        Schema::create('schema_characters.character', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('full_name')->nullable();
            $table->text('native_name')->nullable();
            $table->text('user_preferred_name')->nullable();
            $table->text('image_large')->nullable();
            $table->text('image_medium')->nullable();
            $table->text('description')->nullable();
            $table->text('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('age_text')->nullable();
            $table->text('blood_type')->nullable();
            $table->text('site_url')->nullable();
            $table->integer('favourites')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });

        Schema::create('schema_characters.character_name_alias', function (Blueprint $table) {
            $table->integer('character_id');
            $table->text('alias');
            $table->boolean('is_spoiler')->default(false);
            $table->integer('sort_order')->default(1);

            $table->primary(['character_id', 'alias']);
            $table->foreign('character_id')->references('id')->on('schema_characters.character')->cascadeOnDelete();
        });

        Schema::create('schema_manga.manga', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->integer('id_mal')->nullable();
            $table->text('format_code');
            $table->text('status_code');
            $table->integer('chapters')->nullable();
            $table->integer('volumes')->nullable();
            $table->char('country_of_origin', 2)->nullable();
            $table->boolean('is_licensed')->nullable();
            $table->text('source_code')->nullable();
            $table->text('description')->nullable();
            $table->text('hashtag')->nullable();
            $table->integer('average_score')->nullable();
            $table->integer('mean_score')->nullable();
            $table->integer('popularity')->nullable();
            $table->integer('favourites')->nullable();
            $table->boolean('is_adult')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestampTz('anilist_updated_at')->nullable();
            $table->text('site_url')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('id')->references('id')->on('media_reference')->cascadeOnDelete();
            $table->foreign('format_code')->references('code')->on('media_format');
            $table->foreign('status_code')->references('code')->on('media_status');
            $table->foreign('source_code')->references('code')->on('media_source');

            $table->index('status_code', 'idx_schema_manga_manga_status_code');
            $table->index('format_code', 'idx_schema_manga_manga_format_code');
            $table->index('source_code', 'idx_schema_manga_manga_source_code');
        });

        Schema::create('schema_manga.manga_relation', function (Blueprint $table) {
            $table->integer('manga_id');
            $table->integer('related_media_id');
            $table->text('relation_type_code');
            $table->integer('sort_order')->default(1);
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['manga_id', 'related_media_id', 'relation_type_code']);
            $table->foreign('manga_id')->references('id')->on('schema_manga.manga')->cascadeOnDelete();
            $table->foreign('related_media_id')->references('id')->on('media_reference')->cascadeOnDelete();
            $table->foreign('relation_type_code')->references('code')->on('media_relation');
        });

        Schema::create('schema_manga.manga_trailer', function (Blueprint $table) {
            $table->integer('manga_id')->primary();
            $table->text('trailer_id');
            $table->text('site');
            $table->text('thumbnail_url')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('manga_id')->references('id')->on('schema_manga.manga')->cascadeOnDelete();
            $table->index('site', 'idx_schema_manga_manga_trailer_site');
        });

        Schema::create('schema_manga.manga_genre', function (Blueprint $table) {
            $table->integer('manga_id');
            $table->text('genre_name');

            $table->primary(['manga_id', 'genre_name']);
            $table->foreign('manga_id')->references('id')->on('schema_manga.manga')->cascadeOnDelete();
            $table->foreign('genre_name')->references('name')->on('genre');
        });

        Schema::create('schema_manga.manga_tag', function (Blueprint $table) {
            $table->integer('manga_id');
            $table->integer('tag_id');
            $table->integer('rank')->nullable();

            $table->primary(['manga_id', 'tag_id']);
            $table->foreign('manga_id')->references('id')->on('schema_manga.manga')->cascadeOnDelete();
            $table->foreign('tag_id')->references('id')->on('tag')->cascadeOnDelete();
        });

        Schema::create('schema_manga.manga_external_link', function (Blueprint $table) {
            $table->integer('manga_id');
            $table->unsignedBigInteger('external_link_id');

            $table->primary(['manga_id', 'external_link_id']);
            $table->foreign('manga_id')->references('id')->on('schema_manga.manga')->cascadeOnDelete();
            $table->foreign('external_link_id')->references('id')->on('external_link')->cascadeOnDelete();
        });

        Schema::create('schema_staff.media_staff', function (Blueprint $table) {
            $table->integer('media_id');
            $table->integer('staff_id');
            $table->text('role_name');
            $table->integer('sort_order')->default(1);
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['media_id', 'staff_id', 'role_name']);
            $table->foreign('media_id')->references('id')->on('media_reference')->cascadeOnDelete();
            $table->foreign('staff_id')->references('id')->on('schema_staff.staff')->cascadeOnDelete();

            $table->index('staff_id', 'idx_schema_staff_media_staff_staff_id');
        });

        Schema::create('schema_characters.media_character', function (Blueprint $table) {
            $table->integer('media_id');
            $table->integer('character_id');
            $table->text('role_code')->nullable();
            $table->text('character_name_override')->nullable();
            $table->integer('sort_order')->default(1);
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['media_id', 'character_id']);
            $table->foreign('media_id')->references('id')->on('media_reference')->cascadeOnDelete();
            $table->foreign('character_id')->references('id')->on('schema_characters.character')->cascadeOnDelete();
            $table->foreign('role_code')->references('code')->on('schema_characters.character_role');

            $table->index('character_id', 'idx_schema_characters_media_character_character_id');
            $table->index('role_code', 'idx_schema_characters_media_character_role_code');
        });

        Schema::create('schema_characters.media_character_voice_actor', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->integer('media_id');
            $table->integer('character_id');
            $table->integer('staff_id');
            $table->integer('sort_order')->default(1);
            $table->text('role_notes')->nullable();
            $table->text('dub_group')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['media_id', 'character_id'])
                ->references(['media_id', 'character_id'])
                ->on('schema_characters.media_character')
                ->cascadeOnDelete();
            $table->foreign('staff_id')->references('id')->on('schema_staff.staff')->cascadeOnDelete();

            $table->index(['media_id', 'character_id'], 'idx_schema_characters_voice_actor_media_character');
            $table->index('staff_id', 'idx_schema_characters_voice_actor_staff_id');
        });

        DB::statement(
            'ALTER TABLE schema_staff.staff ADD CONSTRAINT schema_staff_staff_age_nonnegative CHECK (age_years IS NULL OR age_years >= 0)'
        );
        DB::statement(
            'ALTER TABLE schema_manga.manga ADD CONSTRAINT schema_manga_manga_chapters_nonnegative CHECK (chapters IS NULL OR chapters >= 0)'
        );
        DB::statement(
            'ALTER TABLE schema_manga.manga ADD CONSTRAINT schema_manga_manga_volumes_nonnegative CHECK (volumes IS NULL OR volumes >= 0)'
        );
        DB::statement(
            'ALTER TABLE schema_manga.manga ADD CONSTRAINT schema_manga_manga_average_score_range CHECK (average_score IS NULL OR (average_score >= 0 AND average_score <= 100))'
        );
        DB::statement(
            'ALTER TABLE schema_manga.manga ADD CONSTRAINT schema_manga_manga_mean_score_range CHECK (mean_score IS NULL OR (mean_score >= 0 AND mean_score <= 100))'
        );
        DB::statement(
            'ALTER TABLE schema_manga.manga_relation ADD CONSTRAINT schema_manga_manga_relation_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_staff.media_staff ADD CONSTRAINT schema_staff_media_staff_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_characters.media_character ADD CONSTRAINT schema_characters_media_character_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_characters.media_character_voice_actor ADD CONSTRAINT schema_characters_media_character_voice_actor_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_staff.staff_name_alias ADD CONSTRAINT schema_staff_staff_name_alias_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_staff.staff_primary_occupation ADD CONSTRAINT schema_staff_staff_primary_occupation_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_characters.character_name_alias ADD CONSTRAINT schema_characters_character_name_alias_sort_order_positive CHECK (sort_order > 0)'
        );
        DB::statement(
            'ALTER TABLE schema_manga.manga_tag ADD CONSTRAINT schema_manga_manga_tag_rank_range CHECK (rank IS NULL OR (rank >= 0 AND rank <= 100))'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_characters.media_character_voice_actor');
        Schema::dropIfExists('schema_characters.media_character');
        Schema::dropIfExists('schema_staff.media_staff');
        Schema::dropIfExists('schema_manga.manga_external_link');
        Schema::dropIfExists('schema_manga.manga_tag');
        Schema::dropIfExists('schema_manga.manga_genre');
        Schema::dropIfExists('schema_manga.manga_trailer');
        Schema::dropIfExists('schema_manga.manga_relation');
        Schema::dropIfExists('schema_manga.manga');
        Schema::dropIfExists('schema_characters.character_name_alias');
        Schema::dropIfExists('schema_characters.character');
        Schema::dropIfExists('schema_staff.staff_primary_occupation');
        Schema::dropIfExists('schema_staff.staff_name_alias');
        Schema::dropIfExists('schema_staff.staff');
        Schema::dropIfExists('schema_characters.character_role');

        DB::statement('DROP SCHEMA IF EXISTS schema_characters');
        DB::statement('DROP SCHEMA IF EXISTS schema_staff');
        DB::statement('DROP SCHEMA IF EXISTS schema_manga');
    }
};

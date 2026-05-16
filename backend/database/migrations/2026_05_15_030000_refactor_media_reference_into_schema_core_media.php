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
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE SCHEMA IF NOT EXISTS schema_core');

        $this->moveLegacyMediaTableIntoSchemaCore();
        $this->ensureCoreMediaTable();
        $this->ensureMangaTitleTable();
        $this->ensureMediaTypes();
        $this->backfillCoreMediaRows();
        $this->backfillMangaTitlesFromLegacySnapshot();
        $this->dropLegacySnapshotColumns();
        $this->ensureAnimeMediaForeignKey();
        $this->createMediaCatalogView();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP VIEW IF EXISTS schema_core.media_catalog');
        DB::statement('ALTER TABLE IF EXISTS schema_anime.anime DROP CONSTRAINT IF EXISTS anime_id_foreign');
    }

    private function moveLegacyMediaTableIntoSchemaCore(): void
    {
        if ($this->tableExists('schema_core', 'media')) {
            return;
        }

        if ($this->tableExists('schema_anime', 'media_reference')) {
            DB::statement('ALTER TABLE schema_anime.media_reference SET SCHEMA schema_core');
        } elseif ($this->tableExists('public', 'media_reference')) {
            DB::statement('ALTER TABLE public.media_reference SET SCHEMA schema_core');
        } elseif ($this->tableExists('schema_anime', 'media')) {
            DB::statement('ALTER TABLE schema_anime.media SET SCHEMA schema_core');
        }

        if ($this->tableExists('schema_core', 'media_reference') && ! $this->tableExists('schema_core', 'media')) {
            DB::statement('ALTER TABLE schema_core.media_reference RENAME TO media');
        }
    }

    private function ensureCoreMediaTable(): void
    {
        if ($this->tableExists('schema_core', 'media')) {
            return;
        }

        Schema::create('schema_core.media', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('type_code');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('type_code')->references('code')->on('media_type');
            $table->index('type_code', 'idx_schema_core_media_type_code');
        });
    }

    private function ensureMangaTitleTable(): void
    {
        if ($this->tableExists('schema_manga', 'manga_title')) {
            return;
        }

        Schema::create('schema_manga.manga_title', function (Blueprint $table) {
            $table->integer('manga_id');
            $table->text('title_type');
            $table->text('title');

            $table->primary(['manga_id', 'title_type']);
            $table->foreign('manga_id')->references('id')->on('schema_manga.manga')->cascadeOnDelete();
            $table->index('title_type', 'idx_schema_manga_manga_title_type');
        });

        DB::statement(
            "ALTER TABLE schema_manga.manga_title ADD CONSTRAINT schema_manga_manga_title_type_check CHECK (title_type IN ('romaji', 'english', 'native'))"
        );
    }

    private function ensureMediaTypes(): void
    {
        DB::table('media_type')->updateOrInsert(
            ['code' => 'ANIME'],
            ['description' => 'Anime'],
        );

        DB::table('media_type')->updateOrInsert(
            ['code' => 'MANGA'],
            ['description' => 'Manga'],
        );
    }

    private function backfillCoreMediaRows(): void
    {
        DB::statement(<<<'SQL'
            INSERT INTO schema_core.media (id, type_code, created_at, updated_at)
            SELECT anime.id, 'ANIME', COALESCE(anime.created_at, NOW()), COALESCE(anime.updated_at, NOW())
            FROM schema_anime.anime AS anime
            ON CONFLICT (id) DO UPDATE
            SET type_code = EXCLUDED.type_code,
                updated_at = EXCLUDED.updated_at
        SQL);

        DB::statement(<<<'SQL'
            INSERT INTO schema_core.media (id, type_code, created_at, updated_at)
            SELECT manga.id, 'MANGA', COALESCE(manga.created_at, NOW()), COALESCE(manga.updated_at, NOW())
            FROM schema_manga.manga AS manga
            ON CONFLICT (id) DO UPDATE
            SET type_code = EXCLUDED.type_code,
                updated_at = EXCLUDED.updated_at
        SQL);
    }

    private function backfillMangaTitlesFromLegacySnapshot(): void
    {
        if (! $this->columnExists('schema_core', 'media', 'title_romaji')) {
            return;
        }

        foreach (['romaji' => 'title_romaji', 'english' => 'title_english', 'native' => 'title_native'] as $type => $column) {
            DB::statement(sprintf(
                <<<'SQL'
                INSERT INTO schema_manga.manga_title (manga_id, title_type, title)
                SELECT manga.id, '%s', media.%s
                FROM schema_manga.manga AS manga
                INNER JOIN schema_core.media AS media ON media.id = manga.id
                WHERE media.%s IS NOT NULL
                ON CONFLICT (manga_id, title_type) DO UPDATE
                SET title = EXCLUDED.title
                SQL,
                $type,
                $column,
                $column,
            ));
        }
    }

    private function dropLegacySnapshotColumns(): void
    {
        DB::statement('ALTER TABLE schema_core.media DROP CONSTRAINT IF EXISTS media_reference_format_code_foreign');
        DB::statement('ALTER TABLE schema_core.media DROP CONSTRAINT IF EXISTS media_reference_status_code_foreign');
        DB::statement('DROP INDEX IF EXISTS schema_core.idx_media_reference_format_code');
        DB::statement('DROP INDEX IF EXISTS schema_core.idx_media_reference_status_code');
        DB::statement('DROP INDEX IF EXISTS schema_core.idx_media_reference_type_code');

        foreach ([
            'format_code',
            'status_code',
            'title_romaji',
            'title_english',
            'title_native',
            'cover_image_color',
            'cover_image_large',
            'banner_image',
            'is_adult',
            'start_date',
            'end_date',
        ] as $column) {
            if ($this->columnExists('schema_core', 'media', $column)) {
                DB::statement(sprintf('ALTER TABLE schema_core.media DROP COLUMN %s', $column));
            }
        }

        DB::statement('CREATE INDEX IF NOT EXISTS idx_schema_core_media_type_code ON schema_core.media (type_code)');
    }

    private function ensureAnimeMediaForeignKey(): void
    {
        DB::statement('ALTER TABLE schema_anime.anime DROP CONSTRAINT IF EXISTS anime_id_foreign');
        DB::statement(
            'ALTER TABLE schema_anime.anime ADD CONSTRAINT anime_id_foreign FOREIGN KEY (id) REFERENCES schema_core.media (id) ON DELETE CASCADE'
        );
    }

    private function createMediaCatalogView(): void
    {
        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW schema_core.media_catalog AS
            SELECT
                media.id,
                media.type_code,
                COALESCE(anime.format_code, manga.format_code) AS format_code,
                COALESCE(anime.status_code, manga.status_code) AS status_code,
                COALESCE(anime_title_romaji.title, manga_title_romaji.title) AS title_romaji,
                COALESCE(anime_title_english.title, manga_title_english.title) AS title_english,
                COALESCE(anime_title_native.title, manga_title_native.title) AS title_native,
                COALESCE(anime.cover_image_color, manga.cover_image_color) AS cover_image_color,
                COALESCE(anime.cover_image_large, manga.cover_image_large) AS cover_image_large,
                COALESCE(anime.banner_image, manga.banner_image) AS banner_image,
                COALESCE(anime.is_adult, manga.is_adult, false) AS is_adult,
                COALESCE(anime.start_date, manga.start_date) AS start_date,
                COALESCE(anime.end_date, manga.end_date) AS end_date,
                media.created_at,
                media.updated_at
            FROM schema_core.media AS media
            LEFT JOIN schema_anime.anime AS anime
                ON anime.id = media.id
               AND media.type_code = 'ANIME'
            LEFT JOIN schema_anime.anime_title AS anime_title_romaji
                ON anime_title_romaji.anime_id = anime.id
               AND anime_title_romaji.title_type = 'romaji'
            LEFT JOIN schema_anime.anime_title AS anime_title_english
                ON anime_title_english.anime_id = anime.id
               AND anime_title_english.title_type = 'english'
            LEFT JOIN schema_anime.anime_title AS anime_title_native
                ON anime_title_native.anime_id = anime.id
               AND anime_title_native.title_type = 'native'
            LEFT JOIN schema_manga.manga AS manga
                ON manga.id = media.id
               AND media.type_code = 'MANGA'
            LEFT JOIN schema_manga.manga_title AS manga_title_romaji
                ON manga_title_romaji.manga_id = manga.id
               AND manga_title_romaji.title_type = 'romaji'
            LEFT JOIN schema_manga.manga_title AS manga_title_english
                ON manga_title_english.manga_id = manga.id
               AND manga_title_english.title_type = 'english'
            LEFT JOIN schema_manga.manga_title AS manga_title_native
                ON manga_title_native.manga_id = manga.id
               AND manga_title_native.title_type = 'native'
        SQL);
    }

    private function tableExists(string $schema, string $table): bool
    {
        $result = DB::selectOne(
            <<<'SQL'
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = ?
                  AND table_name = ?
            ) AS exists
            SQL,
            [$schema, $table],
        );

        return (bool) ($result->exists ?? false);
    }

    private function columnExists(string $schema, string $table, string $column): bool
    {
        $result = DB::selectOne(
            <<<'SQL'
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = ?
                  AND table_name = ?
                  AND column_name = ?
            ) AS exists
            SQL,
            [$schema, $table, $column],
        );

        return (bool) ($result->exists ?? false);
    }
};

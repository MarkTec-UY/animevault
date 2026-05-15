<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

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

        DB::statement('CREATE SCHEMA IF NOT EXISTS schema_anime');
        DB::statement('CREATE SCHEMA IF NOT EXISTS schema_user');

        foreach ($this->animeTables() as $table) {
            $this->moveTableIfNeeded($table, 'public', 'schema_anime');
        }

        foreach ($this->userTables() as $table) {
            $this->moveTableIfNeeded($table, 'public', 'schema_user');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (array_reverse($this->userTables()) as $table) {
            $this->moveTableIfNeeded($table, 'schema_user', 'public');
        }

        foreach (array_reverse($this->animeTables()) as $table) {
            $this->moveTableIfNeeded($table, 'schema_anime', 'public');
        }

        DB::statement('DROP SCHEMA IF EXISTS schema_user');
        DB::statement('DROP SCHEMA IF EXISTS schema_anime');
    }

    /**
     * @return list<string>
     */
    private function animeTables(): array
    {
        return [
            'media_format',
            'media_status',
            'media_season',
            'media_source',
            'external_link_type',
            'genre',
            'anime',
            'anime_title',
            'anime_genre',
            'tag',
            'anime_tag',
            'company',
            'anime_company',
            'external_link',
            'anime_external_link',
            'anime_trend',
            'media_type',
            'media_relation',
            'media_reference',
            'anime_relation',
            'anime_trailer',
        ];
    }

    /**
     * @return list<string>
     */
    private function userTables(): array
    {
        return [
            'users',
            'password_reset_tokens',
            'sessions',
            'personal_access_tokens',
            'user_anime_library',
            'user_anime_favorite',
            'user_anime_notifications',
        ];
    }

    private function moveTableIfNeeded(string $table, string $fromSchema, string $toSchema): void
    {
        if (! $this->tableExists($fromSchema, $table) || $this->tableExists($toSchema, $table)) {
            return;
        }

        DB::statement(sprintf(
            'ALTER TABLE "%s"."%s" SET SCHEMA "%s"',
            $fromSchema,
            $table,
            $toSchema,
        ));
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
};

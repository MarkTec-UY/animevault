<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $table = $this->resolveAnimeTable();

        if ($table === null) {
            return;
        }

        Schema::table($table, function (Blueprint $table): void {
            $table->unsignedInteger('current_trending_rank')->nullable()->after('favourites');
            $table->unsignedInteger('current_trending_score')->nullable()->after('current_trending_rank');
            $table->timestampTz('current_trending_fetched_at')->nullable()->after('current_trending_score');
            $table->index('current_trending_rank', 'idx_anime_current_trending_rank');
            $table->index('current_trending_fetched_at', 'idx_anime_current_trending_fetched_at');
        });
    }

    public function down(): void
    {
        $table = $this->resolveAnimeTable();

        if ($table === null) {
            return;
        }

        Schema::table($table, function (Blueprint $table): void {
            $table->dropIndex('idx_anime_current_trending_rank');
            $table->dropIndex('idx_anime_current_trending_fetched_at');
            $table->dropColumn([
                'current_trending_rank',
                'current_trending_score',
                'current_trending_fetched_at',
            ]);
        });
    }

    private function resolveAnimeTable(): ?string
    {
        if (Schema::hasTable('schema_anime.anime')) {
            return 'schema_anime.anime';
        }

        if (Schema::hasTable('anime')) {
            return 'anime';
        }

        if (DB::getDriverName() === 'pgsql' && $this->postgresTableExists('schema_anime', 'anime')) {
            return 'schema_anime.anime';
        }

        return null;
    }

    private function postgresTableExists(string $schema, string $table): bool
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

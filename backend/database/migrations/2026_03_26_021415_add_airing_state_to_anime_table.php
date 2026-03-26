<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('anime', function (Blueprint $table): void {
            $table->integer('next_airing_episode')->nullable()->after('episodes');
            $table->timestampTz('next_airing_at')->nullable()->after('next_airing_episode');
            $table->index('next_airing_at', 'idx_anime_next_airing_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('anime', function (Blueprint $table): void {
            $table->dropIndex('idx_anime_next_airing_at');
            $table->dropColumn(['next_airing_episode', 'next_airing_at']);
        });
    }
};

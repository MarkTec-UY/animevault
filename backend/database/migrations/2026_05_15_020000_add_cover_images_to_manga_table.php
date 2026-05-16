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
        Schema::table('schema_manga.manga', function (Blueprint $table): void {
            $table->text('cover_image_color')->nullable()->after('description');
            $table->text('cover_image_large')->nullable()->after('cover_image_color');
            $table->text('banner_image')->nullable()->after('cover_image_large');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_manga.manga', function (Blueprint $table): void {
            $table->dropColumn([
                'cover_image_color',
                'cover_image_large',
                'banner_image',
            ]);
        });
    }
};

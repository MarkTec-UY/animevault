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
        Schema::table('anime', function (Blueprint $table) {
            $table->text('cover_image_color')->nullable()->after('description');
            $table->text('cover_image_large')->nullable()->after('cover_image_color');
            $table->text('banner_image')->nullable()->after('cover_image_large');
            $table->boolean('is_adult')->default(false)->after('popularity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('anime', function (Blueprint $table) {
            $table->dropColumn([
                'cover_image_color',
                'cover_image_large',
                'banner_image',
                'is_adult',
            ]);
        });
    }
};

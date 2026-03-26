<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->text('about_me')->nullable()->after('password');
            $table->string('avatar_path')->nullable()->after('about_me');
            $table->string('banner_path')->nullable()->after('avatar_path');
            $table->string('timezone')->default('UTC')->after('banner_path');
            $table->boolean('is_profile_public')->default(true)->after('timezone');
            $table->string('preferred_title_language')->default('english')->after('is_profile_public');
            $table->string('preferred_scoring_system')->default('point_10')->after('preferred_title_language');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'about_me',
                'avatar_path',
                'banner_path',
                'timezone',
                'is_profile_public',
                'preferred_title_language',
                'preferred_scoring_system',
            ]);
        });
    }
};

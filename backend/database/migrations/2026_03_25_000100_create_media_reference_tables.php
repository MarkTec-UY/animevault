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
        Schema::create('media_format', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('media_status', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('media_season', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('media_source', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('external_link_type', function (Blueprint $table) {
            $table->text('code');
            $table->text('description');

            $table->primary('code');
        });

        Schema::create('genre', function (Blueprint $table) {
            $table->text('name');

            $table->primary('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('genre');
        Schema::dropIfExists('external_link_type');
        Schema::dropIfExists('media_source');
        Schema::dropIfExists('media_season');
        Schema::dropIfExists('media_status');
        Schema::dropIfExists('media_format');
    }
};

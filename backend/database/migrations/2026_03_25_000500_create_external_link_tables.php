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
        Schema::create('external_link', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->text('site');
            $table->text('url');
            $table->text('type_code')->nullable();
            $table->text('language')->nullable();
            $table->text('color')->nullable();
            $table->text('icon')->nullable();

            $table->foreign('type_code')->references('code')->on('external_link_type');
            $table->unique(['site', 'url']);
            $table->index('type_code', 'idx_external_link_type');
        });

        Schema::create('anime_external_link', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->unsignedBigInteger('external_link_id');

            $table->primary(['anime_id', 'external_link_id']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->foreign('external_link_id')->references('id')->on('external_link')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anime_external_link');
        Schema::dropIfExists('external_link');
    }
};

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
        Schema::create('anime_trend', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->date('trend_date');
            $table->integer('episode');
            $table->integer('trending')->nullable();
            $table->integer('average_score')->nullable();
            $table->integer('popularity')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['anime_id', 'trend_date', 'episode']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anime_trend');
    }
};

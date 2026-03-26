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
        Schema::create('company', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->text('name')->unique();
        });

        Schema::create('anime_company', function (Blueprint $table) {
            $table->integer('anime_id');
            $table->integer('company_id');
            $table->boolean('is_main')->default(false);

            $table->primary(['anime_id', 'company_id']);
            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('company')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anime_company');
        Schema::dropIfExists('company');
    }
};

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
        Schema::create('schema_user.user_anime_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('schema_user.users')->cascadeOnDelete();
            $table->integer('anime_id');
            $table->string('type');
            $table->integer('episode');
            $table->string('title');
            $table->text('body');
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('anime_id')->references('id')->on('anime')->cascadeOnDelete();
            $table->unique(
                ['user_id', 'anime_id', 'type', 'episode'],
                'uq_user_anime_notifications_user_anime_type_episode'
            );
            $table->index(
                ['user_id', 'read_at', 'created_at'],
                'idx_user_anime_notifications_user_read_created'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_user.user_anime_notifications');
    }
};

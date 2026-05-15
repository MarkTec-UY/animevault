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
        if (! Schema::hasColumn('schema_user.users', 'name') || Schema::hasColumn('schema_user.users', 'username')) {
            return;
        }

        Schema::table('schema_user.users', function (Blueprint $table) {
            $table->renameColumn('name', 'username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('schema_user.users', 'username') || Schema::hasColumn('schema_user.users', 'name')) {
            return;
        }

        Schema::table('schema_user.users', function (Blueprint $table) {
            $table->renameColumn('username', 'name');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // telephone devient identifiant principal : requis et unique
            $table->string('telephone', 30)->nullable(false)->unique()->change();
            // email devient facultatif (auto-généré depuis le téléphone)
            $table->string('email', 255)->nullable()->change();
        });

        Schema::table('organisations', function (Blueprint $table) {
            $table->string('email_contact', 255)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('telephone', 20)->nullable()->change();
            $table->string('email', 255)->nullable(false)->change();
        });

        Schema::table('organisations', function (Blueprint $table) {
            $table->string('email_contact', 255)->nullable(false)->change();
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remplir les téléphones NULL en PHP (compatible SQLite + MySQL).
        // On génère un numéro temporaire unique dérivé de l'id.
        DB::table('users')
            ->whereNull('telephone')
            ->orWhere('telephone', '')
            ->orderBy('id')
            ->each(function ($user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['telephone' => '00000' . str_pad($user->id, 5, '0', STR_PAD_LEFT)]);
            });

        // Supprimer l'index unique existant s'il existe (évite les doublons lors du change())
        if (Schema::hasIndex('users', 'users_telephone_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_telephone_unique');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('telephone', 30)->nullable(false)->unique()->change();
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

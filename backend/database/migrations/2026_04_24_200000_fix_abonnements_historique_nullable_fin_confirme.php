<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('abonnements_historique', function (Blueprint $table) {
            $table->date('date_fin')->nullable()->change();
            $table->date('date_debut')->nullable()->change();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE abonnements_historique MODIFY COLUMN statut ENUM('en_attente','paye','echoue','rembourse','confirme') NOT NULL DEFAULT 'en_attente'");
        }
    }

    public function down(): void
    {
        Schema::table('abonnements_historique', function (Blueprint $table) {
            $table->date('date_fin')->nullable(false)->change();
            $table->date('date_debut')->nullable(false)->change();
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE abonnements_historique MODIFY COLUMN statut ENUM('en_attente','paye','echoue','rembourse') NOT NULL");
        }
    }
};

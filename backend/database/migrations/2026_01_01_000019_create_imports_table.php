<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('type', 50);
            $table->string('fichier_url', 500);
            $table->string('fichier_nom', 255);
            $table->enum('statut', ['en_attente', 'en_cours', 'termine', 'erreur'])->default('en_attente');
            $table->unsignedInteger('lignes_total')->default(0);
            $table->unsignedInteger('lignes_importees')->default(0);
            $table->unsignedInteger('lignes_erreur')->default(0);
            $table->json('erreurs_detail')->nullable();
            $table->timestamps();

            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imports');
    }
};

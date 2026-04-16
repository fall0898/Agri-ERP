<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('employe_id')->constrained('employes')->cascadeOnDelete();
            $table->foreignId('champ_id')->nullable()->constrained('champs')->nullOnDelete();
            $table->foreignId('culture_id')->nullable()->constrained('cultures')->nullOnDelete();
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['a_faire', 'en_cours', 'termine', 'annule'])->default('a_faire');
            $table->enum('priorite', ['basse', 'normale', 'haute', 'urgente'])->default('normale');
            $table->timestamps();

            $table->index('organisation_id');
            $table->index('employe_id');
            $table->index(['organisation_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taches');
    }
};

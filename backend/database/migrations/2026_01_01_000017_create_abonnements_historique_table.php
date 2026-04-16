<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abonnements_historique', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('plan_precedent', 20);
            $table->string('plan_nouveau', 20);
            $table->decimal('montant_fcfa', 12, 2)->nullable();
            $table->string('processeur_paiement', 30)->nullable();
            $table->string('reference_paiement', 200)->nullable();
            $table->enum('statut', ['en_attente', 'paye', 'echoue', 'rembourse']);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->timestamps();

            $table->index('organisation_id');
            $table->index('reference_paiement');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements_historique');
    }
};

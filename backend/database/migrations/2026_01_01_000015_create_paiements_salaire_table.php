<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements_salaire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('employe_id')->constrained('employes')->cascadeOnDelete();
            $table->decimal('montant_fcfa', 12, 2);
            $table->string('mois', 7);
            $table->date('date_paiement');
            $table->enum('mode_paiement', ['especes', 'mobile_money', 'virement', 'autre'])->default('especes');
            $table->text('notes')->nullable();
            $table->foreignId('depense_id')->nullable()->constrained('depenses')->nullOnDelete();
            $table->timestamps();

            $table->index('organisation_id');
            $table->index('employe_id');
            $table->index(['organisation_id', 'mois']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_salaire');
    }
};

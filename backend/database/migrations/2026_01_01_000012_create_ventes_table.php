<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('champ_id')->nullable()->constrained('champs')->nullOnDelete();
            $table->foreignId('culture_id')->nullable()->constrained('cultures')->nullOnDelete();
            $table->foreignId('campagne_id')->nullable()->constrained('campagnes_agricoles')->nullOnDelete();
            $table->string('acheteur', 200)->nullable();
            $table->string('produit', 200);
            $table->decimal('quantite_kg', 12, 2);
            $table->decimal('prix_unitaire_fcfa', 12, 2);
            $table->decimal('montant_total_fcfa', 14, 2);
            $table->date('date_vente');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('organisation_id');
            $table->index('champ_id');
            $table->index('campagne_id');
            $table->index(['organisation_id', 'date_vente']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventes');
    }
};

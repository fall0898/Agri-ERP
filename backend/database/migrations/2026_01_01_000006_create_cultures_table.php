<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cultures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('champ_id')->constrained('champs')->cascadeOnDelete();
            $table->foreignId('campagne_id')->nullable()->constrained('campagnes_agricoles')->nullOnDelete();
            $table->string('nom', 150);
            $table->string('variete', 100)->nullable();
            $table->enum('saison', ['normale', 'contre_saison']);
            $table->year('annee');
            $table->date('date_semis')->nullable();
            $table->date('date_recolte_prevue')->nullable();
            $table->date('date_recolte_effective')->nullable();
            $table->decimal('superficie_cultivee_ha', 10, 4)->nullable();
            $table->decimal('quantite_recoltee_kg', 12, 2)->nullable();
            $table->enum('statut', ['en_cours', 'recolte', 'termine', 'abandonne'])->default('en_cours');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('organisation_id');
            $table->index('champ_id');
            $table->index('campagne_id');
            $table->index(['organisation_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cultures');
    }
};

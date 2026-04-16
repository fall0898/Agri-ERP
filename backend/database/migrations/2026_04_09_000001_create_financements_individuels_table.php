<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financements_individuels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('employe_id')->constrained('employes')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('montant_fcfa', 12, 2);
            $table->string('motif');
            $table->date('date_financement');
            $table->string('mode_paiement')->default('especes'); // especes, virement, orange_money, wave
            $table->string('statut')->default('en_attente');     // en_attente, rembourse
            $table->decimal('montant_rembourse_fcfa', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('depense_id')->nullable()->constrained('depenses')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('remboursements_financement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('financement_id')->constrained('financements_individuels')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('montant_fcfa', 12, 2);
            $table->date('date_remboursement');
            $table->string('mode_paiement')->default('especes');
            $table->foreignId('vente_id')->nullable()->constrained('ventes')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remboursements_financement');
        Schema::dropIfExists('financements_individuels');
    }
};

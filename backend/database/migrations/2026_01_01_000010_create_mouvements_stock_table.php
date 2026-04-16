<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained('stocks')->cascadeOnDelete();
            $table->enum('type', ['achat', 'utilisation', 'perte', 'ajustement']);
            $table->decimal('quantite', 12, 2);
            $table->decimal('prix_unitaire_fcfa', 12, 2)->nullable();
            $table->decimal('montant_total_fcfa', 12, 2)->nullable();
            $table->string('fournisseur', 200)->nullable();
            $table->foreignId('depense_id')->nullable()->constrained('depenses')->nullOnDelete();
            $table->foreignId('culture_id')->nullable()->constrained('cultures')->nullOnDelete();
            $table->string('motif', 300)->nullable();
            $table->date('date_mouvement');
            $table->timestamps();

            $table->index('stock_id');
            $table->index('depense_id');
            $table->index('culture_id');
            $table->index(['stock_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock');
    }
};

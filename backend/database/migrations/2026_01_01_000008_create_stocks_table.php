<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('intrant_id')->nullable()->constrained('intrants')->nullOnDelete();
            $table->string('nom', 200);
            $table->string('categorie', 100);
            $table->decimal('quantite_actuelle', 12, 2)->default(0);
            $table->string('unite', 20);
            $table->decimal('seuil_alerte', 12, 2)->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            $table->index('organisation_id');
            $table->index(['organisation_id', 'est_actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};

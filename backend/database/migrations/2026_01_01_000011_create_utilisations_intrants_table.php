<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisations_intrants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('culture_id')->constrained('cultures')->cascadeOnDelete();
            $table->foreignId('intrant_id')->nullable()->constrained('intrants')->nullOnDelete();
            $table->foreignId('stock_id')->nullable()->constrained('stocks')->nullOnDelete();
            $table->string('nom_intrant', 200);
            $table->decimal('quantite', 10, 2);
            $table->string('unite', 20);
            $table->decimal('cout_total_fcfa', 12, 2)->nullable();
            $table->date('date_utilisation');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('organisation_id');
            $table->index('culture_id');
            $table->index('stock_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisations_intrants');
    }
};

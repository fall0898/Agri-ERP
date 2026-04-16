<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campagnes_agricoles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 100);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->boolean('est_courante')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('organisation_id');
            $table->index('est_courante');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campagnes_agricoles');
    }
};

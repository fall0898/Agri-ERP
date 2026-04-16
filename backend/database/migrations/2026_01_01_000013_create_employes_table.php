<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('nom', 100);
            $table->string('telephone', 20)->nullable();
            $table->string('poste', 100)->nullable();
            $table->date('date_embauche')->nullable();
            $table->decimal('salaire_mensuel_fcfa', 12, 2)->nullable();
            $table->boolean('est_actif')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employes');
    }
};

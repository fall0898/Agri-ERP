<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('culture_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type_culture', ['oignon','tomate','riz','courgette','piment','patate']);
            $table->string('image_url', 500);
            $table->text('description_symptomes')->nullable();
            $table->string('maladie_detectee', 200)->nullable();
            $table->enum('niveau_confiance', ['faible','moyen','élevé'])->nullable();
            $table->json('symptomes')->nullable();
            $table->json('traitement_immediat')->nullable();
            $table->json('produits_senegal')->nullable();
            $table->json('prevention')->nullable();
            $table->text('conseil')->nullable();
            $table->text('reponse_ia_brute')->nullable();
            $table->timestamps();

            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostics');
    }
};

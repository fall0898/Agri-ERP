<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organisations', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 200);
            $table->string('slug', 100)->unique();
            $table->string('email_contact', 255);
            $table->string('telephone', 20)->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->string('devise', 5)->default('FCFA');
            $table->enum('plan', ['gratuit', 'pro', 'entreprise'])->default('gratuit');
            $table->timestamp('plan_expire_at')->nullable();
            $table->timestamp('periode_essai_fin')->nullable();
            $table->boolean('est_active')->default(true);
            $table->boolean('est_suspendue')->default(false);
            $table->tinyInteger('campagne_debut_mois')->default(10);
            $table->tinyInteger('campagne_debut_jour')->default(1);
            $table->json('parametres')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organisations');
    }
};

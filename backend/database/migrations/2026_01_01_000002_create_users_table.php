<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->nullable()->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 100);
            $table->string('email', 255)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('password', 255);
            $table->enum('role', ['super_admin', 'admin', 'lecteur'])->default('lecteur');
            $table->boolean('est_actif')->default(true);
            $table->json('preferences_notification')->nullable();
            $table->timestamp('derniere_connexion_at')->nullable();
            $table->boolean('onboarding_complete')->default(false);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index('organisation_id');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

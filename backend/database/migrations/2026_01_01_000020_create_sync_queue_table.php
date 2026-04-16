<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('model_type', 100);
            $table->string('action', 20);
            $table->json('payload');
            $table->uuid('sync_id')->unique();
            $table->enum('statut', ['en_attente', 'traite', 'conflit', 'erreur'])->default('en_attente');
            $table->timestamp('traite_at')->nullable();
            $table->timestamps();

            $table->index('organisation_id');
            $table->index(['organisation_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_queue');
    }
};

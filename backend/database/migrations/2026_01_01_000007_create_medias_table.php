<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('culture_id')->constrained('cultures')->cascadeOnDelete();
            $table->enum('type', ['photo', 'video']);
            $table->string('fichier_url', 500);
            $table->string('fichier_nom', 255);
            $table->unsignedBigInteger('taille_octets')->nullable();
            $table->string('description', 300)->nullable();
            $table->date('date_prise')->nullable();
            $table->timestamps();

            $table->index('culture_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medias');
    }
};

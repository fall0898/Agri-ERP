<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories_depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('slug');
            $table->timestamps();
            $table->unique(['organisation_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories_depenses');
    }
};

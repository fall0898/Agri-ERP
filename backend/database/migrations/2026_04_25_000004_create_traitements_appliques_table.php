<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('traitements_appliques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('culture_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('produit');
            $table->string('matiere_active')->nullable();
            $table->string('dose')->nullable();
            $table->date('date_application');
            $table->enum('source', ['whatsapp', 'manuel'])->default('whatsapp');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('traitements_appliques');
    }
};

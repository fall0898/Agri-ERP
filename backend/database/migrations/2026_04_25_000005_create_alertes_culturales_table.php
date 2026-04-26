<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('alertes_culturales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('culture_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->text('message');
            $table->timestamp('sent_at');
            $table->unique(['culture_id', 'type']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('alertes_culturales');
    }
};

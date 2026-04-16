<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('titre', 200);
            $table->text('message');
            $table->enum('canal', ['app', 'email', 'sms', 'whatsapp', 'push']);
            $table->string('action_url', 300)->nullable();
            $table->boolean('est_lue')->default(false);
            $table->timestamp('lue_at')->nullable();
            $table->timestamp('envoyee_at')->nullable();
            $table->timestamps();

            $table->index('organisation_id');
            $table->index('user_id');
            $table->index(['user_id', 'est_lue']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

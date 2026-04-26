<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('whatsapp_users', function (Blueprint $table) {
            $table->enum('langue', ['fr', 'wo'])->default('fr')->after('est_actif');
            $table->enum('systeme_arrosage', ['aspersion', 'goutte_a_goutte', 'gravitaire'])->nullable()->after('langue');
            $table->timestamp('onboarded_at')->nullable()->after('systeme_arrosage');
        });
    }
    public function down(): void {
        Schema::table('whatsapp_users', function (Blueprint $table) {
            $table->dropColumn(['langue', 'systeme_arrosage', 'onboarded_at']);
        });
    }
};

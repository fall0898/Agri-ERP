<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('alertes_whatsapp_actives')->default(true)->after('role');
        });
        Schema::table('champs', function (Blueprint $table) {
            // latitude and longitude already exist from the initial champs migration
            $table->enum('zone_meteo', [
                'dakar_niayes','thies','louga','saint_louis',
                'podor','dagana','kaolack','ziguinchor','tambacounda'
            ])->nullable()->after('localisation');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('alertes_whatsapp_actives');
        });
        Schema::table('champs', function (Blueprint $table) {
            $table->dropColumn('zone_meteo');
        });
    }
};

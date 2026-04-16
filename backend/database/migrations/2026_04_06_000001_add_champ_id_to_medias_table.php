<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medias', function (Blueprint $table) {
            $table->foreignId('champ_id')->nullable()->after('id')->constrained('champs')->nullOnDelete();
            $table->foreignId('culture_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('medias', function (Blueprint $table) {
            $table->dropForeign(['champ_id']);
            $table->dropColumn('champ_id');
            $table->foreignId('culture_id')->nullable(false)->change();
        });
    }
};

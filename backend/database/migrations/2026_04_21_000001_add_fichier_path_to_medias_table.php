<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medias', function (Blueprint $table) {
            $table->string('fichier_path', 500)->nullable()->after('fichier_url');
        });
    }

    public function down(): void
    {
        Schema::table('medias', function (Blueprint $table) {
            $table->dropColumn('fichier_path');
        });
    }
};

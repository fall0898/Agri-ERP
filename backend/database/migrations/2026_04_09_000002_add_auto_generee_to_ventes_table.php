<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->boolean('est_auto_generee')->default(false)->after('notes');
            $table->string('source_type')->nullable()->after('est_auto_generee');
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
        });
    }

    public function down(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->dropColumn(['est_auto_generee', 'source_type', 'source_id']);
        });
    }
};

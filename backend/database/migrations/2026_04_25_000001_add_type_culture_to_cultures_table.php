<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('cultures', function (Blueprint $table) {
            $table->enum('type_culture', ['oignon','tomate','riz','courgette','piment','patate','autre'])
                  ->nullable()
                  ->after('nom');
        });
    }
    public function down(): void {
        Schema::table('cultures', function (Blueprint $table) {
            $table->dropColumn('type_culture');
        });
    }
};

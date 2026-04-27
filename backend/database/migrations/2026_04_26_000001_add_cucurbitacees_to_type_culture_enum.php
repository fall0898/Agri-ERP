<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // SQLite does not enforce ENUM and does not support MODIFY COLUMN
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE cultures MODIFY COLUMN type_culture ENUM('oignon','tomate','riz','courgette','piment','patate','pasteque','melon','concombre','fraisier','autre') NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE cultures MODIFY COLUMN type_culture ENUM('oignon','tomate','riz','courgette','piment','patate','autre') NULL");
    }
};

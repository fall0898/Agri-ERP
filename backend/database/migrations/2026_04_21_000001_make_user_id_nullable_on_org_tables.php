<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Allow user_id to be NULL so we can delete users without losing org data
        Schema::table('champs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        Schema::table('stocks', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        Schema::table('depenses', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        Schema::table('ventes', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        Schema::table('employes', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        Schema::table('imports', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Note: reversing nullable is only safe if no NULLs exist
        Schema::table('champs',   fn(Blueprint $t) => $t->foreignId('user_id')->nullable(false)->change());
        Schema::table('stocks',   fn(Blueprint $t) => $t->foreignId('user_id')->nullable(false)->change());
        Schema::table('depenses', fn(Blueprint $t) => $t->foreignId('user_id')->nullable(false)->change());
        Schema::table('ventes',   fn(Blueprint $t) => $t->foreignId('user_id')->nullable(false)->change());
        Schema::table('employes', fn(Blueprint $t) => $t->foreignId('user_id')->nullable(false)->change());
        Schema::table('imports',  fn(Blueprint $t) => $t->foreignId('user_id')->nullable(false)->change());
    }
};

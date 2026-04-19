<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetTenantData extends Command
{
    protected $signature = 'tenant:reset {org_id : ID de l\'organisation à vider}';
    protected $description = 'Supprime toutes les données d\'une organisation (sauf les comptes utilisateurs)';

    public function handle(): int
    {
        $orgId = (int) $this->argument('org_id');

        $org = DB::table('organisations')->where('id', $orgId)->first();
        if (!$org) {
            $this->error("Organisation {$orgId} introuvable.");
            return 1;
        }

        if (!$this->confirm("⚠️  Supprimer TOUTES les données de \"{$org->nom}\" (org #{$orgId}) ? Les comptes utilisateurs sont conservés.")) {
            $this->info('Annulé.');
            return 0;
        }

        $this->info("Suppression des données de \"{$org->nom}\"...");

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'remboursements_financement',
            'financements_individuels',
            'utilisations_intrants',
            'paiements_salaire',
            'mouvements_stock',
            'audit_logs',
            'sync_queue',
            'diagnostics',
            'medias',
            'notifications',
            'imports',
            'taches',
            'stocks',
            'employes',
            'ventes',
            'depenses',
            'cultures',
            'champs',
            'intrants',
            'campagnes_agricoles',
        ];

        foreach ($tables as $table) {
            $count = DB::table($table)->where('organisation_id', $orgId)->count();
            DB::table($table)->where('organisation_id', $orgId)->delete();
            $this->line("  ✓ {$table} : {$count} ligne(s) supprimée(s)");
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->newLine();
        $this->info("✅ Données de \"{$org->nom}\" supprimées avec succès.");
        $this->info("   Les comptes utilisateurs sont intacts.");

        return 0;
    }
}

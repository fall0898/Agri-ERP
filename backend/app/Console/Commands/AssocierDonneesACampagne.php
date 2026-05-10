<?php

namespace App\Console\Commands;

use App\Models\CampagneAgricole;
use App\Models\Organisation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AssocierDonneesACampagne extends Command
{
    protected $signature   = 'campagne:associer-donnees {--dry-run : Afficher les changements sans les appliquer}';
    protected $description = 'Associe les dépenses, ventes et cultures sans campagne_id à la campagne active de chaque organisation';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('Mode dry-run — aucune modification ne sera appliquée.');
        }

        $organisations = Organisation::all();

        if ($organisations->isEmpty()) {
            $this->error('Aucune organisation trouvée.');
            return 1;
        }

        foreach ($organisations as $org) {
            $campagne = CampagneAgricole::where('organisation_id', $org->id)
                ->where('est_courante', true)
                ->first();

            if (! $campagne) {
                $this->line("  <fg=yellow>⚠</> {$org->nom} — pas de campagne active, ignoré.");
                continue;
            }

            $counts = [
                'depenses' => DB::table('depenses')
                    ->where('organisation_id', $org->id)
                    ->whereNull('campagne_id')
                    ->count(),
                'ventes'   => DB::table('ventes')
                    ->where('organisation_id', $org->id)
                    ->whereNull('campagne_id')
                    ->count(),
                'cultures' => DB::table('cultures')
                    ->where('organisation_id', $org->id)
                    ->whereNull('campagne_id')
                    ->count(),
            ];

            $total = array_sum($counts);

            if ($total === 0) {
                $this->line("  <fg=green>✓</> {$org->nom} — aucune donnée à migrer.");
                continue;
            }

            $this->info("  {$org->nom} → campagne \"{$campagne->nom}\" (id={$campagne->id})");
            $this->line("    dépenses : {$counts['depenses']} | ventes : {$counts['ventes']} | cultures : {$counts['cultures']}");

            if (! $dryRun) {
                DB::table('depenses')
                    ->where('organisation_id', $org->id)
                    ->whereNull('campagne_id')
                    ->update(['campagne_id' => $campagne->id]);

                DB::table('ventes')
                    ->where('organisation_id', $org->id)
                    ->whereNull('campagne_id')
                    ->update(['campagne_id' => $campagne->id]);

                DB::table('cultures')
                    ->where('organisation_id', $org->id)
                    ->whereNull('campagne_id')
                    ->update(['campagne_id' => $campagne->id]);

                $this->line("    <fg=green>✓ Migré.</>");
            }
        }

        if (! $dryRun) {
            $this->newLine();
            $this->info('Migration terminée.');
        }

        return 0;
    }
}

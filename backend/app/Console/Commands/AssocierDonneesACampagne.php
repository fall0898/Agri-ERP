<?php

namespace App\Console\Commands;

use App\Models\CampagneAgricole;
use App\Models\Organisation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AssocierDonneesACampagne extends Command
{
    protected $signature   = 'campagne:associer-donnees {--dry-run : Afficher les changements sans les appliquer} {--tous : Réassigner toutes les données, même celles déjà liées à une autre campagne}';
    protected $description = 'Associe les dépenses, ventes et cultures à la campagne active de chaque organisation';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $tous   = $this->option('tous');

        if ($dryRun) {
            $this->warn('Mode dry-run — aucune modification ne sera appliquée.');
        }
        if ($tous) {
            $this->warn('Mode --tous : toutes les données seront réassignées à la campagne active.');
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

            $query = fn(string $table) => DB::table($table)->where('organisation_id', $org->id);
            $filter = fn($q) => $tous ? $q : $q->whereNull('campagne_id');

            $counts = [
                'depenses' => $filter($query('depenses'))->count(),
                'ventes'   => $filter($query('ventes'))->count(),
                'cultures' => $filter($query('cultures'))->count(),
            ];

            $total = array_sum($counts);

            if ($total === 0) {
                $this->line("  <fg=green>✓</> {$org->nom} — aucune donnée à migrer.");
                continue;
            }

            $this->info("  {$org->nom} → campagne \"{$campagne->nom}\" (id={$campagne->id})");
            $this->line("    dépenses : {$counts['depenses']} | ventes : {$counts['ventes']} | cultures : {$counts['cultures']}");

            if (! $dryRun) {
                foreach (['depenses', 'ventes', 'cultures'] as $table) {
                    $filter($query($table))->update(['campagne_id' => $campagne->id]);
                }
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

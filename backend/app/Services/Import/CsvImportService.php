<?php

namespace App\Services\Import;

use App\Models\Champ;
use App\Models\Culture;
use App\Models\Depense;
use App\Models\Stock;
use App\Models\Vente;

class CsvImportService
{
    /**
     * Process a CSV file and import rows of the given type.
     *
     * @return array{imported: int, errors: string[]}
     */
    public function process(string $filePath, string $type, int $orgId, int $userId): array
    {
        $handle = fopen($filePath, 'r');

        // Skip UTF-8 BOM if present
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
            rewind($handle);
        }

        $header = fgetcsv($handle, 0, ';');
        if (! $header) {
            fclose($handle);
            return ['imported' => 0, 'errors' => ['Fichier CSV vide ou invalide.']];
        }

        $header   = array_map('trim', $header);
        $imported = 0;
        $errors   = [];
        $line     = 1;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            $line++;
            if (count($row) < 2) continue;

            $data = array_combine($header, array_pad(array_map('trim', $row), count($header), ''));

            try {
                match ($type) {
                    'champs'   => $this->importChamp($data, $orgId, $userId),
                    'cultures' => $this->importCulture($data, $orgId),
                    'stocks'   => $this->importStock($data, $orgId),
                    'depenses' => $this->importDepense($data, $orgId, $userId),
                    'ventes'   => $this->importVente($data, $orgId, $userId),
                };
                $imported++;
            } catch (\Throwable $e) {
                $errors[] = "Ligne {$line} : " . $e->getMessage();
            }
        }

        fclose($handle);

        return compact('imported', 'errors');
    }

    private function importChamp(array $d, int $orgId, int $userId): void
    {
        if (empty($d['nom'])) throw new \Exception('Le nom est requis.');
        $superficie = is_numeric($d['superficie_ha'] ?? '') ? (float) $d['superficie_ha'] : 0;

        Champ::create([
            'organisation_id' => $orgId,
            'user_id'         => $userId,
            'nom'             => $d['nom'],
            'superficie_ha'   => $superficie,
            'localisation'    => $d['localisation'] ?: null,
            'description'     => $d['description'] ?: null,
            'est_actif'       => true,
        ]);
    }

    private function importCulture(array $d, int $orgId): void
    {
        if (empty($d['nom'])) throw new \Exception('Le nom est requis.');

        $champId = null;
        if (! empty($d['champ_nom'])) {
            $champ = Champ::where('organisation_id', $orgId)->where('nom', $d['champ_nom'])->first();
            if (! $champ) throw new \Exception("Champ \"{$d['champ_nom']}\" introuvable.");
            $champId = $champ->id;
        }

        $saison = in_array($d['saison'] ?? '', ['normale', 'contre_saison']) ? $d['saison'] : 'normale';
        $annee  = is_numeric($d['annee'] ?? '') ? (int) $d['annee'] : now()->year;

        Culture::create([
            'organisation_id'        => $orgId,
            'champ_id'               => $champId,
            'nom'                    => $d['nom'],
            'saison'                 => $saison,
            'annee'                  => $annee,
            'date_semis'             => $this->parseDate($d['date_semis'] ?? ''),
            'date_recolte_prevue'    => $this->parseDate($d['date_recolte_prevue'] ?? ''),
            'superficie_cultivee_ha' => is_numeric($d['superficie_cultivee_ha'] ?? '') ? (float) $d['superficie_cultivee_ha'] : null,
            'variete'                => $d['variete'] ?: null,
            'notes'                  => $d['notes'] ?: null,
            'statut'                 => 'en_cours',
        ]);
    }

    private function importStock(array $d, int $orgId): void
    {
        if (empty($d['nom'])) throw new \Exception('Le nom est requis.');
        if (empty($d['unite'])) throw new \Exception("L'unité est requise.");

        Stock::create([
            'organisation_id'   => $orgId,
            'nom'               => $d['nom'],
            'categorie'         => $d['categorie'] ?: 'autre',
            'quantite_actuelle' => is_numeric($d['quantite_actuelle'] ?? '') ? (float) $d['quantite_actuelle'] : 0,
            'unite'             => $d['unite'],
            'seuil_alerte'      => is_numeric($d['seuil_alerte'] ?? '') ? (float) $d['seuil_alerte'] : null,
            'est_actif'         => true,
        ]);
    }

    private function importDepense(array $d, int $orgId, int $userId): void
    {
        if (empty($d['description'])) throw new \Exception('La description est requise.');
        if (! is_numeric($d['montant_fcfa'] ?? '')) throw new \Exception('montant_fcfa invalide.');

        $champId = null;
        if (! empty($d['champ_nom'])) {
            $champ = Champ::where('organisation_id', $orgId)->where('nom', $d['champ_nom'])->first();
            if ($champ) $champId = $champ->id;
        }

        Depense::create([
            'organisation_id'  => $orgId,
            'user_id'          => $userId,
            'champ_id'         => $champId,
            'description'      => $d['description'],
            'categorie'        => $d['categorie'] ?: 'autre',
            'montant_fcfa'     => (float) $d['montant_fcfa'],
            'date_depense'     => $this->parseDate($d['date_depense'] ?? '') ?? now()->toDateString(),
            'est_auto_generee' => false,
        ]);
    }

    private function importVente(array $d, int $orgId, int $userId): void
    {
        if (empty($d['produit'])) throw new \Exception('Le produit est requis.');
        if (! is_numeric($d['quantite_kg'] ?? '')) throw new \Exception('quantite_kg invalide.');
        if (! is_numeric($d['prix_unitaire_fcfa'] ?? '')) throw new \Exception('prix_unitaire_fcfa invalide.');

        $champId = null;
        if (! empty($d['champ_nom'])) {
            $champ = Champ::where('organisation_id', $orgId)->where('nom', $d['champ_nom'])->first();
            if ($champ) $champId = $champ->id;
        }

        $qte  = (float) $d['quantite_kg'];
        $prix = (float) $d['prix_unitaire_fcfa'];

        Vente::create([
            'organisation_id'    => $orgId,
            'user_id'            => $userId,
            'champ_id'           => $champId,
            'produit'            => $d['produit'],
            'acheteur'           => $d['acheteur'] ?: null,
            'quantite_kg'        => $qte,
            'prix_unitaire_fcfa' => $prix,
            'montant_total_fcfa' => $qte * $prix,
            'date_vente'         => $this->parseDate($d['date_vente'] ?? '') ?? now()->toDateString(),
        ]);
    }

    private function parseDate(string $value): ?string
    {
        if (empty($value)) return null;
        try {
            return \Carbon\Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}

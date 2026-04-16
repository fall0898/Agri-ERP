<?php

namespace Database\Seeders;

use App\Models\Champ;
use App\Models\Depense;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Dépenses historiques campagne 2025/26 — Exploitation Kadiar
 * Seeder idempotent : ne s'exécute qu'une seule fois (vérifie si les dépenses existent déjà)
 */
class DepensesHistoriques2025Seeder extends Seeder
{
    public function run(): void
    {
        $organisation = Organisation::where('slug', 'kadiar-demo')->first();
        if (!$organisation) {
            $this->command->error('Organisation kadiar-demo introuvable.');
            return;
        }

        // Éviter la double insertion
        if (Depense::where('organisation_id', $organisation->id)->where('description', 'LIKE', '%[hist2025]%')->exists()) {
            $this->command->info('Dépenses historiques 2025/26 déjà insérées, ignoré.');
            return;
        }

        $admin = User::where('email', 'admin@kadiar-demo.com')->first();
        if (!$admin) {
            $this->command->error('Admin demo introuvable.');
            return;
        }

        $campagne = $organisation->campagnes()->where('est_courante', true)->first();

        // Créer les 4 champs s'ils n'existent pas
        $champsData = [
            'Yokh'        => ['superficie_ha' => 3.5, 'localisation' => 'Sine-Saloum'],
            'Ablaye Fall' => ['superficie_ha' => 2.8, 'localisation' => 'Thiès'],
            'Razel'       => ['superficie_ha' => 4.2, 'localisation' => 'Thiès'],
            'Projet'      => ['superficie_ha' => 5.0, 'localisation' => 'Kaolack'],
        ];

        $champs = [];
        foreach ($champsData as $nom => $attrs) {
            $champ = Champ::withoutGlobalScopes()->firstOrCreate(
                ['organisation_id' => $organisation->id, 'nom' => $nom],
                [
                    'user_id' => $admin->id,
                    'superficie_ha' => $attrs['superficie_ha'],
                    'localisation' => $attrs['localisation'],
                    'est_actif' => true,
                ]
            );
            $champs[$nom] = $champ->id;
            $this->command->info("  Champ «{$nom}» : ID {$champ->id}");
        }

        $orgId = $organisation->id;
        $userId = $admin->id;
        $campId = $campagne?->id;

        // Fonction de création raccourcie
        $dep = function (string $desc, int $montant, string $cat, ?string $champNom, string $date) use ($orgId, $userId, $campId, $champs) {
            Depense::create([
                'organisation_id' => $orgId,
                'user_id'         => $userId,
                'campagne_id'     => $campId,
                'champ_id'        => $champNom ? ($champs[$champNom] ?? null) : null,
                'categorie'       => $cat,
                'description'     => $desc . ' [hist2025]',
                'montant_fcfa'    => $montant,
                'date_depense'    => $date,
                'est_auto_generee' => false,
            ]);
        };

        // ═══════════════════════════════════════════════════════
        // LISTE 1 — Campagne 2025&26 (Total 220 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Traitement Ablaye Fall',          13500, 'traitement_phytosanitaire', 'Ablaye Fall', '2025-10-03');
        $dep('Traitement Yokhe Selec',          40000, 'traitement_phytosanitaire', 'Yokh',        '2025-10-03');
        $dep('Dépenses diverses',               2500,  'autre',                    null,           '2025-10-03');
        $dep('Essence tricycle',                10000, 'carburant',                null,           '2025-10-03');
        $dep("Main-d'oeuvre 0,90 ha",          54000, 'main_oeuvre',              null,           '2025-10-04');
        $dep("Main-d'oeuvre 0,55 ha",          33000, 'main_oeuvre',              null,           '2025-10-04');
        $dep("Répigage 2 journées",            10000, 'main_oeuvre',              null,           '2025-10-05');
        $dep('Gazoil Ablaye Fall',              10000, 'carburant',                'Ablaye Fall', '2025-10-06');
        $dep('Gazoil Ablaye',                   10000, 'carburant',                'Ablaye Fall', '2025-10-07');
        $dep('Essence tricycle',                10000, 'carburant',                null,           '2025-10-08');
        $dep('Traitement Yokhe',               27000, 'traitement_phytosanitaire', 'Yokh',        '2025-10-08');

        // ═══════════════════════════════════════════════════════
        // LISTE 2 — Campagne 2025&26 (Total 157 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Essence tricycle',               13000, 'carburant',                null,           '2025-10-20');
        $dep('Dépenses Ablaye — Tlb 2 journées', 10000, 'main_oeuvre',            'Ablaye Fall', '2025-10-20');
        $dep('Dépenses Yokhe Bay',             40000, 'autre',                    'Yokh',        '2025-10-21');
        $dep('Gazoil Projet',                  10000, 'carburant',                'Projet',      '2025-10-21');
        $dep('Coup-coup Projet',                4000, 'main_oeuvre',              'Projet',      '2025-10-22');
        $dep('Essence tricycle',                5000, 'carburant',                null,           '2025-10-22');
        $dep("Main-d'oeuvre Tlb",             44000, 'main_oeuvre',              null,           '2025-10-23');
        $dep('Dépenses Tlb Ablaye',             5000, 'autre',                    'Ablaye Fall', '2025-10-24');
        $dep('Entretien tricycle',              6000, 'entretien_materiel',       null,           '2025-10-25');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-10-26');
        $dep('Gazoil Yokhe',                   10000, 'carburant',                'Yokh',        '2025-10-26');

        // ═══════════════════════════════════════════════════════
        // LISTE 3 — Campagne 2025&26 (Total 71 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Dépenses Ablaye & Yokhe',         5000, 'autre',                    null,           '2025-11-05');
        $dep('Essence tricycle',                5000, 'carburant',                null,           '2025-11-05');
        $dep('Gazoil Yokhe',                    5000, 'carburant',                'Yokh',        '2025-11-05');
        $dep('Dépenses diverses',               5000, 'autre',                    null,           '2025-11-06');
        $dep('Moto pompe',                     12000, 'materiel',                 null,           '2025-11-07');
        $dep('Ripage tomates Yokhe',            9000, 'main_oeuvre',              'Yokh',        '2025-11-08');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-11-09');
        $dep("Moto pompe + main-d'oeuvre",    15000, 'materiel',                 null,           '2025-11-10');
        $dep('Gazoil Yokhe',                    5000, 'carburant',                'Yokh',        '2025-11-10');

        // ═══════════════════════════════════════════════════════
        // LISTE 4 — Programme Razel 2025&26 (Total 122 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Traitement Razel',               17000, 'traitement_phytosanitaire', 'Razel',      '2025-11-12');
        $dep('Journalier Razel',               12500, 'main_oeuvre',              'Razel',       '2025-11-13');
        $dep('Essence moto Razel',             12000, 'carburant',                'Razel',       '2025-11-14');
        $dep('Aliment Rakal — Razel',          10000, 'alimentation_betail',      'Razel',       '2025-11-15');
        $dep('Mode "fouk" — Razel',             5000, 'autre',                    'Razel',       '2025-11-15');
        $dep('Journalier Razel',               10000, 'main_oeuvre',              'Razel',       '2025-11-16');
        $dep('Traitement Razel',               20000, 'traitement_phytosanitaire', 'Razel',      '2025-11-17');
        $dep('Essence moto Razel',             12000, 'carburant',                'Razel',       '2025-11-18');
        $dep('Dépenses Razel',                  4000, 'autre',                    'Razel',       '2025-11-19');
        $dep('Talibé répigage Razel',          15000, 'main_oeuvre',              'Razel',       '2025-11-20');
        $dep('Essence moto Razel',              5000, 'carburant',                'Razel',       '2025-11-20');

        // ═══════════════════════════════════════════════════════
        // LISTE 5 — Campagne 2025&26 (Total 208 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Moto pompe',                     17000, 'materiel',                 null,           '2025-11-25');
        $dep('Dépenses diverses',               3000, 'autre',                    null,           '2025-11-25');
        $dep('Essence Yokhe',                   5000, 'carburant',                'Yokh',        '2025-11-25');
        $dep('Marabou Sarah',                  35000, 'autre',                    null,           '2025-11-26');
        $dep('Transport engrais',              20000, 'transport',                null,           '2025-11-27');
        $dep('Transport engrais',              20000, 'transport',                null,           '2025-11-28');
        $dep('Traitement Yokhe',               20000, 'traitement_phytosanitaire', 'Yokh',       '2025-11-29');
        $dep('Traitement Ablaye',               5000, 'traitement_phytosanitaire', 'Ablaye Fall','2025-11-29');
        $dep('Dépenses diverses',               3000, 'autre',                    null,           '2025-11-30');
        $dep('Traitement Ablaye',              14000, 'traitement_phytosanitaire', 'Ablaye Fall','2025-12-01');
        $dep('Dépannage moto',                 32500, 'entretien_materiel',       null,           '2025-12-02');
        $dep('Traitement Ablaye Fall',         20000, 'traitement_phytosanitaire', 'Ablaye Fall','2025-12-03');
        $dep('Marabou Sarax',                   3500, 'autre',                    null,           '2025-12-03');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-12-04');

        // ═══════════════════════════════════════════════════════
        // LISTE 6 — Campagne 2025&26 (Total 163 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-12-08');
        $dep('Gazoil Projet',                  10000, 'carburant',                'Projet',      '2025-12-08');
        $dep('Aliment Rakal',                  20000, 'alimentation_betail',      null,           '2025-12-09');
        $dep('Gazoil Yokhe',                   10000, 'carburant',                'Yokh',        '2025-12-09');
        $dep('Gazoil Ablaye',                  10000, 'carburant',                'Ablaye Fall', '2025-12-10');
        $dep('Gazoil Ablaye Fall',              7000, 'carburant',                'Ablaye Fall', '2025-12-10');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-12-11');
        $dep('Traitement Yokhe Safir',         30000, 'traitement_phytosanitaire', 'Yokh',       '2025-12-12');
        $dep('Assane mécanicien',               7000, 'entretien_materiel',       null,           '2025-12-13');
        $dep('40 litres aliment bétail',       14000, 'alimentation_betail',      null,           '2025-12-14');
        $dep('Dépenses diverses',               5000, 'autre',                    null,           '2025-12-14');
        $dep('Gazoil Yokhe',                   10000, 'carburant',                'Yokh',        '2025-12-15');
        $dep('Gazoil Ablaye',                  10000, 'carburant',                'Ablaye Fall', '2025-12-15');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-12-16');

        // ═══════════════════════════════════════════════════════
        // LISTE 7 — Campagne 2025&26 (Total 137 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Gazoil Projet',                   5000, 'carburant',                'Projet',      '2025-12-20');
        $dep('Gazoil Yokhe',                   10000, 'carburant',                'Yokh',        '2025-12-20');
        $dep('Gazoil Ablaye Fall',             10000, 'carburant',                'Ablaye Fall', '2025-12-20');
        $dep('Huile moto pompe',                4000, 'entretien_materiel',       null,           '2025-12-21');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2025-12-21');
        $dep('Safir plus Selec',               22000, 'traitement_phytosanitaire', null,          '2025-12-22');
        $dep('Dépenses diverses',               5000, 'autre',                    null,           '2025-12-22');
        $dep('Gazoil Yokhe',                    8000, 'carburant',                'Yokh',        '2025-12-23');
        $dep('Gazoil Ablaye',                  10000, 'carburant',                'Ablaye Fall', '2025-12-23');
        $dep('Gazoil Projet',                   5000, 'carburant',                'Projet',      '2025-12-24');
        $dep('Travaux Projet',                 48000, 'main_oeuvre',              'Projet',      '2025-12-26');

        // ═══════════════════════════════════════════════════════
        // LISTE 8 — Campagne 2025&26 (Total 153 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Entretien moto pompe',           40000, 'entretien_materiel',       null,           '2026-01-05');
        $dep("Main-d'oeuvre mécanicien",       20000, 'main_oeuvre',              null,           '2026-01-05');
        $dep('Gazoil',                          3000, 'carburant',                null,           '2026-01-06');
        $dep('Essence tricycle',                5000, 'carburant',                null,           '2026-01-06');
        $dep('Gazoil Projet',                   5000, 'carburant',                'Projet',      '2026-01-07');
        $dep('Gazoil Ablaye Fall',             10000, 'carburant',                'Ablaye Fall', '2026-01-07');
        $dep('Frais récolte Yokhe',            13500, 'frais_recolte',            'Yokh',        '2026-01-08');
        $dep('Frais récolte Ablaye',           42500, 'frais_recolte',            'Ablaye Fall', '2026-01-09');
        $dep('Roulement moto pompe',            4000, 'entretien_materiel',       null,           '2026-01-10');
        $dep('Gazoil',                         10000, 'carburant',                null,           '2026-01-10');

        // ═══════════════════════════════════════════════════════
        // LISTE 9 — Campagne 2025&26
        // ═══════════════════════════════════════════════════════
        $dep('Dépenses diverses',              20000, 'autre',                    null,           '2026-01-15');
        $dep('Moto pompe',                     25000, 'materiel',                 null,           '2026-01-15');
        $dep('Aliment Ripas — 10 sacs',        70000, 'alimentation_betail',      null,           '2026-01-16');
        $dep('Rakal — 3 sacs',                30000, 'alimentation_betail',      null,           '2026-01-16');
        $dep('Frais récolte Yokhe',            79000, 'frais_recolte',            'Yokh',        '2026-01-17');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2026-01-18');
        $dep('Gazoil',                         15000, 'carburant',                null,           '2026-01-18');
        $dep('Rakal bétail',                   10000, 'alimentation_betail',      null,           '2026-01-19');
        $dep('Traitement Ablaye',               9500, 'traitement_phytosanitaire', 'Ablaye Fall','2026-01-20');
        $dep('Traitement Yokhe',                7500, 'traitement_phytosanitaire', 'Yokh',       '2026-01-20');
        $dep('Aliment Rakal bétail',            8000, 'alimentation_betail',      null,           '2026-01-21');
        $dep('Frais récolte Yokhe',            36000, 'frais_recolte',            'Yokh',        '2026-01-22');

        // ═══════════════════════════════════════════════════════
        // LISTE 10 — Programme Razel 2025&26
        // ═══════════════════════════════════════════════════════
        $dep('Journalier Razel',               15000, 'main_oeuvre',              'Razel',       '2026-02-01');
        $dep('Essence moto Razel',             12000, 'carburant',                'Razel',       '2026-02-02');
        $dep('Gazoil Ablaye',                   5000, 'carburant',                'Ablaye Fall', '2026-02-02');
        $dep('Entretien moto',                 55000, 'entretien_materiel',       null,           '2026-02-03');
        $dep('Essence moto Razel',              6000, 'carburant',                'Razel',       '2026-02-04');
        $dep('Essence moto Razel',             12000, 'carburant',                'Razel',       '2026-02-05');
        $dep('1er frais récolte Razel',        11000, 'frais_recolte',            'Razel',       '2026-02-06');
        $dep('2e & 3e frais récolte Razel',    27000, 'frais_recolte',            'Razel',       '2026-02-08');

        // ═══════════════════════════════════════════════════════
        // LISTE 11 — Campagne 2025&26
        // ═══════════════════════════════════════════════════════
        $dep('Sarah',                           2300, 'autre',                    null,           '2026-02-10');
        $dep('Traitement Yokhe',               15000, 'traitement_phytosanitaire', 'Yokh',       '2026-02-10');
        $dep('Dépenses diverses',               4000, 'autre',                    null,           '2026-02-11');
        $dep('Dépenses Diakarta',              13000, 'autre',                    null,           '2026-02-11');
        $dep('Gazoil Yokhe',                    5000, 'carburant',                'Yokh',        '2026-02-12');
        $dep('Essence tricycle',                5000, 'carburant',                null,           '2026-02-12');
        $dep('Moto pompe',                      4000, 'materiel',                 null,           '2026-02-13');
        $dep('Tricycle',                        4000, 'transport',                null,           '2026-02-13');
        $dep('Transport Yokhe — oignons',      10000, 'transport',                'Yokh',        '2026-02-14');
        $dep("Main-d'oeuvre Yokhe",            51000, 'main_oeuvre',              'Yokh',        '2026-02-15');
        $dep('Transport Yokhe',                15000, 'transport',                'Yokh',        '2026-02-16');
        $dep('Gazoil Ablaye Fall',             10000, 'carburant',                'Ablaye Fall', '2026-02-17');
        $dep('Entretien moto',                 15000, 'entretien_materiel',       null,           '2026-02-17');
        $dep('Rakal aliment bétail',           10000, 'alimentation_betail',      null,           '2026-02-18');

        // ═══════════════════════════════════════════════════════
        // LISTE 12 — Campagne 2025&26 (Total 112 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Traitement Ablaye Fall Selec',   40000, 'traitement_phytosanitaire', 'Ablaye Fall','2026-02-22');
        $dep('Dépenses diverses',               6000, 'autre',                    null,           '2026-02-22');
        $dep('Dépannage tricycle',             32000, 'entretien_materiel',       null,           '2026-02-23');
        $dep('Traitement foliaire Ablaye',      4000, 'traitement_phytosanitaire', 'Ablaye Fall','2026-02-24');
        $dep('Traitement foliaire Yokhe',       8000, 'traitement_phytosanitaire', 'Yokh',       '2026-02-24');
        $dep('Traitement canal Yokhe',          6000, 'traitement_phytosanitaire', 'Yokh',       '2026-02-25');
        $dep('Traitement canal Ablaye',         6000, 'traitement_phytosanitaire', 'Ablaye Fall','2026-02-25');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2026-02-26');

        // ═══════════════════════════════════════════════════════
        // LISTE 13 — Programme Razel 2025&26 (Total 96 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Nettoyage citron Razel',         27500, 'main_oeuvre',              'Razel',       '2026-03-01');
        $dep('Journalier tomates & oignons Razel', 25000, 'main_oeuvre',          'Razel',       '2026-03-02');
        $dep('Traitement citron 2L — Razel',   14000, 'traitement_phytosanitaire', 'Razel',      '2026-03-03');
        $dep('Traitement tomates Razel',       18000, 'traitement_phytosanitaire', 'Razel',      '2026-03-04');
        $dep('Essence moto Razel',             12000, 'carburant',                'Razel',       '2026-03-05');

        // ═══════════════════════════════════════════════════════
        // LISTE 14 — Campagne 2025&26 (Total 134 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2026-03-08');
        $dep('Porte module',                    3000, 'materiel',                 null,           '2026-03-08');
        $dep('Gazoil et huile Ablaye',          9500, 'carburant',                'Ablaye Fall', '2026-03-09');
        $dep('Gazoil Projet',                   5000, 'carburant',                'Projet',      '2026-03-09');
        $dep('Dépenses diverses',               5000, 'autre',                    null,           '2026-03-10');
        $dep('Entretien moto pompe',           50500, 'entretien_materiel',       null,           '2026-03-10');
        $dep('Essence & gazoil',                7000, 'carburant',                null,           '2026-03-11');
        $dep('Gazoil Ablaye',                  10000, 'carburant',                'Ablaye Fall', '2026-03-12');
        $dep('Gazoil Yokhe',                   15000, 'carburant',                'Yokh',        '2026-03-12');
        $dep('Dépenses diverses',               4000, 'autre',                    null,           '2026-03-13');
        $dep("Main-d'oeuvre entretien",        15000, 'main_oeuvre',              null,           '2026-03-13');

        // ═══════════════════════════════════════════════════════
        // LISTE 15 — Campagne 2025&26 traitement (Total 202 400 F)
        // ═══════════════════════════════════════════════════════
        $dep('Titen 3 litres',                 39000, 'traitement_phytosanitaire', null,          '2026-03-15');
        $dep('Traitement Yokhe Safir',         43000, 'traitement_phytosanitaire', 'Yokh',       '2026-03-15');
        $dep('Traitement Ablaye Safir',        21000, 'traitement_phytosanitaire', 'Ablaye Fall','2026-03-16');
        $dep('Clifader traitement Ablaye',      6000, 'traitement_phytosanitaire', 'Ablaye Fall','2026-03-16');
        $dep('Clifader Yokhe',                  6000, 'traitement_phytosanitaire', 'Yokh',       '2026-03-17');
        $dep('Essence tricycle',               13000, 'carburant',                null,           '2026-03-17');
        $dep('Maçon',                          15000, 'main_oeuvre',              null,           '2026-03-18');
        $dep('Ciment 8 sacs',                  30400, 'materiel',                 null,           '2026-03-18');
        $dep('Dépenses diverses',               5000, 'autre',                    null,           '2026-03-19');
        $dep('Gazoil',                         10000, 'carburant',                null,           '2026-03-19');
        $dep('Semences tomates',               14000, 'intrant',                  null,           '2026-03-20');

        // ═══════════════════════════════════════════════════════
        // LISTE 16 — Programme campagne 2025/26 (Total 50 500 F)
        // ═══════════════════════════════════════════════════════
        $dep('Journalier Yokhe',                7500, 'main_oeuvre',              'Yokh',        '2026-03-22');
        $dep('Journalier Ablaye',              10000, 'main_oeuvre',              'Ablaye Fall', '2026-03-22');
        $dep('Dépenses déjeuner',               3000, 'autre',                    null,           '2026-03-22');
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2026-03-23');
        $dep('Journalier Razel — Répigage',    20000, 'main_oeuvre',              'Razel',       '2026-03-24');

        // ═══════════════════════════════════════════════════════
        // LISTE 17 — Programme campagne 2025/26 (Total 146 550 F)
        // ═══════════════════════════════════════════════════════
        $dep('Essence tricycle',               10000, 'carburant',                null,           '2026-03-26');
        $dep('Huile moteur',                   10000, 'entretien_materiel',       null,           '2026-03-26');
        $dep('3 porte modules',                31250, 'materiel',                 null,           '2026-03-27');
        $dep("Main-d'oeuvre",                 12000, 'main_oeuvre',              null,           '2026-03-27');
        $dep('Maçon',                          15000, 'main_oeuvre',              null,           '2026-03-28');
        $dep('Chargement sable',               15000, 'materiel',                 null,           '2026-03-28');
        $dep('3 barres fer 6',                  5300, 'materiel',                 null,           '2026-03-29');
        $dep('Pelles (4)',                      2000, 'materiel',                 null,           '2026-03-29');
        $dep('Dépenses diverses',               3000, 'autre',                    null,           '2026-03-29');
        $dep('Gazoil',                         30000, 'carburant',                null,           '2026-03-30');
        $dep('Gazoil',                         10000, 'carburant',                null,           '2026-03-31');

        // ═══════════════════════════════════════════════════════
        // LISTE 18 — Dépenses Razel 2025/26 (Total 186 500 F)
        // ═══════════════════════════════════════════════════════
        $dep('Dépenses Razel',                  3000, 'autre',                    'Razel',       '2026-04-02');
        $dep('Rouleau Enjou + transport',      46000, 'materiel',                 'Razel',       '2026-04-02');
        $dep('Obsette — Razel',                65000, 'materiel',                 'Razel',       '2026-04-03');
        $dep('Essence Razel',                   6000, 'carburant',                'Razel',       '2026-04-03');
        $dep('Mension 63/50',                  13500, 'materiel',                 'Razel',       '2026-04-04');
        $dep('Corde 64m',                       8000, 'materiel',                 'Razel',       '2026-04-04');
        $dep('Dépenses Razel',                  4000, 'autre',                    'Razel',       '2026-04-05');
        $dep('Aliment Ripas — Razel',           7000, 'alimentation_betail',      'Razel',       '2026-04-05');
        $dep('Ordonnance Seydou',              15000, 'autre',                    'Razel',       '2026-04-06');
        $dep('2 Van Ger',                       9000, 'materiel',                 'Razel',       '2026-04-06');
        $dep('Essence Razel',                   6000, 'carburant',                'Razel',       '2026-04-07');
        $dep('Huile Razel',                     4000, 'entretien_materiel',       'Razel',       '2026-04-07');

        // ═══════════════════════════════════════════════════════
        // LISTE 19 — Dépenses campagne 2025.26 (Total 259 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Marabout Sud',                   25000, 'autre',                    null,           '2026-04-08');
        $dep('Transport Makha',                 5000, 'transport',                null,           '2026-04-08');
        $dep('Marabout Sud',                   22000, 'autre',                    null,           '2026-04-09');
        $dep('Traitement phytosanitaire',      21000, 'traitement_phytosanitaire', null,          '2026-04-09');
        $dep('Dépannage moto',                186000, 'entretien_materiel',       null,           '2026-04-10');

        // ═══════════════════════════════════════════════════════
        // LISTE 20 — Dépenses campagne 2025/26 (Total 105 000 F)
        // ═══════════════════════════════════════════════════════
        $dep('Paire arrosoirs',                12000, 'materiel',                 null,           '2026-04-12');
        $dep('Entretien tricycle',             28000, 'entretien_materiel',       null,           '2026-04-12');
        $dep('Essence',                        15000, 'carburant',                null,           '2026-04-13');
        $dep('Transport compost',              10000, 'transport',                null,           '2026-04-13');
        $dep('Sac Rakal — Razel',             10500, 'alimentation_betail',      'Razel',       '2026-04-14');
        $dep('Essence',                        10000, 'carburant',                null,           '2026-04-14');
        $dep('Transport Tywo',                 15000, 'transport',                null,           '2026-04-15');
        $dep('Essence',                         5000, 'carburant',                null,           '2026-04-15');

        $count = Depense::where('organisation_id', $orgId)->where('description', 'LIKE', '%[hist2025]%')->count();
        $this->command->info("✅ {$count} dépenses historiques 2025/26 insérées pour «{$organisation->nom}».");
    }
}

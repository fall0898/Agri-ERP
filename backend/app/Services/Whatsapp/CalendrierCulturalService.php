<?php
namespace App\Services\Whatsapp;

use App\Models\Culture;

class CalendrierCulturalService
{
    public function getStadeActuel(Culture $culture): ?array
    {
        if (! $culture->date_semis || ! $culture->type_culture) {
            return null;
        }

        $j      = (int) $culture->date_semis->diffInDays(now());
        $stades = $this->getStades($culture->type_culture);

        if (! $stades) {
            return null;
        }

        $stadeActuel   = null;
        $prochainStade = null;

        foreach ($stades as $i => $stade) {
            if ($j >= $stade['j_debut'] && $j <= $stade['j_fin']) {
                $stadeActuel   = $stade;
                $prochainStade = $stades[$i + 1] ?? null;
                break;
            }
        }

        if (! $stadeActuel && $j > 0) {
            $stadeActuel = end($stades);
        }

        return [
            'stade'            => $stadeActuel,
            'j_culture'        => $j,
            'prochain_stade'   => $prochainStade,
            'j_avant_prochain' => $prochainStade ? max(0, $prochainStade['j_debut'] - $j) : null,
        ];
    }

    public function getConseils(Culture $culture, array $meteo, string $systemeArrosage = 'aspersion', string $langue = 'fr'): string
    {
        $info = $this->getStadeActuel($culture);

        if (! $info || ! $info['stade']) {
            return $langue === 'wo'
                ? "Dëkk date bu semis ak type culture ci app bi tey."
                : "Renseignez la date de semis et le type de culture dans l'application.";
        }

        $stade   = $info['stade'];
        $j       = $info['j_culture'];
        $surface = $culture->champ?->superficie_ha ?? 1.0;

        $msg  = "🌱 *" . mb_strtoupper($culture->type_culture ?? '') . "* — {$culture->nom}\n";
        $msg .= "📅 Jour {$j} depuis le semis\n";
        $msg .= "📍 Stade : *{$stade['nom']}*\n";
        $msg .= "ℹ️ {$stade['alerte']}\n";

        if ($info['prochain_stade']) {
            $msg .= "⏭ Prochain : *{$info['prochain_stade']['nom']}* dans ~{$info['j_avant_prochain']}j\n";
        }

        $msg .= "\n";

        $fertil = $this->getFertilisationStade($culture->type_culture, $stade['nom'], $surface);
        if ($fertil) {
            $msg .= "🌿 *Fertilisation :*\n{$fertil}\n\n";
        }

        $irrig = $this->getIrrigationConseils($culture->type_culture, $stade['nom'], $meteo, $systemeArrosage);
        if ($irrig) {
            $msg .= "💧 *Irrigation :*\n{$irrig}\n\n";
        }

        $ravageur = $this->getRavageurAlert($culture->type_culture, $stade['nom'], $meteo);
        if ($ravageur) {
            $msg .= "⚠️ *Alerte ravageur :*\n{$ravageur}\n";
        }

        return rtrim($msg);
    }

    public function getAlerteType(Culture $culture): ?string
    {
        $info = $this->getStadeActuel($culture);

        if (! $info || ! $info['stade']) {
            return null;
        }

        $stade = $info['stade'];
        $j     = $info['j_culture'];
        if (abs($j - $stade['j_debut']) <= 2) {
            $slug = strtolower(str_replace([' ', "'", '/', '-'], '_', $stade['nom']));
            return "{$culture->type_culture}_{$slug}";
        }

        return null;
    }

    private function getStades(string $type): ?array
    {
        return match ($type) {
            'oignon'    => $this->stadesOignon(),
            'tomate'    => $this->stadesTomate(),
            'riz'       => $this->stadesRiz(),
            'pasteque'  => $this->stadesPasteque(),
            'melon'     => $this->stadesMelon(),
            'concombre' => $this->stadesConcombre(),
            'courgette' => $this->stadesCourgette(),
            'fraisier'  => $this->stadesFraisier(),
            default     => null,
        };
    }

    // ── Stades par culture ────────────────────────────────────────────────────

    private function stadesOignon(): array
    {
        // Cycle post-transplant (pépinière 40-45j séparée). Source: ISRA/ANCAR/GIZ Niayes
        // Variétés recommandées Niayes: Violet de Galmi (principale), Safari F1, Bénina F1, Red Creole
        // Rendement attendu: 15-25 t/ha (bonnes pratiques ISRA: jusqu'à 30-40 t/ha)
        return [
            ['nom' => 'Reprise',             'j_debut' => 0,   'j_fin' => 14,  'alerte' => 'Arrosage quotidien. Fond de plantation déjà apporté. Variétés Niayes: Violet de Galmi, Safari F1, Bénina F1. Surveiller fonte de semis (Pythium)'],
            ['nom' => '2 feuilles',           'j_debut' => 15,  'j_fin' => 25,  'alerte' => 'APPORT N1 (J+15) : Urée 100 kg/ha. Sarclage léger. Surveiller Pythium en sol saturé'],
            ['nom' => '4-6 feuilles',         'j_debut' => 26,  'j_fin' => 55,  'alerte' => 'APPORT N2 (J+45) : Urée 75 kg/ha. Herbicide si adventices. Dernier apport azoté recommandé'],
            ['nom' => 'Initiation bulbaire',  'j_debut' => 56,  'j_fin' => 70,  'alerte' => "APPORT K1 (J+60) : Sulfate de potasse 75 kg/ha. Espacer arrosage — STOP azote absolu"],
            ['nom' => 'Grossissement bulbe',  'j_debut' => 71,  'j_fin' => 105, 'alerte' => 'APPORT K2 (J+80) : Sulfate de potasse 50 kg/ha. Réduction arrosage progressive. AUCUN azote'],
            ['nom' => 'Verse des feuilles',   'j_debut' => 90,  'j_fin' => 115, 'alerte' => 'Arrêt progressif apports hydriques. Surveiller Botrytis (pourriture col) si humidité >70%'],
            ['nom' => 'Maturation',           'j_debut' => 106, 'j_fin' => 120, 'alerte' => 'Arrêt arrosage J+110. Surveiller Botrytis sur col. Pré-ressuyage au champ 3-5j avant arrachage'],
            ['nom' => 'Récolte',              'j_debut' => 115, 'j_fin' => 999, 'alerte' => 'Récolter le matin. Séchage 3-5j au champ puis conservation en silo aéré. Rendement cible: 20-30 t/ha'],
        ];
    }

    private function stadesTomate(): array
    {
        return [
            ['nom' => 'Reprise',               'j_debut' => 0,  'j_fin' => 15,  'alerte' => 'Arrosage régulier, tuteurer variétés indéterminées'],
            ['nom' => 'Croissance végétative', 'j_debut' => 16, 'j_fin' => 30,  'alerte' => 'Fertilisation N1, pincer gourmands, surveiller Bemisia'],
            ['nom' => 'Première floraison',    'j_debut' => 28, 'j_fin' => 45,  'alerte' => 'Fertilisation P, arrosage régulier — pas de stress hydrique'],
            ['nom' => 'Floraison pleine',      'j_debut' => 35, 'j_fin' => 55,  'alerte' => 'Apport Ca (nécrose apicale), surveiller mildiou si humidité'],
            ['nom' => 'Nouaison',              'j_debut' => 45, 'j_fin' => 65,  'alerte' => 'Apport K1, surveiller Tuta absoluta et Phytophthora'],
            ['nom' => 'Grossissement fruits',  'j_debut' => 55, 'j_fin' => 75,  'alerte' => 'Fertilisation K2, réduire azote'],
            ['nom' => 'Véraison',              'j_debut' => 65, 'j_fin' => 85,  'alerte' => 'Réduire légèrement arrosage pour concentrer sucres'],
            ['nom' => 'Récolte',               'j_debut' => 75, 'j_fin' => 999, 'alerte' => 'Récolter le matin, conserver en caisse à l\'ombre'],
        ];
    }

    private function stadesRiz(): array
    {
        return [
            ['nom' => 'Installation',         'j_debut' => 0,   'j_fin' => 10,  'alerte' => "Lame d'eau 3-5 cm, herbicide J+3-5 après repiquage"],
            ['nom' => 'Tallage actif',         'j_debut' => 11,  'j_fin' => 55,  'alerte' => 'Fertilisation N1 à J+10-15, désherbage complémentaire'],
            ['nom' => 'Montaison',             'j_debut' => 56,  'j_fin' => 70,  'alerte' => 'Fertilisation N2, surveiller foreur des tiges (dead heart)'],
            ['nom' => 'Épiaison',              'j_debut' => 70,  'j_fin' => 85,  'alerte' => 'CRITIQUE : maintenir 15-20 cm eau — stress = stérilité grains'],
            ['nom' => 'Floraison',             'j_debut' => 75,  'j_fin' => 88,  'alerte' => 'Traitement pyriculaire paniculaire préventif si conditions à risque'],
            ['nom' => 'Remplissage grains',    'j_debut' => 85,  'j_fin' => 103, 'alerte' => 'Réduire progressivement irrigation, surveiller punaises panicule'],
            ['nom' => 'Maturation',            'j_debut' => 100, 'j_fin' => 115, 'alerte' => 'Assèchement contrôlé J+100-103, sol portant pour moissonneuse'],
            ['nom' => 'Récolte',               'j_debut' => 108, 'j_fin' => 999, 'alerte' => "Battre rapidement, sécher grain à 14% d'humidité avant stockage"],
        ];
    }

    // Source: Fiches techniques CDH/ISRA Cambérène, Dakar (Sénégal)

    private function stadesPasteque(): array
    {
        return [
            ['nom' => 'Levée',                 'j_debut' => 0,  'j_fin' => 10,  'alerte' => 'Arrosage dans cuvette autour des pieds. Surveiller fonte de semis. Profondeur semis 1-2 cm'],
            ['nom' => 'Croissance végétative', 'j_debut' => 11, 'j_fin' => 35,  'alerte' => 'Sarclages réguliers. Démarier à 1-2 plants/poquet à J+21'],
            ['nom' => 'Initiation florale',    'j_debut' => 36, 'j_fin' => 50,  'alerte' => 'Apport fumure entretien J+40. Surveiller Thrips (déformation bourgeons) et mouches des cucurbitacées'],
            ['nom' => 'Floraison',             'j_debut' => 51, 'j_fin' => 65,  'alerte' => 'Besoins en eau maximaux. Entourer jeunes fruits de sachets journal contre mouches des cucurbitacées'],
            ['nom' => 'Grossissement fruits',  'j_debut' => 66, 'j_fin' => 80,  'alerte' => 'CRITIQUE : ne pas manquer d\'eau — risque de fissure et perte qualité. Surveiller Cercosporiose'],
            ['nom' => 'Maturité',              'j_debut' => 76, 'j_fin' => 100, 'alerte' => 'Critères maturité: vrille desséchée + bruit craquant. Récolter le matin avec pédoncule'],
            ['nom' => 'Récolte',               'j_debut' => 75, 'j_fin' => 999, 'alerte' => 'Rendement: 200-450 kg/100m² (2-4.5 t/ha). Bonne conservation facilite commercialisation'],
        ];
    }

    private function stadesMelon(): array
    {
        return [
            ['nom' => 'Levée',              'j_debut' => 0,  'j_fin' => 10,  'alerte' => 'Arrosage localisé sans mouiller feuillage (risque maladies). Semis sept-avril uniquement'],
            ['nom' => 'Croissance',         'j_debut' => 11, 'j_fin' => 25,  'alerte' => 'Sarclages fréquents. Attention aux racines superficielles. Démarier à 1-2 plants à J+21'],
            ['nom' => 'Étêtage/Taille',     'j_debut' => 21, 'j_fin' => 40,  'alerte' => 'Étêter à 4 vraies feuilles (au-dessus 2e feuille) — hâte la floraison femelle. Taille type 2-3-3 possible'],
            ['nom' => 'Floraison-nouaison', 'j_debut' => 36, 'j_fin' => 60,  'alerte' => 'Apport NPK au stade floraison. Besoins eau élevés. Surveiller mildiou (duvet gris-violacé)'],
            ['nom' => 'Grossissement',      'j_debut' => 61, 'j_fin' => 75,  'alerte' => 'RÉDUIRE arrosage avant récolte pour enrichir fruits en sucres et éviter éclatement'],
            ['nom' => 'Maturité',           'j_debut' => 76, 'j_fin' => 100, 'alerte' => 'Critères: parfum + changement couleur + fendillement attache du pédoncule. Couper avec 1-2 cm pédoncule'],
            ['nom' => 'Récolte',            'j_debut' => 75, 'j_fin' => 999, 'alerte' => 'Rendement: 100-200 kg/100m². Passages journaliers. Export: récolter 3-4 jours avant maturité'],
        ];
    }

    private function stadesConcombre(): array
    {
        return [
            ['nom' => 'Levée',             'j_debut' => 0,  'j_fin' => 10,  'alerte' => 'Arrosage journalier localisé sans mouiller feuillage. Semis sept-mars (saison fraîche) ou avr-août (hivernage)'],
            ['nom' => 'Croissance',        'j_debut' => 11, 'j_fin' => 25,  'alerte' => 'Éclaircir à 1 plant/poquet à 4 vraies feuilles. Étêter à 30 cm pour ramification. Installer tuteurs'],
            ['nom' => 'Floraison',         'j_debut' => 26, 'j_fin' => 40,  'alerte' => 'Fumure entretien J+28. Besoins eau maximaux. Surveiller mouches des cucurbitacées'],
            ['nom' => 'Fructification',    'j_debut' => 40, 'j_fin' => 55,  'alerte' => 'Première récolte dès J+40-55. Fumure J+42-56. Surveiller mildiou si temps humide'],
            ['nom' => 'Récolte continue',  'j_debut' => 40, 'j_fin' => 999, 'alerte' => 'Récolter quotidiennement fruits verts 15-20 cm, Ø 4-5 cm avant maturité. Rendement: 300-800 kg/100m² (saison fraîche)'],
        ];
    }

    private function stadesCourgette(): array
    {
        return [
            ['nom' => 'Levée',            'j_debut' => 0,  'j_fin' => 10,  'alerte' => 'Arrosage journalier dans cuvette. Ne pas mouiller feuillage (risque Le Blanc). Saison: sept-mai'],
            ['nom' => 'Croissance',       'j_debut' => 11, 'j_fin' => 22,  'alerte' => 'Démarier à 1 plant/poquet à J+21 (2-3 vraies feuilles). Sarclages réguliers'],
            ['nom' => 'Floraison',        'j_debut' => 22, 'j_fin' => 35,  'alerte' => 'Fumure entretien J+21. Surveiller Le Blanc (taches blanches poudreuses sur feuilles/tiges) et mosaïque (virus)'],
            ['nom' => 'Fructification',   'j_debut' => 35, 'j_fin' => 50,  'alerte' => 'Fumure J+35. Passages tous les 2 jours. Brûler immédiatement plants atteints par mosaïque'],
            ['nom' => 'Récolte continue', 'j_debut' => 35, 'j_fin' => 999, 'alerte' => 'Récolter fruits 15-20 cm, Ø 3-5 cm avant maturité. Fumure J+56. Rendement: 200-400 kg/100m²'],
        ];
    }

    private function stadesFraisier(): array
    {
        return [
            ['nom' => 'Plantation/Reprise', 'j_debut' => 0,   'j_fin' => 20,  'alerte' => 'Planter mi-oct à mi-nov. Cœur du plant à la surface. Arrosage aspersion quotidien. Importer plants certifiés'],
            ['nom' => 'Croissance',         'j_debut' => 21,  'j_fin' => 50,  'alerte' => 'Fumure entretien J+30. Sarclages réguliers. Surveiller pourriture cuir (Phytophthora) — traiter au phosethyl-Al'],
            ['nom' => 'Initiation florale', 'j_debut' => 51,  'j_fin' => 65,  'alerte' => 'Poser paillage paille de riz. Surveiller araignée rouge (points décolorés feuilles) → fenbutaxin oxyde'],
            ['nom' => 'Floraison',          'j_debut' => 65,  'j_fin' => 80,  'alerte' => 'Augmenter arrosage aspersion. Fumure mensuelle. Surveiller chenilles (boutons floraux) → pyréthrïnoïdes'],
            ['nom' => 'Fructification',     'j_debut' => 80,  'j_fin' => 130, 'alerte' => 'Pourriture racines si chaud+humide → benomyl tous les 15j. Manipuler fruits avec soin'],
            ['nom' => 'Récolte continue',   'j_debut' => 65,  'j_fin' => 230, 'alerte' => 'Passages tous les 2 jours. Fruits colorés et fermes. Rendement: 200-400 kg/100m² (var. productives)'],
            ['nom' => 'Fin de cycle',       'j_debut' => 230, 'j_fin' => 999, 'alerte' => 'Formation de stolons — fin de production. Renouveler plants chaque saison pour maintenir rendement'],
        ];
    }

    // ── Fertilisation ─────────────────────────────────────────────────────────

    private function getFertilisationStade(string $type, string $stadeNom, float $surface): ?string
    {
        $plans = [
            // Source: ISRA/ANCAR/GIZ — Programme oignon Niayes, Sénégal
            'oignon' => [
                'Reprise'             => "Fond pré-plantation (avant transplant) :\n• NPK 6-20-10 : " . round(300 * $surface) . " kg (300 kg/ha)\n• Fumure organique : " . round(10 * $surface) . " t (10 t/ha)\nIncorporer lors de la préparation du sol",
                '2 feuilles'          => "Urée 46% : " . round(100 * $surface) . " kg (100 kg/ha) — Apport N1 (J+15)\nFractionnement en 2 passages si risque de pluie",
                '4-6 feuilles'        => "Urée 46% : " . round(75 * $surface) . " kg (75 kg/ha) — Apport N2 (J+45)\n⚠️ Dernier apport azoté — STOP azote après ce stade",
                'Initiation bulbaire' => "Sulfate de potasse 50% K₂O : " . round(75 * $surface) . " kg (75 kg/ha) — Apport K1 (J+60)\n🚫 ZÉRO azote désormais — tout apport N nuit à la conservation",
                'Grossissement bulbe' => "Sulfate de potasse 50% K₂O : " . round(50 * $surface) . " kg (50 kg/ha) — Apport K2 (J+80)\nAzote interdit. Potassium améliore conservation et calibre",
            ],
            'tomate' => [
                'Croissance végétative' => "Urée 46% : " . round(60 * $surface) . " kg (60 kg/ha) — Apport N1",
                'Première floraison'    => "NPK 15-15-15 : " . round(100 * $surface) . " kg + Superphosphate : " . round(100 * $surface) . " kg",
                'Floraison pleine'      => "Nitrate de calcium Ca(NO₃)₂ : " . round(100 * $surface) . " kg — Prévention nécrose apicale",
                'Nouaison'              => "Sulfate de potasse 50% K₂O : " . round(60 * $surface) . " kg — Apport K1",
                'Grossissement fruits'  => "Sulfate de potasse 50% K₂O : " . round(40 * $surface) . " kg — Apport K2",
            ],
            'riz' => [
                'Tallage actif' => "DAP 18-46-0 : " . round(100 * $surface) . " kg au repiquage\nUrée 46% : " . round(75 * $surface) . " kg — Apport N1 (J+10-15)\nSulfate de zinc ZnSO₄ : " . round(10 * $surface) . " kg si carence (feuilles bronzées)",
                'Montaison'     => "Urée 46% : " . round(75 * $surface) . " kg — Apport N2 (J+55-60)\n⚠️ PAS d'azote après ce stade (verse + maladies)",
            ],
            // Source: CDH/ISRA Cambérène — Fiches techniques cucurbitacées (Dakar, Sénégal)
            'pasteque' => [
                'Initiation florale'   => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Fumure entretien J+40\nIncorporer par griffage léger autour des plants",
            ],
            'melon' => [
                'Étêtage/Taille'     => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Apport au stade étêtage",
                'Floraison-nouaison' => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Apport floraison",
                'Récolte'            => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Apport après 1re récolte",
            ],
            'concombre' => [
                'Floraison'      => "NPK 10-10-20 : " . round(20 * $surface) . " kg (2 kg/100m²) — Fumure J+28. Épandre localement autour des poquets",
                'Fructification' => "NPK 10-10-20 : " . round(20 * $surface) . " kg (2 kg/100m²) — Fumure J+42-56. Éviter d'abîmer racines superficielles",
            ],
            'courgette' => [
                'Floraison'        => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Fumure J+21",
                'Fructification'   => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Fumure J+35",
                'Récolte continue' => "NPK 10-10-20 : " . round(25 * $surface) . " kg (2.5 kg/100m²) — Fumure J+56. Incorporer par griffage",
            ],
            'fraisier' => [
                'Croissance'         => "Fumure entretien mensuelle (par 100m²) :\n• Superphosphate triple : 0.25 kg\n• Sulfate de potasse : 0.6 kg\n• Sulfate d'ammoniac : 1 kg\n• + Nitrate d'ammoniac : 0.7 kg (1er épandage uniquement)",
                'Initiation florale' => "Fumure mensuelle (par 100m²) :\n• Superphosphate triple : 0.25 kg\n• Sulfate de potasse : 0.6 kg\n• Sulfate d'ammoniac : 1 kg",
                'Floraison'          => "Fumure mensuelle (par 100m²) :\n• Superphosphate triple : 0.25 kg\n• Sulfate de potasse : 0.6 kg\n• Sulfate d'ammoniac : 1 kg",
            ],
        ];

        return $plans[$type][$stadeNom] ?? null;
    }

    // ── Irrigation (FAO-56 Kc) ────────────────────────────────────────────────

    private function getIrrigationConseils(string $type, string $stadeNom, array $meteo, string $systeme): ?string
    {
        if ($type === 'riz') {
            $lames = [
                'Installation'       => '3-5 cm',
                'Tallage actif'      => '5-10 cm',
                'Montaison'          => '15-20 cm',
                'Épiaison'           => '15-20 cm (CRITIQUE)',
                'Floraison'          => '15-20 cm (CRITIQUE)',
                'Remplissage grains' => '10-15 cm puis réduction',
                'Maturation'         => 'Assèchement contrôlé',
                'Récolte'            => 'ARRÊT IRRIGATION',
            ];
            $lame = $lames[$stadeNom] ?? '10 cm';
            return "Riz irrigué — lame d'eau : *{$lame}*";
        }

        // Kc FAO-56 par culture et stade
        $kcMap = [
            // Kc FAO-56 oignon — adapté cycle Niayes post-transplant
            'oignon' => [
                'Reprise'             => 0.50,
                '2 feuilles'          => 0.65,
                '4-6 feuilles'        => 0.80,
                'Initiation bulbaire' => 1.05,
                'Grossissement bulbe' => 0.90,
                'Verse des feuilles'  => 0.75,
                'Maturation'          => 0.65,
                'Récolte'             => 0.00,
            ],
            'tomate' => [
                'Reprise'               => 0.60,
                'Croissance végétative' => 0.85,
                'Première floraison'    => 1.15,
                'Floraison pleine'      => 1.15,
                'Nouaison'              => 1.15,
                'Grossissement fruits'  => 1.15,
                'Véraison'              => 0.80,
                'Récolte'               => 0.75,
            ],
            // Kc cucurbitacées FAO-56
            'pasteque' => [
                'Levée'                 => 0.40,
                'Croissance végétative' => 0.75,
                'Initiation florale'    => 0.90,
                'Floraison'             => 1.00,
                'Grossissement fruits'  => 1.00,
                'Maturité'              => 0.75,
                'Récolte'               => 0.75,
            ],
            'melon' => [
                'Levée'              => 0.50,
                'Croissance'         => 0.75,
                'Étêtage/Taille'     => 0.85,
                'Floraison-nouaison' => 1.05,
                'Grossissement'      => 1.05,
                'Maturité'           => 0.75,
                'Récolte'            => 0.75,
            ],
            'concombre' => [
                'Levée'            => 0.60,
                'Croissance'       => 0.80,
                'Floraison'        => 1.00,
                'Fructification'   => 1.00,
                'Récolte continue' => 0.75,
            ],
            'courgette' => [
                'Levée'            => 0.50,
                'Croissance'       => 0.75,
                'Floraison'        => 1.00,
                'Fructification'   => 1.00,
                'Récolte continue' => 0.80,
            ],
            'fraisier' => [
                'Plantation/Reprise' => 0.40,
                'Croissance'         => 0.65,
                'Initiation florale' => 0.75,
                'Floraison'          => 0.85,
                'Fructification'     => 0.85,
                'Récolte continue'   => 0.85,
                'Fin de cycle'       => 0.75,
            ],
        ];

        $kc = $kcMap[$type][$stadeNom] ?? null;
        if ($kc === null) {
            return null;
        }

        if ($kc === 0.00) {
            return "🚫 *ARRÊT TOTAL arrosage* — pré-récolte";
        }

        $et0          = $meteo['et0_moy'] ?? 5.0;
        $pluieSemaine = $meteo['pluie_totale'] ?? 0.0;
        $etc          = round($et0 * $kc, 1);
        $etcSemaine   = round($etc * 7, 0);

        if ($pluieSemaine >= $etcSemaine) {
            return "✅ Pluies prévues ({$pluieSemaine} mm) couvrent les besoins ({$etcSemaine} mm) — arrosage non nécessaire.";
        }

        $freqAspersion = match (true) {
            $kc >= 1.0  => '4 fois/semaine',
            $kc >= 0.85 => '3 fois/semaine',
            $kc >= 0.70 => '2 fois/semaine',
            default     => '1 fois/semaine',
        };

        $freqGoutte = match (true) {
            $kc >= 1.0  => '2 fois/jour 30min',
            $kc >= 0.85 => '1 fois/jour 35min',
            $kc >= 0.70 => '1 fois/jour 25min',
            default     => '1 fois/3 jours',
        };

        $conseil  = "ETc = {$etc} mm/j (Kc={$kc} × ET0={$et0})\n";
        $conseil .= match ($systeme) {
            'aspersion'       => "Aspersion : {$freqAspersion}",
            'goutte_a_goutte' => "Goutte-à-goutte : {$freqGoutte}",
            default           => "Gravitaire : adapter selon parcelle ({$etcSemaine} mm/semaine)",
        };

        return $conseil;
    }

    // ── Alertes ravageurs ─────────────────────────────────────────────────────

    private function getRavageurAlert(string $type, string $stadeNom, array $meteo): ?string
    {
        if (empty($meteo)) {
            return null;
        }

        $temp     = $meteo['temp_max_moy'] ?? 30;
        $humidite = $meteo['humidite_moy'] ?? 60;
        $pluie    = $meteo['pluie_totale'] ?? 0;
        $alertes  = [];

        if ($type === 'oignon') {
            if ($humidite < 55) {
                $alertes[] = "Thrips tabaci : humidité<55% (conditions Niayes fréquentes) = risque élevé. Seuil: 2 thrips/feuille. Traitement: Spinosad 480 SC 0.1ml/L ou Karate Zeon 0.5ml/L (rotation obligatoire entre familles)";
            }
            if ($humidite > 85 && $pluie > 0) {
                $alertes[] = "Mildiou (Peronospora destructor) : humidité>85% + pluie = risque élevé. Traitement préventif Mancozèbe 80% 2.5g/L toutes les 7-10j. Eviter arrosage en soirée";
            }
            if (in_array($stadeNom, ['Verse des feuilles', 'Maturation']) && $humidite > 70) {
                $alertes[] = "Botrytis (pourriture col) : humidité>70% au stade verse = risque élevé. Traitement: Iprodione 500 SC 1.5ml/L dès 5% plants atteints. Eviter apports hydriques tardifs";
            }
        }

        if ($type === 'tomate') {
            if ($temp > 28) {
                $alertes[] = "Tuta absoluta : T°>28°C accélère le cycle (24-38j). Surveiller galeries. Traitement : Spinosad 0.4ml/L, Emamectine 0.4g/L en rotation. Pièges phéromones";
            }
            if ($temp > 30 && $humidite < 60) {
                $alertes[] = "Bemisia tabaci (mouche blanche) : T°>30°C + humidité<60% = conditions idéales. Seuil : 5 adultes/feuille. Imidaclopride 0.2g/L (vecteur TYLCV)";
            }
            if ($humidite > 85 && $pluie > 3) {
                $alertes[] = "Mildiou tardif (Phytophthora) : humidité>85% + pluie = risque élevé. Ridomil Gold MZ 2.5g/L immédiatement";
            }
        }

        if ($type === 'riz') {
            if ($temp >= 25 && $temp <= 28 && $humidite > 85) {
                $alertes[] = "Pyriculariose (blast) : T°25-28°C + humidité>85% = conditions optimales. Tricyclazole 0.6g/L (foliaire) ou Isoprothiolane 1.5ml/L (préventif avant épiaison)";
            }
            if (in_array($stadeNom, ['Tallage actif', 'Épiaison', 'Floraison'])) {
                $alertes[] = "Foreur des tiges : surveiller 'dead heart' (tallage) et 'white ear' (épiaison). Chlorpyrifos 480 EC 1ml/L si >10% tiges atteintes";
            }
        }

        // Alertes communes cucurbitacées (source: CDH/ISRA Cambérène)
        if (in_array($type, ['pasteque', 'melon', 'concombre', 'courgette'])) {
            if ($temp > 25) {
                $alertes[] = "Mouches des cucurbitacées : T°>25°C favorable. Jeunes fruits piqués → asticots. Entourer fruits de sachets. Traitement : Diméthoate 40 EC 1.5ml/L ou Malathion";
            }
            if ($temp < 28 && $humidite < 50) {
                $alertes[] = "Thrips : conditions sèches T°<28°C + humidité<50% = risque (déformation bourgeons terminaux). Traitement : Diméthoate ou Acéphate";
            }
        }

        if (in_array($type, ['melon', 'concombre']) && $humidite > 80 && $pluie > 2) {
            $alertes[] = "Mildiou cucurbitacées : humidité>80% + pluie = duvet gris-violacé face inférieure feuilles. Traitement préventif : Chlorothalonil + Manèbe ou Métalaxyl";
        }

        if (in_array($type, ['courgette', 'concombre']) && $humidite < 60 && $temp > 28) {
            $alertes[] = "Le Blanc (oïdium) : temps chaud et sec (T°>28°C, humidité<60%) = taches blanches poudreuses feuilles/tiges. Traitement : Soufre 80% 3g/L ou Triadimefon";
        }

        if ($type === 'fraisier') {
            if ($temp > 28 && $humidite < 50) {
                $alertes[] = "Araignée rouge : T°>28°C + humidité<50% = infestation rapide. Points décolorés sur feuilles. Traitement : Fenbutaxin oxyde ou Bromopropylate";
            }
            if ($temp > 25 && $humidite > 70 && $pluie > 0) {
                $alertes[] = "Pourriture des racines : chaud+humide = champignons du sol. Traitement : Benomyl au collet tous les 15 jours si symptômes (flétrissement)";
            }
        }

        return $alertes ? implode("\n\n", $alertes) : null;
    }
}

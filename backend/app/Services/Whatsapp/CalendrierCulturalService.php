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
        $j = $info['j_culture'];
        if (abs($j - $stade['j_debut']) <= 2) {
            $slug = strtolower(str_replace([' ', "'", '/', '-'], '_', $stade['nom']));
            return "{$culture->type_culture}_{$slug}";
        }

        return null;
    }

    private function getStades(string $type): ?array
    {
        return match ($type) {
            'oignon' => $this->stadesOignon(),
            'tomate' => $this->stadesTomate(),
            'riz'    => $this->stadesRiz(),
            default  => null,
        };
    }

    private function stadesOignon(): array
    {
        return [
            ['nom' => 'Reprise',             'j_debut' => 0,   'j_fin' => 10,  'alerte' => 'Arrosage quotidien, surveiller fonte de semis (Pythium)'],
            ['nom' => '2 feuilles',           'j_debut' => 11,  'j_fin' => 20,  'alerte' => 'Sarclage léger, surveiller Pythium en sol saturé'],
            ['nom' => '4-6 feuilles',         'j_debut' => 21,  'j_fin' => 50,  'alerte' => 'Fertilisation N1 (urée), herbicide si adventices'],
            ['nom' => 'Initiation bulbaire',  'j_debut' => 51,  'j_fin' => 65,  'alerte' => "Apport K1, espacer arrosage — STOP azote à partir d'ici"],
            ['nom' => 'Grossissement bulbe',  'j_debut' => 66,  'j_fin' => 105, 'alerte' => 'Fertilisation K2, réduction arrosage progressive, AUCUN azote'],
            ['nom' => 'Verse des feuilles',   'j_debut' => 90,  'j_fin' => 115, 'alerte' => 'Arrêt progressif des apports hydriques'],
            ['nom' => 'Maturation',           'j_debut' => 105, 'j_fin' => 120, 'alerte' => 'Arrêt arrosage J+110, surveiller Botrytis sur col'],
            ['nom' => 'Récolte',              'j_debut' => 115, 'j_fin' => 999, 'alerte' => 'Récolter le matin, pré-ressuyage 3-5j au champ'],
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

    private function getFertilisationStade(string $type, string $stadeNom, float $surface): ?string
    {
        $plans = [
            'oignon' => [
                '4-6 feuilles'        => "Urée 46% : " . round(50 * $surface) . " kg (50 kg/ha) — Apport N1",
                'Initiation bulbaire' => "Sulfate de potasse 50% K₂O : " . round(60 * $surface) . " kg (60 kg/ha) — Apport K1\n⚠️ DERNIER apport azoté possible",
                'Grossissement bulbe' => "Sulfate de potasse 50% K₂O : " . round(40 * $surface) . " kg (40 kg/ha) — Apport K2\nZéro azote désormais",
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
        ];

        return $plans[$type][$stadeNom] ?? null;
    }

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

        $kcMap = [
            'oignon' => [
                'Reprise'             => 0.50,
                '2 feuilles'          => 0.65,
                '4-6 feuilles'        => 0.75,
                'Initiation bulbaire' => 1.05,
                'Grossissement bulbe' => 0.90,
                'Verse des feuilles'  => 0.80,
                'Maturation'          => 0.70,
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
            if ($temp < 25 && $humidite < 45) {
                $alertes[] = "Thrips tabaci : T°<25°C + humidité<45% = conditions favorables. Seuil : 2 thrips/feuille. Traitement : Spinosad 480 SC 0.1ml/L (ou Karate 0.5ml/L, rotation obligatoire)";
            }
            if ($humidite > 85 && $pluie > 0) {
                $alertes[] = "Mildiou (Peronospora) : humidité>85% + pluie = risque élevé. Traitement préventif Mancozèbe 80% 2.5g/L toutes les 7-10j";
            }
            if (in_array($stadeNom, ['Verse des feuilles', 'Maturation']) && $humidite > 70) {
                $alertes[] = "Botrytis (pourriture col) : humidité>70% au stade verse = risque. Traitement : Iprodione 500 SC 1.5ml/L dès 5% plants atteints";
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

        return $alertes ? implode("\n\n", $alertes) : null;
    }
}

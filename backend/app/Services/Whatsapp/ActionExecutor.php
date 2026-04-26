<?php

namespace App\Services\Whatsapp;

use App\Models\AlerteCulturale;
use App\Models\Culture;
use App\Models\Depense;
use App\Models\Stock;
use App\Models\TraitementApplique;
use App\Models\WhatsappUser;
use App\Services\Finance\FinanceService;
use App\Services\Meteo\MeteoService;
use App\Services\Stock\StockService;
use App\Services\Vente\VenteService;
use App\Services\Whatsapp\CalendrierCulturalService;

class ActionExecutor
{
    public function __construct(
        private VenteService              $venteService,
        private StockService              $stockService,
        private FinanceService            $financeService,
        private CalendrierCulturalService $calendrierService,
        private MeteoService              $meteoService,
    ) {}

    public function execute(string $intent, array $params, WhatsappUser $waUser, string $language = 'fr'): array
    {
        return match ($intent) {
            'ADD_DEPENSE'          => $this->addDepense($params, $waUser, $language),
            'ADD_VENTE'            => $this->addVente($params, $waUser, $language),
            'ADD_MOUVEMENT_STOCK'  => $this->addMouvementStock($params, $waUser, $language),
            'QUERY_FINANCES'       => $this->queryFinances($params, $waUser, $language),
            'QUERY_STOCK'          => $this->queryStock($waUser, $language),
            'QUERY_DEPENSES'       => $this->queryDepenses($params, $waUser, $language),
            'QUERY_VENTES'         => $this->queryVentes($params, $waUser, $language),
            'CALENDRIER_CULTURAL'  => $this->getCalendrierCultural($params, $waUser, $language),
            'SIGNALER_TRAITEMENT'  => $this->signalerTraitement($params, $waUser, $language),
            default                => ['response' => $language === 'wo'
                ? "Bëgguma xam looy wax. Jëfandikoo ci kanam."
                : "Action non reconnue. Réessayez."],
        };
    }

    private function addDepense(array $params, WhatsappUser $waUser, string $language): array
    {
        $depense = Depense::create([
            'organisation_id' => $waUser->organisation_id,
            'user_id'         => $waUser->user_id,
            'champ_id'        => null,
            'campagne_id'     => $params['campagne_id'] ?? null,
            'categorie'       => $params['categorie'],
            'description'     => $params['description'] ?? 'Via WhatsApp',
            'montant_fcfa'    => $params['montant_fcfa'],
            'date_depense'    => $params['date_depense'] ?? now()->toDateString(),
        ]);

        $montantFormate = number_format($depense->montant_fcfa, 0, ',', ' ');

        return ['response' => $language === 'wo'
            ? "✅ Dëkkal xaalis bi dafa doxe! {$montantFormate} FCFA ci {$depense->categorie}."
            : "✅ Dépense enregistrée ! {$montantFormate} FCFA ({$depense->categorie}) le {$depense->date_depense}."];
    }

    private function addVente(array $params, WhatsappUser $waUser, string $language): array
    {
        $culture   = null;
        $cultureId = null;
        if (! empty($params['culture_nom'])) {
            $culture   = Culture::where('organisation_id', $waUser->organisation_id)
                ->where('nom', 'like', '%' . $params['culture_nom'] . '%')
                ->first();
            $cultureId = $culture?->id;
        }

        $vente = $this->venteService->creer([
            'organisation_id'    => $waUser->organisation_id,
            'user_id'            => $waUser->user_id,
            'culture_id'         => $cultureId,
            'champ_id'           => $culture?->champ_id ?? null,
            'campagne_id'        => $params['campagne_id'] ?? null,
            'produit'            => $params['produit'] ?? ($params['culture_nom'] ?? 'Vente'),
            'quantite_kg'        => $params['quantite_kg'],
            'prix_unitaire_fcfa' => $params['prix_unitaire_fcfa'],
            'date_vente'         => $params['date_vente'] ?? now()->toDateString(),
        ]);

        $montantFormate = number_format($vente->montant_total_fcfa, 0, ',', ' ');

        return ['response' => $language === 'wo'
            ? "✅ Jaay bi dafa doxe! {$montantFormate} FCFA."
            : "✅ Vente enregistrée ! {$montantFormate} FCFA ({$vente->produit})."];
    }

    private function addMouvementStock(array $params, WhatsappUser $waUser, string $language): array
    {
        $stock = Stock::where('organisation_id', $waUser->organisation_id)
            ->where('nom', 'like', '%' . ($params['stock_nom'] ?? '') . '%')
            ->where('est_actif', true)
            ->first();

        if (! $stock) {
            return ['response' => $language === 'wo'
                ? "Amul stock bi. Dëgg na nom yi ci app bi."
                : "Stock introuvable. Vérifiez le nom dans l'application."];
        }

        $this->stockService->enregistrerMouvement($stock, [
            'type'           => $params['type'] ?? 'utilisation',
            'quantite'       => $params['quantite'],
            'date_mouvement' => $params['date_mouvement'] ?? now()->toDateString(),
            'notes'          => 'Via WhatsApp',
        ]);

        $stock->refresh();

        return ['response' => $language === 'wo'
            ? "✅ Stock bi dafa yëgël. {$stock->nom} : {$stock->quantite_actuelle} {$stock->unite} bu des."
            : "✅ Mouvement enregistré ! {$stock->nom} : {$stock->quantite_actuelle} {$stock->unite} restants."];
    }

    private function queryFinances(array $params, WhatsappUser $waUser, string $language): array
    {
        $filters  = $this->periodToFilters($params['periode'] ?? 'month');
        $resume   = $this->financeService->getResume($waUser->organisation_id, $filters);

        $ventes   = number_format($resume['total_ventes'], 0, ',', ' ');
        $depenses = number_format($resume['total_depenses'], 0, ',', ' ');
        $solde    = number_format(abs($resume['solde_net']), 0, ',', ' ');
        $signe    = $resume['solde_net'] >= 0 ? '+' : '-';

        return ['response' => $language === 'wo'
            ? "📊 Finances ci weer bi:\n💰 Jaay: {$ventes} FCFA\n💸 Dëkkal: {$depenses} FCFA\n📈 Solde: {$signe}{$solde} FCFA"
            : "📊 Finances du mois:\n💰 Ventes: {$ventes} FCFA\n💸 Dépenses: {$depenses} FCFA\n📈 Solde: {$signe}{$solde} FCFA"];
    }

    private function queryStock(WhatsappUser $waUser, string $language): array
    {
        $stocks = Stock::where('organisation_id', $waUser->organisation_id)
            ->where('est_actif', true)
            ->orderBy('nom')
            ->limit(10)
            ->get(['nom', 'quantite_actuelle', 'unite']);

        if ($stocks->isEmpty()) {
            return ['response' => $language === 'wo' ? "Amul stock yi enregistré." : "Aucun stock enregistré."];
        }

        $lines = $stocks->map(fn($s) => "• {$s->nom}: {$s->quantite_actuelle} {$s->unite}")->join("\n");

        return ['response' => "📦 " . ($language === 'wo' ? "Tëralef yi:" : "Stocks disponibles:") . "\n{$lines}"];
    }

    private function queryDepenses(array $params, WhatsappUser $waUser, string $language): array
    {
        $filters  = $this->periodToFilters($params['periode'] ?? 'month');
        $depenses = Depense::where('organisation_id', $waUser->organisation_id)
            ->where('categorie', '!=', 'financement_individuel')
            ->when(isset($filters['date_debut']), fn($q) => $q->where('date_depense', '>=', $filters['date_debut']))
            ->when(isset($filters['date_fin']),   fn($q) => $q->where('date_depense', '<=', $filters['date_fin']))
            ->orderByDesc('date_depense')
            ->limit(5)
            ->get(['description', 'montant_fcfa', 'date_depense']);

        if ($depenses->isEmpty()) {
            return ['response' => $language === 'wo' ? "Amul dëkkal xaalis." : "Aucune dépense sur la période."];
        }

        $lines = $depenses->map(fn($d) => "• " . number_format($d->montant_fcfa, 0, ',', ' ') . " FCFA — {$d->description} ({$d->date_depense})")->join("\n");
        $total = number_format($depenses->sum('montant_fcfa'), 0, ',', ' ');

        return ['response' => "💸 " . ($language === 'wo' ? "Dëkkal xaalis (5 yi mujj):" : "Dernières dépenses:") . "\n{$lines}\n\nTotal: {$total} FCFA"];
    }

    private function queryVentes(array $params, WhatsappUser $waUser, string $language): array
    {
        $filters = $this->periodToFilters($params['periode'] ?? 'month');
        $ventes  = \App\Models\Vente::where('organisation_id', $waUser->organisation_id)
            ->where(fn($q) => $q->where('est_auto_generee', false)->orWhereNull('est_auto_generee'))
            ->when(isset($filters['date_debut']), fn($q) => $q->where('date_vente', '>=', $filters['date_debut']))
            ->when(isset($filters['date_fin']),   fn($q) => $q->where('date_vente', '<=', $filters['date_fin']))
            ->orderByDesc('date_vente')
            ->limit(5)
            ->get(['produit', 'montant_total_fcfa', 'date_vente']);

        if ($ventes->isEmpty()) {
            return ['response' => $language === 'wo' ? "Amul jaay." : "Aucune vente sur la période."];
        }

        $lines = $ventes->map(fn($v) => "• " . number_format($v->montant_total_fcfa, 0, ',', ' ') . " FCFA — {$v->produit} ({$v->date_vente})")->join("\n");
        $total = number_format($ventes->sum('montant_total_fcfa'), 0, ',', ' ');

        return ['response' => "🌾 " . ($language === 'wo' ? "Jaay yi (5 yi mujj):" : "Dernières ventes:") . "\n{$lines}\n\nTotal: {$total} FCFA"];
    }

    private function getCalendrierCultural(array $params, WhatsappUser $waUser, string $language): array
    {
        $cultures = Culture::where('organisation_id', $waUser->organisation_id)
            ->where('statut', 'en_cours')
            ->whereNotNull('type_culture')
            ->whereNotNull('date_semis')
            ->with('champ')
            ->get();

        if ($cultures->isEmpty()) {
            return ['response' => $language === 'wo'
                ? "Amul culture bu xeex bu amoon type ak date yu semis. Dëkk bi ci app bi."
                : "Aucune culture active avec type et date de semis renseignés. Complétez l'application."];
        }

        $culture = null;
        if (! empty($params['culture_nom'])) {
            $culture = $cultures->first(fn ($c) =>
                str_contains(strtolower($c->nom), strtolower($params['culture_nom']))
                || str_contains(strtolower($c->type_culture ?? ''), strtolower($params['culture_nom']))
            );
        }
        $culture ??= $cultures->first();

        $champ   = $culture->champ;
        $meteo   = $this->meteoService->getMeteo($champ?->zone_meteo, $champ?->latitude, $champ?->longitude);
        $systeme = $waUser->systeme_arrosage ?? 'aspersion';

        $message = $this->calendrierService->getConseils($culture, $meteo, $systeme, $language);

        return ['response' => $message];
    }

    private function signalerTraitement(array $params, WhatsappUser $waUser, string $language): array
    {
        $culture = Culture::where('organisation_id', $waUser->organisation_id)
            ->where('statut', 'en_cours')
            ->orderByDesc('date_semis')
            ->first();

        if (! $culture) {
            return ['response' => $language === 'wo'
                ? "Amul culture bu xeex."
                : "Aucune culture active pour enregistrer le traitement."];
        }

        $rotationAlert = null;
        if (! empty($params['matiere_active'])) {
            $nbRecents = TraitementApplique::where('culture_id', $culture->id)
                ->where('matiere_active', $params['matiere_active'])
                ->where('date_application', '>=', now()->subDays(30)->toDateString())
                ->count();

            if ($nbRecents >= 2) {
                $alt = $this->getAlternatives($params['matiere_active']);
                $rotationAlert = $language === 'wo'
                    ? "\n\n⚠️ {$nbRecents}em naat ni jëfandikoo {$params['matiere_active']}. Soppi famille chimique: {$alt}"
                    : "\n\n⚠️ {$nbRecents}ème application de {$params['matiere_active']} ce mois. Risque résistance — alternez avec : {$alt}";
            }
        }

        TraitementApplique::create([
            'culture_id'       => $culture->id,
            'organisation_id'  => $waUser->organisation_id,
            'user_id'          => $waUser->user_id,
            'produit'          => $params['produit'],
            'matiere_active'   => $params['matiere_active'] ?? null,
            'dose'             => $params['dose'] ?? null,
            'date_application' => $params['date_application'] ?? now()->toDateString(),
            'source'           => 'whatsapp',
        ]);

        $msg = $language === 'wo'
            ? "✅ Traitement bui doxe! {$params['produit']}" . ($params['dose'] ? " ({$params['dose']})" : '')
            : "✅ Traitement enregistré ! {$params['produit']}" . ($params['dose'] ? " ({$params['dose']})" : '') . " le " . ($params['date_application'] ?? now()->toDateString()) . ".";

        return ['response' => $msg . ($rotationAlert ?? '')];
    }

    private function getAlternatives(string $matiereActive): string
    {
        $rotations = [
            'spinosad'      => 'Lambda-cyhalothrine ou Imidaclopride',
            'mancozebe'     => 'Métalaxyl-M (Ridomil) ou Chlorothalonil',
            'imidaclopride' => 'Spinosad ou Thiamethoxam',
            'tricyclazole'  => 'Propiconazole ou Isoprothiolane',
            'lambda'        => 'Spinosad ou Emamectine benzoate',
            'metalaxyl'     => 'Mancozèbe ou Chlorothalonil',
            'abamectine'    => 'Spiromesifen ou Bifenazate',
        ];

        $ma = strtolower($matiereActive);
        foreach ($rotations as $keyword => $alternative) {
            if (str_contains($ma, $keyword)) {
                return $alternative;
            }
        }

        return "un produit d'une famille chimique différente";
    }

    private function periodToFilters(string $periode): array
    {
        return match ($periode) {
            'today' => ['date_debut' => now()->toDateString(), 'date_fin' => now()->toDateString()],
            'week'  => ['date_debut' => now()->startOfWeek()->toDateString(), 'date_fin' => now()->endOfWeek()->toDateString()],
            'all'   => [],
            default => ['date_debut' => now()->startOfMonth()->toDateString(), 'date_fin' => now()->endOfMonth()->toDateString()],
        };
    }
}

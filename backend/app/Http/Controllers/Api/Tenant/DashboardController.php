<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Champ;
use App\Models\Culture;
use App\Models\Depense;
use App\Models\Employe;
use App\Models\Notification;
use App\Models\Stock;
use App\Models\Tache;
use App\Models\Vente;
use App\Services\Finance\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function __construct(private FinanceService $financeService) {}

    public function kpis(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $campagne = app('tenant')?->campagneCourante();
        $campagneId = $campagne?->id;

        $cacheKey = "dashboard_kpis_{$orgId}";

        $data = Cache::remember($cacheKey, 60, function () use ($orgId) {
            $finance = $this->financeService->getResume($orgId, []);

            return [
                'total_ventes' => $finance['total_ventes'],
                'total_depenses' => $finance['total_depenses'],
                'solde_net' => $finance['solde_net'],
                'nb_champs' => Champ::where('organisation_id', $orgId)->where('est_actif', true)->count(),
                'nb_cultures_actives' => Culture::where('organisation_id', $orgId)->where('statut', 'en_cours')->count(),
                'nb_employes' => Employe::where('organisation_id', $orgId)->where('est_actif', true)->count(),
                'nb_alertes_stock' => Stock::where('organisation_id', $orgId)
                    ->where('est_actif', true)
                    ->whereNotNull('seuil_alerte')
                    ->whereRaw('quantite_actuelle <= seuil_alerte')
                    ->count(),
            ];
        });

        return response()->json($data);
    }

    public function depensesRecentes(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $depenses = Depense::where('organisation_id', $orgId)
            ->where('categorie', '!=', 'financement_individuel')
            ->with(['champ:id,nom', 'user:id,nom'])
            ->orderByDesc('date_depense')
            ->limit(5)
            ->get();

        return response()->json($depenses);
    }

    public function ventesRecentes(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $ventes = Vente::where('organisation_id', $orgId)
            ->where(fn($q) => $q->where('est_auto_generee', false)->orWhereNull('est_auto_generee'))
            ->with(['champ:id,nom', 'culture:id,nom'])
            ->orderByDesc('date_vente')
            ->limit(5)
            ->get();

        return response()->json($ventes);
    }

    public function stocksAlertes(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $stocks = Stock::where('organisation_id', $orgId)
            ->where('est_actif', true)
            ->whereNotNull('seuil_alerte')
            ->whereRaw('quantite_actuelle <= seuil_alerte')
            ->orderBy('quantite_actuelle')
            ->limit(10)
            ->get();

        return response()->json($stocks);
    }

    public function tachesEnCours(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $taches = Tache::where('organisation_id', $orgId)
            ->whereIn('statut', ['a_faire', 'en_cours'])
            ->with(['employe:id,nom', 'champ:id,nom'])
            ->orderByRaw("CASE WHEN priorite = 'urgente' THEN 1 WHEN priorite = 'haute' THEN 2 WHEN priorite = 'normale' THEN 3 WHEN priorite = 'basse' THEN 4 ELSE 5 END")
            ->orderBy('date_debut')
            ->limit(10)
            ->get();

        return response()->json($taches);
    }

    public function graphiqueFinance(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $data = $this->financeService->getGraphiqueFinance($orgId, null);
        return response()->json($data);
    }

    public function graphiqueDepensesCategories(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $data = $this->financeService->getDepensesParCategorie($orgId, null);
        return response()->json($data);
    }

    public function tout(Request $request): JsonResponse
    {
        $orgId    = $request->user()->organisation_id;
        $cacheKey = "dashboard_tout_{$orgId}";

        $data = Cache::remember($cacheKey, 120, function () use ($orgId) {
            $finance = $this->financeService->getResume($orgId, []);

            $kpis = [
                'total_ventes'        => $finance['total_ventes'],
                'total_depenses'      => $finance['total_depenses'],
                'solde_net'           => $finance['solde_net'],
                'nb_champs'           => Champ::where('organisation_id', $orgId)->where('est_actif', true)->count(),
                'nb_cultures_actives' => Culture::where('organisation_id', $orgId)->where('statut', 'en_cours')->count(),
                'nb_employes'         => Employe::where('organisation_id', $orgId)->where('est_actif', true)->count(),
                'nb_alertes_stock'    => Stock::where('organisation_id', $orgId)->where('est_actif', true)
                    ->whereNotNull('seuil_alerte')->whereRaw('quantite_actuelle <= seuil_alerte')->count(),
            ];

            $ventesRecentes   = Vente::where('organisation_id', $orgId)
                ->where(fn($q) => $q->where('est_auto_generee', false)->orWhereNull('est_auto_generee'))
                ->with(['champ:id,nom', 'culture:id,nom'])
                ->orderByDesc('date_vente')->limit(5)->get();

            $depensesRecentes = Depense::where('organisation_id', $orgId)
                ->where('categorie', '!=', 'financement_individuel')
                ->with(['champ:id,nom', 'user:id,nom'])
                ->orderByDesc('date_depense')->limit(5)->get();

            $stocksAlertes = Stock::where('organisation_id', $orgId)
                ->where('est_actif', true)->whereNotNull('seuil_alerte')
                ->whereRaw('quantite_actuelle <= seuil_alerte')
                ->orderBy('quantite_actuelle')->limit(10)->get();

            $tachesEnCours = Tache::where('organisation_id', $orgId)
                ->whereIn('statut', ['a_faire', 'en_cours'])
                ->with(['employe:id,nom', 'champ:id,nom'])
                ->orderByRaw("CASE WHEN priorite = 'urgente' THEN 1 WHEN priorite = 'haute' THEN 2 WHEN priorite = 'normale' THEN 3 WHEN priorite = 'basse' THEN 4 ELSE 5 END")
                ->orderBy('date_debut')->limit(10)->get();

            $graphiqueFinance  = $this->financeService->getGraphiqueFinance($orgId, null);
            $graphiqueDepenses = $this->financeService->getDepensesParCategorie($orgId, null);

            return compact(
                'kpis', 'ventesRecentes', 'depensesRecentes',
                'stocksAlertes', 'tachesEnCours',
                'graphiqueFinance', 'graphiqueDepenses'
            );
        });

        return response()->json($data);
    }
}

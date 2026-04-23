<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Champ;
use App\Models\Depense;
use App\Services\Finance\FinanceService;
use App\Services\Finance\RapportExcelService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private RapportExcelService $rapportExcelService
    ) {}

    public function resume(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $filters = $request->only(['date_debut', 'date_fin', 'campagne_id', 'champ_id']);

        if (empty($filters)) {
            $campagne = app('tenant')?->campagneCourante();
            if ($campagne) {
                $filters['campagne_id'] = $campagne->id;
            }
        }

        return response()->json($this->financeService->getResume($orgId, $filters));
    }

    public function parChamp(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $filters = $request->only(['date_debut', 'date_fin', 'campagne_id']);

        $data = $this->financeService->getParChamp($orgId, $filters);

        return response()->json($data);
    }

    public function parCulture(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $filters = $request->only(['date_debut', 'date_fin', 'campagne_id']);

        return response()->json($this->financeService->getParCulture($orgId, $filters));
    }

    public function comparaison(Request $request): JsonResponse
    {
        $request->validate([
            'campagne1_id' => 'required|exists:campagnes_agricoles,id',
            'campagne2_id' => 'required|exists:campagnes_agricoles,id',
        ]);

        $orgId = $request->user()->organisation_id;

        return response()->json(
            $this->financeService->getComparaison($orgId, $request->campagne1_id, $request->campagne2_id)
        );
    }

    public function rentabiliteCulture(Request $request, int $id): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        return response()->json($this->financeService->getRentabiliteCulture($orgId, $id));
    }

    public function exportExcel(Request $request)
    {
        $organisation = $request->user()->organisation;
        $filters = array_filter($request->only(['date_debut', 'date_fin', 'campagne_id']));

        return $this->rapportExcelService->generer($organisation, $filters);
    }

    public function rapportPdf(Request $request)
    {
        $organisation = $request->user()->organisation;
        $orgId        = $organisation->id;
        $filters      = array_filter($request->only(['date_debut', 'date_fin', 'campagne_id']));

        $resume = $this->financeService->getResume($orgId, $filters);

        // Par champ avec noms
        $parChampRaw = $this->financeService->getParChamp($orgId, $filters);
        $champIds    = array_column($parChampRaw, 'champ_id');
        $champsMap   = Champ::whereIn('id', $champIds)->pluck('nom', 'id');
        $parChamp    = array_map(fn($c) => array_merge($c, ['nom' => $champsMap[$c['champ_id']] ?? null]), $parChampRaw);

        // Dépenses par catégorie
        $categories = [
            'intrant' => 'Intrant', 'salaire' => 'Salaire', 'materiel' => 'Matériel',
            'carburant' => 'Carburant', 'main_oeuvre' => "Main-d'œuvre",
            'traitement_phytosanitaire' => 'Traitement phytosanitaire', 'transport' => 'Transport',
            'irrigation' => 'Irrigation', 'entretien_materiel' => 'Entretien matériel',
            'alimentation_betail' => 'Alimentation bétail', 'frais_recolte' => 'Frais de récolte',
            'financement_individuel' => 'Financement individuel', 'autre' => 'Autre',
        ];
        $depensesParCategorie = Depense::where('organisation_id', $orgId)
            ->where('categorie', '!=', 'financement_individuel')
            ->when(!empty($filters['date_debut']),   fn($q) => $q->where('date_depense', '>=', $filters['date_debut']))
            ->when(!empty($filters['date_fin']),     fn($q) => $q->where('date_depense', '<=', $filters['date_fin']))
            ->when(!empty($filters['campagne_id']),  fn($q) => $q->where('campagne_id', $filters['campagne_id']))
            ->selectRaw('categorie, SUM(montant_fcfa) as total')
            ->groupBy('categorie')->orderByDesc('total')->get()
            ->map(fn($d) => ['categorie' => $d->categorie, 'label' => $categories[$d->categorie] ?? $d->categorie, 'total' => (float) $d->total])
            ->toArray();

        $periode = isset($filters['date_debut'], $filters['date_fin'])
            ? "{$filters['date_debut']} → {$filters['date_fin']}"
            : '— Toutes périodes';

        $pdf = Pdf::loadView('pdf.rapport-finance', compact('organisation', 'resume', 'parChamp', 'depensesParCategorie', 'periode'))
            ->setPaper('a4', 'portrait');

        $nom = "rapport-finance-{$organisation->slug}-" . now()->format('Y-m-d') . '.pdf';

        return $pdf->download($nom);
    }
}

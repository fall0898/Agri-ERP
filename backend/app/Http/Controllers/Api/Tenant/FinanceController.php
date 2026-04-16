<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\Finance\FinanceService;
use App\Services\Finance\RapportExcelService;
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
        $orgId = $request->user()->organisation_id;
        $organisation = $request->user()->organisation;
        $filters = $request->only(['date_debut', 'date_fin', 'campagne_id']);

        return $this->rapportExcelService->generer($organisation, $filters);
    }
}

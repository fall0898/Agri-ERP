<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\Abonnement\PlanStrategies\PlanStrategyFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParametresController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $org = $request->user()->organisation;
        $strategy = PlanStrategyFactory::make($org);

        return response()->json([
            'organisation' => $org,
            'plan_effectif' => $org->getPlanEffectif(),
            'limites' => [
                'max_champs' => $strategy->getMaxChamps(),
                'max_users' => $strategy->getMaxUsers(),
                'max_cultures' => $strategy->getMaxCultures(),
                'max_storage_mb' => $strategy->getMaxStorageMb(),
                'export_excel' => $strategy->canExportExcel(),
                'import_csv' => $strategy->canImportCsv(),
                'meteo' => $strategy->canAccessMeteo(),
                'sms_whatsapp' => $strategy->canSendSmsWhatsapp(),
                'comparaison_n1' => $strategy->canCompareN1(),
                'rentabilite_culture' => $strategy->canViewRentabiliteCulture(),
            ],
            'usage' => [
                'nb_champs' => $org->champs()->count(),
                'nb_users' => $org->users()->count(),
                'nb_cultures' => $org->cultures()->count(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $org = $request->user()->organisation;

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:200',
            'telephone' => 'nullable|string|max:20',
            'devise' => 'sometimes|string|max:5',
            'campagne_debut_mois' => 'sometimes|integer|between:1,12',
            'campagne_debut_jour' => 'sometimes|integer|between:1,28',
            'parametres' => 'nullable|array',
        ]);

        $org->update($validated);

        return response()->json($org->fresh());
    }

    public function updatePreferencesNotification(Request $request): JsonResponse
    {
        $request->validate([
            'preferences_notification' => 'required|array',
        ]);

        $request->user()->update([
            'preferences_notification' => $request->preferences_notification,
        ]);

        return response()->json([
            'message' => 'Préférences de notification mises à jour.',
            'preferences_notification' => $request->preferences_notification,
        ]);
    }
}

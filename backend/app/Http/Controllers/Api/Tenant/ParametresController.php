<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\WhatsappUser;
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

    public function linkWhatsapp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'regex:/^\+\d{10,15}$/'],
        ]);

        $user = $request->user();

        // Supprimer l'ancien lien s'il existe pour cet utilisateur
        WhatsappUser::where('user_id', $user->id)->delete();

        // Vérifier que ce numéro n'est pas déjà pris par un autre utilisateur
        if (WhatsappUser::where('phone_number', $validated['phone_number'])->exists()) {
            return response()->json(['message' => 'Ce numéro est déjà lié à un autre compte.'], 422);
        }

        $waUser = WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $user->organisation_id,
            'phone_number'    => $validated['phone_number'],
            'est_actif'       => true,
        ]);

        return response()->json([
            'message'      => 'Numéro WhatsApp lié avec succès.',
            'phone_number' => $waUser->phone_number,
        ]);
    }

    public function unlinkWhatsapp(Request $request): JsonResponse
    {
        WhatsappUser::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Numéro WhatsApp délié.']);
    }

    public function whatsappStatus(Request $request): JsonResponse
    {
        $waUser = WhatsappUser::where('user_id', $request->user()->id)->first();
        return response()->json([
            'linked'       => $waUser !== null,
            'phone_number' => $waUser?->phone_number,
            'bot_number'   => config('whatsapp.twilio_from'),
        ]);
    }
}

<?php
namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AlerteCulturale;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsappAdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $users = User::where('organisation_id', $orgId)
            ->with('whatsappUser')
            ->orderBy('nom')
            ->get()
            ->map(fn ($u) => [
                'id'                      => $u->id,
                'nom'                     => $u->nom,
                'email'                   => $u->email,
                'role'                    => $u->role,
                'alertes_whatsapp_actives' => $u->alertes_whatsapp_actives,
                'whatsapp_lie'            => $u->whatsappUser !== null,
                'phone_number'            => $u->whatsappUser?->phone_number,
                'langue'                  => $u->whatsappUser?->langue,
                'systeme_arrosage'        => $u->whatsappUser?->systeme_arrosage,
                'onboarde'                => $u->whatsappUser?->onboarded_at !== null,
            ]);

        $alertes = AlerteCulturale::query()
            ->with('culture:id,nom,type_culture')
            ->whereHas('culture', fn ($q) => $q->where('organisation_id', $orgId))
            ->orderByDesc('sent_at')
            ->limit(50)
            ->get(['id', 'culture_id', 'user_id', 'type', 'sent_at']);

        return response()->json(['users' => $users, 'alertes' => $alertes]);
    }

    public function toggleAlertes(Request $request, int $userId): JsonResponse
    {
        $request->validate(['alertes_whatsapp_actives' => 'required|boolean']);

        $user = User::where('id', $userId)
            ->where('organisation_id', $request->user()->organisation_id)
            ->firstOrFail();

        $user->update(['alertes_whatsapp_actives' => $request->boolean('alertes_whatsapp_actives')]);

        return response()->json(['alertes_whatsapp_actives' => $user->alertes_whatsapp_actives]);
    }
}

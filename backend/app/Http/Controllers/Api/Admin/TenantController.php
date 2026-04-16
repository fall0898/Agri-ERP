<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenants = Organisation::withTrashed()
            ->with(['users' => fn($q) => $q->where('role', 'admin')->select('id', 'organisation_id', 'nom', 'email')])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($tenants);
    }

    public function show(int $id): JsonResponse
    {
        $tenant = Organisation::withTrashed()
            ->with(['users', 'campagnes'])
            ->findOrFail($id);

        return response()->json(array_merge($tenant->toArray(), [
            'stats' => [
                'nb_champs' => $tenant->champs()->count(),
                'nb_cultures' => $tenant->cultures()->count(),
                'nb_employes' => $tenant->employes()->count(),
                'total_ventes' => $tenant->ventes()->sum('montant_total_fcfa'),
                'total_depenses' => $tenant->depenses()->sum('montant_fcfa'),
            ],
        ]));
    }

    public function toggleActif(int $id): JsonResponse
    {
        $tenant = Organisation::findOrFail($id);
        $tenant->update(['est_active' => !$tenant->est_active]);

        return response()->json([
            'message' => $tenant->est_active ? 'Organisation activée.' : 'Organisation désactivée.',
            'organisation' => $tenant,
        ]);
    }
}

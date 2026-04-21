<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 200);

        $tenants = Organisation::with(['users' => fn($q) => $q->where('role', 'admin')->select('id', 'organisation_id', 'nom', 'email')])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($tenants);
    }

    public function show(int $id): JsonResponse
    {
        $tenant = Organisation::withTrashed()
            ->with(['users', 'campagnes'])
            ->findOrFail($id);

        return response()->json(array_merge($tenant->toArray(), [
            'stats' => [
                'nb_champs'       => $tenant->champs()->count(),
                'nb_cultures'     => $tenant->cultures()->count(),
                'nb_employes'     => $tenant->employes()->count(),
                'total_ventes'    => $tenant->ventes()->sum('montant_total_fcfa'),
                'total_depenses'  => $tenant->depenses()->sum('montant_fcfa'),
            ],
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'               => 'required|string|max:100',
            'plan'              => 'required|in:gratuit,pro,entreprise',
            'pays'              => 'nullable|string|max:60',
            'email_contact'     => 'nullable|email|max:150',
            'telephone'         => 'nullable|string|max:30',
            // Admin account (optional — skip if no telephone provided)
            'admin_nom'         => 'nullable|string|max:100',
            'admin_telephone'   => 'nullable|string|max:30|unique:users,telephone',
            'admin_password'    => 'nullable|string|min:6',
        ]);

        return DB::transaction(function () use ($validated) {
            $slug = Str::slug($validated['nom']);
            $base = $slug;
            $i = 1;
            while (Organisation::where('slug', $slug)->exists()) {
                $slug = "{$base}-{$i}";
                $i++;
            }

            $planExpire = match ($validated['plan']) {
                'pro'         => now()->addYear(),
                'entreprise'  => now()->addYears(10),
                default       => null,
            };

            $org = Organisation::create([
                'nom'                => $validated['nom'],
                'slug'               => $slug,
                'plan'               => $validated['plan'],
                'pays'               => $validated['pays'] ?? null,
                'email_contact'      => $validated['email_contact'] ?? null,
                'telephone'          => $validated['telephone'] ?? null,
                'est_active'         => true,
                'plan_expire_at'     => $planExpire,
                'periode_essai_fin'  => now()->addDays(30),
                'devise'             => 'FCFA',
            ]);

            $admin = null;
            if (!empty($validated['admin_telephone'])) {
                $tel   = $validated['admin_telephone'];
                $admin = User::create([
                    'nom'                 => $validated['admin_nom'] ?? 'Admin',
                    'telephone'           => $tel,
                    'email'               => $tel . '@agri-erp.local',
                    'password'            => Hash::make($validated['admin_password'] ?? 'password'),
                    'role'                => 'admin',
                    'organisation_id'     => $org->id,
                    'est_actif'           => true,
                    'onboarding_complete' => true,
                ]);
            }

            return response()->json([
                'organisation' => $org,
                'admin'        => $admin,
            ], 201);
        });
    }

    public function toggleActif(int $id): JsonResponse
    {
        $tenant = Organisation::findOrFail($id);
        $tenant->update(['est_active' => !$tenant->est_active]);

        return response()->json([
            'message'      => $tenant->est_active ? 'Organisation activée.' : 'Organisation désactivée.',
            'organisation' => $tenant,
        ]);
    }

    public function updatePlan(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'plan'       => 'required|in:gratuit,pro,entreprise',
            'duree_mois' => 'nullable|integer|min:1|max:120',
        ]);

        $tenant = Organisation::findOrFail($id);

        $duree = $validated['duree_mois'] ?? null;
        $planExpire = match ($validated['plan']) {
            'pro'        => now()->addMonths($duree ?? 12),
            'entreprise' => now()->addMonths($duree ?? 120),
            default      => null,
        };

        $tenant->update([
            'plan'           => $validated['plan'],
            'plan_expire_at' => $planExpire,
            'est_suspendue'  => false,
        ]);

        return response()->json([
            'message'      => 'Plan mis à jour avec succès.',
            'organisation' => $tenant,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tenant = Organisation::findOrFail($id);
        $tenant->delete();

        return response()->json(['message' => 'Organisation supprimée.']);
    }
}

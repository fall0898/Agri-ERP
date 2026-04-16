<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Tenant\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private TenantService $tenantService) {}

    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        if ($me->isSuperAdmin()) {
            // Super-admin : tous les utilisateurs de toutes les organisations (hors super_admin plateforme)
            $users = User::whereNotNull('organisation_id')
                ->with('organisation:id,nom')
                ->orderBy('nom')
                ->get();
        } else {
            // Admin : uniquement les utilisateurs de son organisation, sans les super_admin
            $users = User::where('organisation_id', $me->organisation_id)
                ->whereIn('role', ['admin', 'lecteur'])
                ->orderBy('nom')
                ->get();
        }

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'telephone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,lecteur',
        ]);

        $user = $this->tenantService->addUser(
            $request->user()->organisation,
            $validated
        );

        return response()->json($user, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $query = User::whereIn('role', ['admin', 'lecteur']);

        if (!$request->user()->isSuperAdmin()) {
            $query->where('organisation_id', $request->user()->organisation_id);
        }

        $user = $query->findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'telephone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:admin,lecteur',
            'est_actif' => 'boolean',
        ]);

        $user->update($validated);

        if (array_key_exists('est_actif', $validated) && $validated['est_actif'] === false) {
            $user->tokens()->delete();
        }

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $query = User::whereIn('role', ['admin', 'lecteur']);

        if (!$request->user()->isSuperAdmin()) {
            $query->where('organisation_id', $request->user()->organisation_id);
        }

        $user = $query->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('organisation:id,nom,plan')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'             => 'required|string|max:100',
            'telephone'       => ['required', 'string', 'max:30', Rule::unique('users', 'telephone')->whereNull('deleted_at')],
            'password'        => 'required|string|min:6',
            'role'            => 'required|in:super_admin,admin,lecteur',
            'organisation_id' => 'nullable|exists:organisations,id',
        ]);

        // Auto-generate email from telephone
        $email = $validated['telephone'] . '@agri-erp.local';

        $user = User::create([
            'nom'             => $validated['nom'],
            'telephone'       => $validated['telephone'],
            'email'           => $email,
            'password'        => Hash::make($validated['password']),
            'role'            => $validated['role'],
            'organisation_id' => $validated['organisation_id'] ?? null,
            'est_actif'       => true,
            'onboarding_complete' => true,
        ]);

        return response()->json($user->load('organisation:id,nom,plan'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nom'             => 'sometimes|string|max:100',
            'telephone'       => ['sometimes', 'string', 'max:30', Rule::unique('users', 'telephone')->ignore($id)->whereNull('deleted_at')],
            'password'        => 'sometimes|nullable|string|min:6',
            'role'            => 'sometimes|in:super_admin,admin,lecteur',
            'organisation_id' => 'sometimes|nullable|exists:organisations,id',
            'est_actif'       => 'sometimes|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Update email if telephone changed
        if (isset($validated['telephone'])) {
            $validated['email'] = $validated['telephone'] . '@agri-erp.local';
        }

        $user->update($validated);

        return response()->json($user->fresh()->load('organisation:id,nom,plan'));
    }

    public function toggleActif(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['est_actif' => !$user->est_actif]);

        return response()->json([
            'message' => $user->est_actif ? 'Utilisateur activé.' : 'Utilisateur bloqué.',
            'user'    => $user,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->tokens()->delete();
        $user->forceDelete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}

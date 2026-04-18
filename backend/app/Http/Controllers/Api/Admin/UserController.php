<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|string|min:8',
            'role'            => 'required|in:super_admin,admin,lecteur',
            'organisation_id' => 'nullable|exists:organisations,id',
            'telephone'       => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'nom'             => $validated['nom'],
            'email'           => $validated['email'],
            'password'        => Hash::make($validated['password']),
            'role'            => $validated['role'],
            'organisation_id' => $validated['organisation_id'] ?? null,
            'telephone'       => $validated['telephone'] ?? null,
            'est_actif'       => true,
        ]);

        return response()->json($user->load('organisation:id,nom,plan'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nom'             => 'sometimes|string|max:100',
            'email'           => 'sometimes|email|unique:users,email,' . $id,
            'password'        => 'sometimes|nullable|string|min:8',
            'role'            => 'sometimes|in:super_admin,admin,lecteur',
            'organisation_id' => 'sometimes|nullable|exists:organisations,id',
            'telephone'       => 'sometimes|nullable|string|max:20',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
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
        $user = User::findOrFail($id);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}

<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'telephone' => ['required', 'string'],
            'password'  => 'required|string',
        ], [
            'telephone.required' => 'Le numéro de téléphone est obligatoire.',
            'password.required'  => 'Le mot de passe est obligatoire.',
        ]);

        try {
            $result = $this->authService->login($request->only('telephone', 'password'));

            return response()->json([
                'token' => $result['token'],
                'user' => $result['user'],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Identifiants incorrects.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('organisation'));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|nullable|string|max:20',
            'onboarding_complete' => 'sometimes|boolean',
            'preferences_notification' => 'sometimes|array',
        ]);

        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return response()->json($user->load('organisation'));
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'password_actuel' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password_actuel, $user->password)) {
            return response()->json(['message' => 'Le mot de passe actuel est incorrect.'], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}

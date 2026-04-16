<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        if (!$user->est_actif) {
            throw ValidationException::withMessages([
                'email' => ['Votre compte est désactivé. Contactez votre administrateur.'],
            ]);
        }

        if ($user->organisation && !$user->organisation->est_active) {
            throw ValidationException::withMessages([
                'email' => ['Votre compte est lié à une organisation désactivée. Contactez le support.'],
            ]);
        }

        $user->update(['derniere_connexion_at' => now()]);

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $token,
            'user' => $user->load('organisation'),
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return $user->fresh();
    }
}

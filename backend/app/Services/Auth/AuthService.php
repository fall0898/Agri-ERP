<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials): array
    {
        // normalise le numéro : strip non-digits, supprime préfixe 221
        $phone = preg_replace('/[^0-9]/', '', $credentials['telephone']);
        if (strlen($phone) > 9 && str_starts_with($phone, '221')) {
            $phone = substr($phone, 3);
        }

        $user = User::where('telephone', $phone)->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'telephone' => ['Numéro de téléphone ou mot de passe incorrect.'],
            ]);
        }

        if (!$user->est_actif) {
            throw ValidationException::withMessages([
                'telephone' => ['Votre compte est désactivé. Contactez votre administrateur.'],
            ]);
        }

        if ($user->organisation && !$user->organisation->est_active) {
            throw ValidationException::withMessages([
                'telephone' => ['Votre compte est lié à une organisation désactivée. Contactez le support.'],
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

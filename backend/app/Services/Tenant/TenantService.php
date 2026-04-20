<?php

namespace App\Services\Tenant;

use App\Events\TenantCree;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantService
{
    public function register(array $data): array
    {
        $phone = preg_replace('/[^0-9]/', '', $data['telephone']);
        if (strlen($phone) > 9 && str_starts_with($phone, '221')) {
            $phone = substr($phone, 3);
        }

        [$organisation, $user] = DB::transaction(function () use ($data, $phone) {
            $slug = $this->generateUniqueSlug($data['nom_organisation']);

            $organisation = Organisation::create([
                'nom'           => $data['nom_organisation'],
                'slug'          => $slug,
                'email_contact' => null,
                'telephone'     => $phone,
                'devise'        => $data['devise'] ?? 'FCFA',
                'plan'          => 'gratuit',
            ]);

            $user = User::create([
                'organisation_id' => $organisation->id,
                'nom'             => $data['nom'],
                'email'           => $phone . '@agri-erp.local',
                'telephone'       => $phone,
                'password'        => $data['password'],
                'role'            => 'admin',
                'est_actif'       => true,
            ]);

            return [$organisation, $user];
        });

        // Dispatch after commit — listeners failing must not roll back the registration
        TenantCree::dispatch($organisation, $user);

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $token,
            'user'  => $user->fresh()->load('organisation'),
        ];
    }

    private function generateUniqueSlug(string $nom): string
    {
        $base = Str::slug($nom);
        $slug = $base;
        $i = 1;

        while (Organisation::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    public function addUser(Organisation $organisation, array $data): User
    {
        return User::create([
            'organisation_id' => $organisation->id,
            'nom' => $data['nom'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'lecteur',
            'telephone' => $data['telephone'] ?? null,
            'est_actif' => true,
        ]);
    }
}

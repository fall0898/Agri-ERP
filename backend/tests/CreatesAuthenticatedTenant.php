<?php

namespace Tests;

use App\Models\Organisation;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait CreatesAuthenticatedTenant
{
    protected function creerTenantAdmin(): array
    {
        $org   = Organisation::factory()->create();
        $admin = User::factory()->create([
            'organisation_id' => $org->id,
            'role'            => 'admin',
            'est_actif'       => true,
        ]);
        Sanctum::actingAs($admin);
        app()->instance('tenant', $org);
        return ['org' => $org, 'user' => $admin];
    }

    protected function creerTenantLecteur(): array
    {
        $org     = Organisation::factory()->create();
        $lecteur = User::factory()->create([
            'organisation_id' => $org->id,
            'role'            => 'lecteur',
            'est_actif'       => true,
        ]);
        Sanctum::actingAs($lecteur);
        app()->instance('tenant', $org);
        return ['org' => $org, 'user' => $lecteur];
    }
}

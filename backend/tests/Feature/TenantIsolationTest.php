<?php

namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Depense;
use App\Models\Vente;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function authAs(Organisation $org, string $role = 'admin'): void
    {
        $user = User::factory()->create(['organisation_id' => $org->id, 'role' => $role, 'est_actif' => true]);
        Sanctum::actingAs($user);
        app()->instance('tenant', $org);
    }

    public function test_champ_dun_autre_tenant_nest_pas_visible(): void
    {
        $orgA = Organisation::factory()->create();
        $orgB = Organisation::factory()->create();

        Champ::factory()->create(['organisation_id' => $orgB->id, 'nom' => 'Champ B Secret']);
        $this->authAs($orgA);

        $response = $this->getJson('/api/champs');
        $response->assertOk();
        $noms = collect($response->json('data'))->pluck('nom');
        $this->assertNotContains('Champ B Secret', $noms);
    }

    public function test_vente_dun_autre_tenant_nest_pas_accessible(): void
    {
        $orgA = Organisation::factory()->create();
        $orgB = Organisation::factory()->create();

        $venteB = Vente::factory()->create(['organisation_id' => $orgB->id]);
        $this->authAs($orgA);

        $this->getJson("/api/ventes/{$venteB->id}")->assertNotFound();
    }

    public function test_depense_dun_autre_tenant_nest_pas_modifiable(): void
    {
        $orgA = Organisation::factory()->create();
        $orgB = Organisation::factory()->create();

        $depenseB = Depense::factory()->create(['organisation_id' => $orgB->id]);
        $this->authAs($orgA);

        $this->putJson("/api/depenses/{$depenseB->id}", ['montant_fcfa' => 999])->assertNotFound();
    }
}

<?php

namespace Tests\Feature;

use App\Models\Depense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class DepenseControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_admin_peut_creer_depense(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/depenses', [
            'description'  => 'Achat engrais',
            'montant_fcfa' => 45000,
            'categorie'    => 'intrant',
            'date_depense' => '2026-04-01',
        ]);

        $response->assertCreated()
                 ->assertJsonPath('data.montant_fcfa', fn($v) => (float)$v === 45000.0);
    }

    public function test_impossible_de_modifier_depense_auto_generee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $depense = Depense::factory()->create([
            'organisation_id'  => $org->id,
            'est_auto_generee' => true,
        ]);

        $this->putJson("/api/depenses/{$depense->id}", ['montant_fcfa' => 999])->assertForbidden();
    }

    public function test_categorie_invalide_retourne_422(): void
    {
        $this->creerTenantAdmin();

        $this->postJson('/api/depenses', [
            'description'  => 'Test',
            'montant_fcfa' => 1000,
            'categorie'    => 'categorie_inexistante',
            'date_depense' => '2026-04-01',
        ])->assertUnprocessable();
    }
}

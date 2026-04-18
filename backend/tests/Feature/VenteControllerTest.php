<?php

namespace Tests\Feature;

use App\Models\Vente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class VenteControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_creation_calcule_montant_total(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/ventes', [
            'produit'            => 'Oignon',
            'quantite_kg'        => 100,
            'prix_unitaire_fcfa' => 250,
            'date_vente'         => '2026-04-01',
        ]);

        $response->assertCreated()
                 ->assertJsonPath('data.montant_total_fcfa', fn($v) => (float)$v === 25000.0);
    }

    public function test_impossible_de_modifier_vente_auto_generee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $vente = Vente::factory()->create([
            'organisation_id'  => $org->id,
            'est_auto_generee' => true,
        ]);

        $this->putJson("/api/ventes/{$vente->id}", ['produit' => 'Test'])->assertForbidden();
    }

    public function test_impossible_de_supprimer_vente_auto_generee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $vente = Vente::factory()->create([
            'organisation_id'  => $org->id,
            'est_auto_generee' => true,
        ]);

        $this->deleteJson("/api/ventes/{$vente->id}")->assertForbidden();
    }

    public function test_lecteur_peut_lister_ventes(): void
    {
        ['org' => $org] = $this->creerTenantLecteur();
        Vente::factory()->count(2)->create(['organisation_id' => $org->id]);

        $this->getJson('/api/ventes')->assertOk()->assertJsonCount(2, 'data');
    }
}

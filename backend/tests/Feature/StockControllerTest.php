<?php

namespace Tests\Feature;

use App\Models\Stock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class StockControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_index_retourne_liste_enveloppee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Stock::factory()->create(['organisation_id' => $org->id, 'nom' => 'Urée', 'est_actif' => true]);
        Stock::factory()->create(['organisation_id' => $org->id, 'nom' => 'Gasoil', 'est_actif' => true]);

        $response = $this->getJson('/api/stocks');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => [['id', 'nom', 'categorie', 'quantite_actuelle', 'unite']]])
                 ->assertJsonCount(2, 'data');
    }

    public function test_index_exclut_stocks_inactifs(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Stock::factory()->create(['organisation_id' => $org->id, 'est_actif' => true]);
        Stock::factory()->create(['organisation_id' => $org->id, 'est_actif' => false]);

        $response = $this->getJson('/api/stocks');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
    }

    public function test_store_cree_un_stock(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/stocks', [
            'nom'               => 'Semences maïs',
            'categorie'         => 'semence',
            'quantite_actuelle' => 50,
            'unite'             => 'kg',
            'seuil_alerte'      => 10,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.nom', 'Semences maïs')
                 ->assertJsonPath('data.unite', 'kg');
    }

    public function test_show_retourne_stock_avec_niveau_alerte(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $stock = Stock::factory()->create([
            'organisation_id'   => $org->id,
            'quantite_actuelle' => 5,
            'seuil_alerte'      => 10,
            'est_actif'         => true,
        ]);

        $response = $this->getJson("/api/stocks/{$stock->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['id', 'nom', 'niveau_alerte']]);
    }

    public function test_update_modifie_le_stock(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $stock = Stock::factory()->create(['organisation_id' => $org->id]);

        $response = $this->putJson("/api/stocks/{$stock->id}", [
            'seuil_alerte' => 20,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('stocks', ['id' => $stock->id, 'seuil_alerte' => 20]);
    }

    public function test_lecteur_ne_peut_pas_creer_stock(): void
    {
        $this->creerTenantLecteur();

        $response = $this->postJson('/api/stocks', [
            'nom'       => 'Test',
            'categorie' => 'autre',
            'unite'     => 'kg',
        ]);

        $response->assertStatus(403);
    }
}

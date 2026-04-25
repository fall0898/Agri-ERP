<?php

namespace Tests\Feature;

use App\Models\Employe;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class EmployeControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_index_retourne_liste_enveloppee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Employe::factory()->count(3)->create(['organisation_id' => $org->id]);

        $response = $this->getJson('/api/employes');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => [['id', 'nom', 'poste', 'salaire_mensuel_fcfa']]])
                 ->assertJsonCount(3, 'data');
    }

    public function test_store_cree_un_employe(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/employes', [
            'nom'                  => 'Mamadou Diallo',
            'poste'                => 'Cultivateur',
            'salaire_mensuel_fcfa' => 75000,
            'telephone'            => '+221770000001',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.nom', 'Mamadou Diallo')
                 ->assertJsonPath('data.salaire_mensuel_fcfa', 75000);
    }

    public function test_show_retourne_employe(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);

        $response = $this->getJson("/api/employes/{$employe->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('data.id', $employe->id);
    }

    public function test_update_modifie_employe(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);

        $response = $this->putJson("/api/employes/{$employe->id}", [
            'salaire_mensuel_fcfa' => 90000,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('employes', ['id' => $employe->id, 'salaire_mensuel_fcfa' => 90000]);
    }

    public function test_destroy_supprime_employe(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);

        $this->deleteJson("/api/employes/{$employe->id}")->assertStatus(200);

        $this->assertSoftDeleted('employes', ['id' => $employe->id]);
    }

    public function test_lecteur_ne_peut_pas_creer_employe(): void
    {
        $this->creerTenantLecteur();

        $response = $this->postJson('/api/employes', [
            'nom' => 'Test Employe',
        ]);

        $response->assertStatus(403);
    }
}

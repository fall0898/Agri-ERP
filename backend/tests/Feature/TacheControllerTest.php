<?php

namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Employe;
use App\Models\Tache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class TacheControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_index_retourne_liste_enveloppee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);
        Tache::factory()->count(2)->create(['organisation_id' => $org->id, 'employe_id' => $employe->id]);

        $response = $this->getJson('/api/taches');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => [['id', 'titre', 'statut', 'priorite']]])
                 ->assertJsonCount(2, 'data');
    }

    public function test_store_cree_une_tache(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);

        $response = $this->postJson('/api/taches', [
            'employe_id' => $employe->id,
            'titre'      => 'Irrigation parcelle A',
            'date_debut' => '2026-04-25',
            'priorite'   => 'haute',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.titre', 'Irrigation parcelle A')
                 ->assertJsonPath('data.priorite', 'haute');
    }

    public function test_updateStatut_met_a_jour_la_tache(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);
        $tache = Tache::factory()->create([
            'organisation_id' => $org->id,
            'employe_id'      => $employe->id,
            'statut'          => 'a_faire',
        ]);

        $response = $this->patchJson("/api/taches/{$tache->id}/statut", [
            'statut' => 'en_cours',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('taches', ['id' => $tache->id, 'statut' => 'en_cours']);
    }

    public function test_lecteur_ne_peut_pas_changer_statut(): void
    {
        ['org' => $org] = $this->creerTenantLecteur();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);
        $tache = Tache::factory()->create([
            'organisation_id' => $org->id,
            'employe_id'      => $employe->id,
        ]);

        $response = $this->patchJson("/api/taches/{$tache->id}/statut", ['statut' => 'termine']);

        $response->assertStatus(403);
    }

    public function test_destroy_supprime_tache(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $employe = Employe::factory()->create(['organisation_id' => $org->id]);
        $tache = Tache::factory()->create(['organisation_id' => $org->id, 'employe_id' => $employe->id]);

        $this->deleteJson("/api/taches/{$tache->id}")->assertStatus(200);

        $this->assertDatabaseMissing('taches', ['id' => $tache->id]);
    }
}

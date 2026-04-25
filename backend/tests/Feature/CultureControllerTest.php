<?php

namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Culture;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class CultureControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_index_retourne_liste_enveloppee(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        Culture::factory()->count(3)->create(['organisation_id' => $org->id, 'champ_id' => $champ->id]);

        $response = $this->getJson('/api/cultures');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => [['id', 'nom', 'saison', 'statut']]])
                 ->assertJsonCount(3, 'data');
    }

    public function test_index_filtre_par_statut(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        Culture::factory()->create(['organisation_id' => $org->id, 'champ_id' => $champ->id, 'statut' => 'en_cours']);
        Culture::factory()->create(['organisation_id' => $org->id, 'champ_id' => $champ->id, 'statut' => 'termine']);

        $response = $this->getJson('/api/cultures?statut=en_cours');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
    }

    public function test_store_cree_une_culture(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);

        $response = $this->postJson('/api/cultures', [
            'champ_id' => $champ->id,
            'nom'      => 'Mil',
            'saison'   => 'normale',
            'annee'    => 2026,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.nom', 'Mil');

        $this->assertDatabaseHas('cultures', ['nom' => 'Mil', 'organisation_id' => $org->id]);
    }

    public function test_show_retourne_culture(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create(['organisation_id' => $org->id, 'champ_id' => $champ->id]);

        $response = $this->getJson("/api/cultures/{$culture->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('data.id', $culture->id);
    }

    public function test_lecteur_ne_peut_pas_creer_culture(): void
    {
        ['org' => $org] = $this->creerTenantLecteur();

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);

        $response = $this->postJson('/api/cultures', [
            'champ_id' => $champ->id,
            'nom'      => 'Maïs',
            'saison'   => 'normale',
            'annee'    => 2026,
        ]);

        $response->assertStatus(403);
    }
}

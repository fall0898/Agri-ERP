<?php

namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Organisation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class ChampControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_admin_peut_lister_ses_champs(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        Champ::factory()->count(3)->create(['organisation_id' => $org->id]);

        $response = $this->getJson('/api/champs');

        $response->assertOk()
                 ->assertJsonCount(3, 'data');
    }

    public function test_admin_peut_creer_un_champ(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/champs', [
            'nom'           => 'Champ Test',
            'superficie_ha' => 5.5,
            'localisation'  => 'Nord',
        ]);

        $response->assertCreated()
                 ->assertJsonPath('data.nom', 'Champ Test');

        $this->assertDatabaseHas('champs', ['nom' => 'Champ Test']);
    }

    public function test_lecteur_ne_peut_pas_creer_un_champ(): void
    {
        $this->creerTenantLecteur();

        $response = $this->postJson('/api/champs', [
            'nom'           => 'Champ Interdit',
            'superficie_ha' => 2,
        ]);

        $response->assertForbidden();
    }

    public function test_plan_gratuit_limite_a_un_champ(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $org->update(['plan' => 'gratuit', 'plan_expire_at' => null, 'periode_essai_fin' => null]);
        Champ::factory()->create(['organisation_id' => $org->id]);

        $response = $this->postJson('/api/champs', [
            'nom'           => 'Deuxième champ',
            'superficie_ha' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_peut_modifier_son_champ(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id, 'nom' => 'Ancien Nom']);

        $response = $this->putJson("/api/champs/{$champ->id}", ['nom' => 'Nouveau Nom', 'superficie_ha' => 3]);

        $response->assertOk()
                 ->assertJsonPath('data.nom', 'Nouveau Nom');
    }

    public function test_admin_peut_supprimer_son_champ(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id]);

        $this->deleteJson("/api/champs/{$champ->id}")->assertOk();

        $this->assertDatabaseMissing('champs', ['id' => $champ->id, 'deleted_at' => null]);
    }
}

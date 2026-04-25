<?php

namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Culture;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_dashboard_retourne_toutes_les_sections(): void
    {
        $this->creerTenantAdmin();

        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'kpis' => ['total_ventes', 'total_depenses', 'solde_net', 'nb_champs', 'nb_cultures_actives', 'nb_employes', 'nb_alertes_stock'],
                     'ventesRecentes',
                     'depensesRecentes',
                     'stocksAlertes',
                     'tachesEnCours',
                     'graphiqueFinance',
                     'graphiqueDepenses',
                     'parChamp',
                 ]);
    }

    public function test_dashboard_kpis_comptent_correctement(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $champ = Champ::factory()->create(['organisation_id' => $org->id, 'est_actif' => true]);
        $champInactif = Champ::factory()->create(['organisation_id' => $org->id, 'est_actif' => false]);
        Culture::factory()->create(['organisation_id' => $org->id, 'champ_id' => $champ->id, 'statut' => 'en_cours']);

        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(200)
                 ->assertJsonPath('kpis.nb_champs', 1)
                 ->assertJsonPath('kpis.nb_cultures_actives', 1);
    }

    public function test_creation_vente_invalide_le_cache(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $cacheKey = "dashboard_tout_{$org->id}";
        Cache::put($cacheKey, ['kpis' => ['total_ventes' => 999]], 120);

        $this->postJson('/api/ventes', [
            'produit'            => 'Maïs',
            'quantite_kg'        => 100,
            'prix_unitaire_fcfa' => 500,
            'date_vente'         => now()->toDateString(),
        ]);

        $this->assertNull(Cache::get($cacheKey));
    }

    public function test_creation_depense_invalide_le_cache(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $cacheKey = "dashboard_tout_{$org->id}";
        Cache::put($cacheKey, ['kpis' => ['total_depenses' => 999]], 120);

        $this->postJson('/api/depenses', [
            'description'  => 'Test',
            'montant_fcfa' => 1000,
            'categorie'    => 'intrant',
            'date_depense' => now()->toDateString(),
        ]);

        $this->assertNull(Cache::get($cacheKey));
    }
}

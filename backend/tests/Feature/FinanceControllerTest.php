<?php

namespace Tests\Feature;

use App\Models\Depense;
use App\Models\Vente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class FinanceControllerTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_resume_retourne_totaux_corrects(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Vente::factory()->create(['organisation_id' => $org->id, 'montant_total_fcfa' => 100000]);
        Vente::factory()->create(['organisation_id' => $org->id, 'montant_total_fcfa' => 50000]);
        Depense::factory()->create(['organisation_id' => $org->id, 'montant_fcfa' => 30000]);

        $response = $this->getJson('/api/finance/resume');

        $response->assertOk()
                 ->assertJsonPath('total_ventes', fn($v) => (float)$v === 150000.0)
                 ->assertJsonPath('total_depenses', fn($v) => (float)$v === 30000.0)
                 ->assertJsonPath('solde_net', fn($v) => (float)$v === 120000.0);
    }

    public function test_resume_filtre_par_date(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Vente::factory()->create(['organisation_id' => $org->id, 'montant_total_fcfa' => 50000, 'date_vente' => '2026-01-15']);
        Vente::factory()->create(['organisation_id' => $org->id, 'montant_total_fcfa' => 80000, 'date_vente' => '2026-03-10']);

        $response = $this->getJson('/api/finance/resume?date_debut=2026-03-01&date_fin=2026-03-31');

        $response->assertOk()
                 ->assertJsonPath('total_ventes', fn($v) => (float)$v === 80000.0);
    }

    public function test_resume_exclut_les_ventes_auto_generees(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Vente::factory()->create(['organisation_id' => $org->id, 'montant_total_fcfa' => 10000, 'est_auto_generee' => true]);
        Vente::factory()->create(['organisation_id' => $org->id, 'montant_total_fcfa' => 20000, 'est_auto_generee' => false]);

        $response = $this->getJson('/api/finance/resume');

        $response->assertOk()
                 ->assertJsonPath('total_ventes', fn($v) => (float)$v === 20000.0);
    }
}

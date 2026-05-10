<?php

namespace Tests\Feature;

use App\Models\CampagneAgricole;
use App\Models\Depense;
use App\Models\Vente;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardCampagneFilterTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_dashboard_filtre_par_campagne_id(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $c1 = CampagneAgricole::factory()->create([
            'organisation_id' => $org->id,
            'nom' => 'Saison 2024/2025',
            'est_courante' => false,
        ]);
        $c2 = CampagneAgricole::factory()->create([
            'organisation_id' => $org->id,
            'nom' => 'Saison 2025/2026',
            'est_courante' => true,
        ]);

        Vente::factory()->create(['organisation_id' => $org->id, 'campagne_id' => $c1->id, 'montant_total_fcfa' => 100000]);
        Vente::factory()->create(['organisation_id' => $org->id, 'campagne_id' => $c2->id, 'montant_total_fcfa' => 200000]);

        $res = $this->getJson('/api/dashboard?campagne_id=' . $c1->id);
        $res->assertOk();
        $res->assertJsonPath('kpis.total_ventes', 100000);
    }

    public function test_dashboard_sans_filtre_retourne_toutes_campagnes(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $c1 = CampagneAgricole::factory()->create(['organisation_id' => $org->id, 'est_courante' => false]);
        $c2 = CampagneAgricole::factory()->create(['organisation_id' => $org->id, 'est_courante' => true]);

        Vente::factory()->create(['organisation_id' => $org->id, 'campagne_id' => $c1->id, 'montant_total_fcfa' => 100000]);
        Vente::factory()->create(['organisation_id' => $org->id, 'campagne_id' => $c2->id, 'montant_total_fcfa' => 200000]);

        $res = $this->getJson('/api/dashboard');
        $res->assertOk();
        $res->assertJsonPath('kpis.total_ventes', 300000);
    }
}

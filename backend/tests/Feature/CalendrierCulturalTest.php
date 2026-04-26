<?php
namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Culture;
use App\Services\Whatsapp\CalendrierCulturalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class CalendrierCulturalTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    private CalendrierCulturalService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CalendrierCulturalService();
    }

    public function test_stade_oignon_reprise(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'oignon',
            'date_semis'      => now()->subDays(5)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $info = $this->service->getStadeActuel($culture);

        $this->assertNotNull($info);
        $this->assertEquals('Reprise', $info['stade']['nom']);
        $this->assertEquals(5, $info['j_culture']);
        $this->assertEquals('2 feuilles', $info['prochain_stade']['nom']);
    }

    public function test_stade_tomate_floraison(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'tomate',
            'date_semis'      => now()->subDays(46)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $info = $this->service->getStadeActuel($culture);

        $this->assertNotNull($info);
        $this->assertEquals('Floraison pleine', $info['stade']['nom']);
    }

    public function test_stade_riz_tallage(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'riz',
            'date_semis'      => now()->subDays(20)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $info = $this->service->getStadeActuel($culture);

        $this->assertEquals('Tallage actif', $info['stade']['nom']);
    }

    public function test_conseils_retourne_fertilisation_oignon_4_feuilles(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id, 'superficie_ha' => 2.0]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'oignon',
            'date_semis'      => now()->subDays(25)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $meteo = ['temp_max_moy' => 30, 'temp_min_moy' => 20, 'humidite_moy' => 55, 'pluie_totale' => 0, 'et0_moy' => 5.0];
        $msg   = $this->service->getConseils($culture, $meteo, 'aspersion', 'fr');

        $this->assertStringContainsString('Urée', $msg);
        $this->assertStringContainsString('100 kg', $msg); // 50 kg/ha × 2 ha
    }

    public function test_conseils_sans_date_semis_retourne_message_aide(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => null,
            'date_semis'      => null,
            'statut'          => 'en_cours',
        ]);

        $msg = $this->service->getConseils($culture, [], 'aspersion', 'fr');

        $this->assertStringContainsString('date de semis', $msg);
    }

    public function test_alerte_ravageur_thrips_oignon_conditions_favorables(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();
        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'oignon',
            'date_semis'      => now()->subDays(30)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $meteoFavorable = ['temp_max_moy' => 22, 'temp_min_moy' => 15, 'humidite_moy' => 40, 'pluie_totale' => 0, 'et0_moy' => 4.0];
        $msg = $this->service->getConseils($culture, $meteoFavorable, 'aspersion', 'fr');

        $this->assertStringContainsString('Thrips', $msg);
        $this->assertStringContainsString('Spinosad', $msg);
    }
}

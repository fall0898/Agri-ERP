<?php
namespace Tests\Feature;

use App\Models\Champ;
use App\Models\Culture;
use App\Models\TraitementApplique;
use App\Models\WhatsappUser;
use App\Services\Whatsapp\ActionExecutor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class TraitementApliqueTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_signaler_traitement_cree_enregistrement(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        app()->instance('tenant', $org);

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'oignon',
            'date_semis'      => now()->subDays(30)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $waUser = WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $org->id,
            'phone_number'    => '+221770809798',
            'est_actif'       => true,
        ]);

        $executor = app(ActionExecutor::class);
        $result   = $executor->execute('SIGNALER_TRAITEMENT', [
            'produit'          => 'Spinosad 480 SC',
            'matiere_active'   => 'spinosad',
            'dose'             => '0.1ml/L',
            'date_application' => now()->toDateString(),
        ], $waUser, 'fr');

        $this->assertStringContainsString('✅', $result['response']);
        $this->assertDatabaseHas('traitements_appliques', [
            'produit'        => 'Spinosad 480 SC',
            'matiere_active' => 'spinosad',
        ]);
    }

    public function test_alerte_rotation_apres_3_applications(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        app()->instance('tenant', $org);

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        $culture = Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'oignon',
            'date_semis'      => now()->subDays(30)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        TraitementApplique::create(['culture_id' => $culture->id, 'organisation_id' => $org->id, 'user_id' => $user->id, 'produit' => 'Spinosad', 'matiere_active' => 'spinosad', 'dose' => '0.1ml/L', 'date_application' => now()->subDays(10)->toDateString(), 'source' => 'whatsapp']);
        TraitementApplique::create(['culture_id' => $culture->id, 'organisation_id' => $org->id, 'user_id' => $user->id, 'produit' => 'Spinosad', 'matiere_active' => 'spinosad', 'dose' => '0.1ml/L', 'date_application' => now()->subDays(5)->toDateString(), 'source' => 'whatsapp']);

        $waUser = WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $org->id,
            'phone_number'    => '+221770809798',
            'est_actif'       => true,
        ]);

        $executor = app(ActionExecutor::class);
        $result   = $executor->execute('SIGNALER_TRAITEMENT', [
            'produit'          => 'Spinosad 480 SC',
            'matiere_active'   => 'spinosad',
            'dose'             => '0.1ml/L',
            'date_application' => now()->toDateString(),
        ], $waUser, 'fr');

        $this->assertStringContainsString('Risque résistance', $result['response']);
        $this->assertStringContainsString('Lambda-cyhalothrine', $result['response']);
    }

    public function test_calendrier_cultural_retourne_stade(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        app()->instance('tenant', $org);

        $champ = Champ::factory()->create(['organisation_id' => $org->id]);
        Culture::factory()->create([
            'organisation_id' => $org->id,
            'champ_id'        => $champ->id,
            'type_culture'    => 'tomate',
            'date_semis'      => now()->subDays(20)->toDateString(),
            'statut'          => 'en_cours',
        ]);

        $waUser = WhatsappUser::create([
            'user_id'          => $user->id,
            'organisation_id'  => $org->id,
            'phone_number'     => '+221770809798',
            'est_actif'        => true,
            'systeme_arrosage' => 'aspersion',
        ]);

        $executor = app(ActionExecutor::class);
        $result   = $executor->execute('CALENDRIER_CULTURAL', [], $waUser, 'fr');

        $this->assertStringContainsString('TOMATE', $result['response']);
        $this->assertStringContainsString('Stade', $result['response']);
    }
}

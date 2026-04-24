<?php
namespace Tests\Feature;

use App\Models\WhatsappUser;
use App\Services\Whatsapp\AgentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class WhatsappAgentTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    private function creerUtilisateurLie(string $phone = '+221770809798'): array
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $org->id,
            'phone_number'    => $phone,
            'est_actif'       => true,
        ]);
        return compact('org', 'user');
    }

    public function test_whatsapp_user_peut_etre_lie(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $org->id,
            'phone_number'    => '+221770809798',
            'est_actif'       => true,
        ]);
        $this->assertDatabaseHas('whatsapp_users', [
            'phone_number' => '+221770809798',
            'user_id'      => $user->id,
        ]);
    }

    public function test_admin_peut_lier_numero_whatsapp(): void
    {
        $this->creerTenantAdmin();
        $response = $this->postJson('/api/parametres/whatsapp', [
            'phone_number' => '+221770809798',
        ]);
        $response->assertOk()
                 ->assertJsonPath('phone_number', '+221770809798');
        $this->assertDatabaseHas('whatsapp_users', ['phone_number' => '+221770809798']);
    }

    public function test_numero_deja_pris_retourne_422(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        $this->creerTenantAdmin();
        $this->postJson('/api/parametres/whatsapp', ['phone_number' => '+221770809798'])
             ->assertStatus(422);
    }

    public function test_admin_peut_voir_statut_whatsapp(): void
    {
        $this->creerTenantAdmin();
        $this->postJson('/api/parametres/whatsapp', ['phone_number' => '+221777000001']);
        $this->getJson('/api/parametres/whatsapp')
             ->assertOk()
             ->assertJsonPath('linked', true)
             ->assertJsonPath('phone_number', '+221777000001');
    }

    public function test_conversation_state_set_get_clear(): void
    {
        $service = new \App\Services\Whatsapp\ConversationStateService();
        $service->set('+221770809798', ['step' => 'awaiting_confirmation', 'intent' => 'ADD_DEPENSE']);
        $state = $service->get('+221770809798');
        $this->assertEquals('awaiting_confirmation', $state['step']);
        $this->assertEquals('ADD_DEPENSE', $state['intent']);
        $service->clear('+221770809798');
        $this->assertNull($service->get('+221770809798'));
    }

    public function test_agent_service_parse_json_valide(): void
    {
        $mockResponse = json_encode([
            'intent'   => 'ADD_DEPENSE',
            'language' => 'fr',
            'params'   => ['montant_fcfa' => 5000, 'categorie' => 'intrant', 'description' => 'semences', 'date_depense' => '2026-04-24', 'campagne_id' => null],
            'response' => 'Vous voulez enregistrer 5 000 FCFA pour Intrant. Tapez OUI pour confirmer.',
        ]);

        $result = json_decode($mockResponse, true);
        $this->assertEquals('ADD_DEPENSE', $result['intent']);
        $this->assertEquals(5000, $result['params']['montant_fcfa']);
        $this->assertEquals('fr', $result['language']);
        $this->assertArrayHasKey('response', $result);
    }

    public function test_action_executor_cree_depense(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        app()->instance('tenant', $org);

        $waUser = WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        $executor = app(\App\Services\Whatsapp\ActionExecutor::class);
        $result   = $executor->execute('ADD_DEPENSE', [
            'montant_fcfa'  => 15000,
            'categorie'     => 'intrant',
            'description'   => '3 sacs urée',
            'date_depense'  => '2026-04-24',
            'campagne_id'   => null,
        ], $waUser, 'fr');

        $this->assertStringContainsString('✅', $result['response']);
        $this->assertDatabaseHas('depenses', ['montant_fcfa' => 15000, 'categorie' => 'intrant']);
    }

    public function test_webhook_numero_inconnu_retourne_message_aide(): void
    {
        $response = $this->call('POST', '/api/whatsapp/webhook', [
            'From' => 'whatsapp:+221000000000',
            'Body' => 'Bonjour',
        ]);

        $response->assertOk();
        $this->assertStringContainsString('lié', $response->getContent());
    }

    public function test_webhook_flux_complet_ajout_depense(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        $this->mock(AgentService::class, function ($mock) {
            $mock->shouldReceive('process')->once()->andReturn([
                'intent'   => 'ADD_DEPENSE',
                'language' => 'fr',
                'params'   => ['montant_fcfa' => 8000, 'categorie' => 'carburant', 'description' => 'gasoil', 'date_depense' => '2026-04-24', 'campagne_id' => null],
                'response' => 'Vous voulez enregistrer 8 000 FCFA pour Carburant. Tapez OUI pour confirmer.',
            ]);
        });

        $response1 = $this->call('POST', '/api/whatsapp/webhook', [
            'From' => 'whatsapp:+221770809798',
            'Body' => "J'ai acheté du gasoil pour 8000 FCFA",
        ]);
        $response1->assertOk();
        $this->assertStringContainsString('confirmer', $response1->getContent());

        $response2 = $this->call('POST', '/api/whatsapp/webhook', [
            'From' => 'whatsapp:+221770809798',
            'Body' => 'OUI',
        ]);
        $response2->assertOk();
        $this->assertStringContainsString('✅', $response2->getContent());

        $this->assertDatabaseHas('depenses', ['montant_fcfa' => 8000, 'categorie' => 'carburant']);
    }

    public function test_webhook_annulation_supprime_etat(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        $this->mock(AgentService::class, function ($mock) {
            $mock->shouldReceive('process')->once()->andReturn([
                'intent' => 'ADD_DEPENSE', 'language' => 'fr',
                'params' => ['montant_fcfa' => 5000, 'categorie' => 'intrant', 'description' => 'test', 'date_depense' => '2026-04-24', 'campagne_id' => null],
                'response' => 'Confirmer ?',
            ]);
        });

        $this->call('POST', '/api/whatsapp/webhook', ['From' => 'whatsapp:+221770809798', 'Body' => 'test']);
        $response = $this->call('POST', '/api/whatsapp/webhook', ['From' => 'whatsapp:+221770809798', 'Body' => 'NON']);

        $response->assertOk();
        $this->assertStringContainsString('Annulé', $response->getContent());
        $this->assertDatabaseMissing('depenses', ['montant_fcfa' => 5000]);
    }
}

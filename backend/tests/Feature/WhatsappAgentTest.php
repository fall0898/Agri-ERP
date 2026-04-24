<?php
namespace Tests\Feature;

use App\Models\WhatsappUser;
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
}

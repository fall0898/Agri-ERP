<?php

namespace Tests\Feature;

use App\Models\AbonnementHistorique;
use App\Models\Organisation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class PaiementTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_initier_paiement_wave_cree_historique(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Http::fake([
            'api.wave.com/*' => Http::response([
                'wave_launch_url' => 'https://wave.com/pay/abc123',
            ], 200),
        ]);

        $response = $this->postJson('/api/abonnement/paiement/initier', [
            'processeur' => 'wave',
            'plan'       => 'pro',
            'telephone'  => '+221770000000',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['payment_url', 'reference_id']);

        $this->assertDatabaseHas('abonnements_historique', [
            'organisation_id'     => $org->id,
            'plan_nouveau'        => 'pro',
            'processeur_paiement' => 'wave',
            'statut'              => 'en_attente',
        ]);
    }

    public function test_initier_paiement_echoue_si_api_wave_erreur(): void
    {
        $this->creerTenantAdmin();

        Http::fake([
            'api.wave.com/*' => Http::response(['error' => 'unauthorized'], 401),
        ]);

        $response = $this->postJson('/api/abonnement/paiement/initier', [
            'processeur' => 'wave',
            'plan'       => 'pro',
            'telephone'  => '+221770000000',
        ]);

        $response->assertStatus(503);
    }

    public function test_verifier_paiement_reussi_upgrade_plan(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        AbonnementHistorique::create([
            'organisation_id'     => $org->id,
            'plan_precedent'      => 'gratuit',
            'plan_nouveau'        => 'pro',
            'montant_fcfa'        => 10000,
            'processeur_paiement' => 'wave',
            'reference_paiement'  => 'AGRIERP-TEST123',
            'statut'              => 'en_attente',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => null,
        ]);

        Http::fake([
            'api.wave.com/*' => Http::response([
                'data' => [[
                    'payment_status'   => 'succeeded',
                    'amount'           => 10000,
                    'client_reference' => 'AGRIERP-TEST123',
                ]],
            ], 200),
        ]);

        $response = $this->postJson('/api/abonnement/paiement/verifier', [
            'reference_id' => 'AGRIERP-TEST123',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['statut' => 'reussi']);

        $org->refresh();
        $this->assertEquals('pro', $org->plan);
        $this->assertNotNull($org->plan_expire_at);
    }

    public function test_verifier_paiement_deja_paye_retourne_statut(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        AbonnementHistorique::create([
            'organisation_id'     => $org->id,
            'plan_precedent'      => 'gratuit',
            'plan_nouveau'        => 'pro',
            'montant_fcfa'        => 10000,
            'processeur_paiement' => 'wave',
            'reference_paiement'  => 'AGRIERP-DEJA-PAYE',
            'statut'              => 'paye',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => now()->addDays(30)->toDateString(),
        ]);

        Http::fake(); // Should NOT be called

        $response = $this->postJson('/api/abonnement/paiement/verifier', [
            'reference_id' => 'AGRIERP-DEJA-PAYE',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['statut' => 'paye']);

        Http::assertNothingSent();
    }

    public function test_webhook_wave_confirme_paiement(): void
    {
        $org = Organisation::factory()->create(['plan' => 'gratuit']);

        // Bind tenant manually since this is a public webhook route (no auth middleware)
        app()->instance('tenant', $org);

        AbonnementHistorique::create([
            'organisation_id'     => $org->id,
            'plan_precedent'      => 'gratuit',
            'plan_nouveau'        => 'pro',
            'montant_fcfa'        => 10000,
            'processeur_paiement' => 'wave',
            'reference_paiement'  => 'AGRIERP-WEBHOOK01',
            'statut'              => 'en_attente',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => null,
        ]);

        $payload   = json_encode(['payment_status' => 'succeeded', 'client_reference' => 'AGRIERP-WEBHOOK01']);
        $secretKey = config('services.wave.secret_key', 'test-secret');
        $signature = hash_hmac('sha256', $payload, $secretKey);

        $response = $this->withHeaders(['X-Wave-Signature' => $signature])
                         ->postJson('/api/webhooks/wave', json_decode($payload, true));

        $response->assertStatus(200);

        $org->refresh();
        $this->assertEquals('pro', $org->plan);
    }

    public function test_webhook_wave_rejette_signature_invalide(): void
    {
        $response = $this->withHeaders(['X-Wave-Signature' => 'invalide'])
                         ->postJson('/api/webhooks/wave', ['payment_status' => 'succeeded']);

        $response->assertStatus(400);
    }

    public function test_changer_plan_gratuit(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/abonnement/changer', ['plan' => 'gratuit']);

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Plan Gratuit activé. Valide 7 jours.']);
    }
}

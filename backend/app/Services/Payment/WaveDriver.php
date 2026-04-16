<?php
// backend/app/Services/Payment/WaveDriver.php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WaveDriver implements PaymentDriverInterface
{
    private string $apiKey;
    private string $secretKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey    = config('services.wave.api_key');
        $this->secretKey = config('services.wave.secret_key');
        $this->apiUrl    = config('services.wave.api_url', 'https://api.wave.com/v1');
    }

    public function initier(int $montant, string $telephone, string $description): array
    {
        $reference = 'AGRIERP-' . strtoupper(Str::random(10));

        $response = Http::withToken($this->apiKey)
            ->post("{$this->apiUrl}/checkout/sessions", [
                'currency'         => 'XOF',
                'amount'           => $montant,
                'error_url'        => config('app.frontend_url') . '/abonnement?statut=erreur&ref=' . $reference,
                'success_url'      => config('app.frontend_url') . '/abonnement?statut=succes&ref=' . $reference,
                'client_reference' => $reference,
                'restrict_bill_to' => $telephone ?: null,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Wave API error: ' . $response->body());
        }

        return [
            'payment_url'  => $response->json('wave_launch_url'),
            'reference_id' => $reference,
        ];
    }

    public function verifier(string $referenceId): array
    {
        $response = Http::withToken($this->apiKey)
            ->get("{$this->apiUrl}/checkout/sessions", [
                'client_reference' => $referenceId,
            ]);

        if ($response->failed()) {
            return ['statut' => 'en_attente'];
        }

        $session = $response->json('data.0');
        if (!$session) return ['statut' => 'en_attente'];

        return match($session['payment_status']) {
            'succeeded'  => ['statut' => 'reussi', 'montant' => $session['amount']],
            'processing' => ['statut' => 'en_attente'],
            default      => ['statut' => 'echoue'],
        };
    }

    public function validerSignatureWebhook(string $payload, string $signature): bool
    {
        $expected = hash_hmac('sha256', $payload, $this->secretKey);
        return hash_equals($expected, $signature);
    }
}

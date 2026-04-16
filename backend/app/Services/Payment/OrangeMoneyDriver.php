<?php
// backend/app/Services/Payment/OrangeMoneyDriver.php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class OrangeMoneyDriver implements PaymentDriverInterface
{
    private string $apiKey;
    private string $secretKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey    = config('services.orange_money.api_key');
        $this->secretKey = config('services.orange_money.secret_key');
        $this->apiUrl    = config('services.orange_money.api_url', 'https://api.orange.com/orange-money-webpay/dev/v1');
    }

    public function initier(int $montant, string $telephone, string $description): array
    {
        $reference = 'AGRIERP-' . strtoupper(Str::random(10));

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $this->apiKey])
            ->post("{$this->apiUrl}/webpayment", [
                'merchant_key' => config('services.orange_money.merchant_key'),
                'currency'     => 'OUV',
                'order_id'     => $reference,
                'amount'       => $montant,
                'return_url'   => config('app.frontend_url') . '/abonnement?statut=succes&ref=' . $reference,
                'cancel_url'   => config('app.frontend_url') . '/abonnement?statut=annule&ref=' . $reference,
                'notif_url'    => config('app.url') . '/api/webhooks/orange-money',
                'lang'         => 'fr',
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Orange Money API error: ' . $response->body());
        }

        return [
            'payment_url'  => $response->json('payment_url'),
            'reference_id' => $reference,
        ];
    }

    public function verifier(string $referenceId): array
    {
        // Orange Money ne propose pas toujours de polling — on lit l'historique local
        $historique = \App\Models\AbonnementHistorique::where('reference_paiement', $referenceId)->first();
        if (!$historique) return ['statut' => 'en_attente'];

        return ['statut' => $historique->statut === 'paye' ? 'reussi' : 'en_attente'];
    }

    public function validerSignatureWebhook(string $payload, string $signature): bool
    {
        $expected = hash_hmac('sha256', $payload, $this->secretKey);
        return hash_equals($expected, $signature);
    }
}

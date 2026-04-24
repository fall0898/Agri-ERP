<?php
// backend/app/Http/Controllers/Api/WebhookController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbonnementHistorique;
use App\Models\AuditLog;
use App\Models\Organisation;
use App\Services\Payment\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function wave(Request $request): Response
    {
        return $this->traiterWebhook($request, 'wave', 'X-Wave-Signature');
    }

    public function orangeMoney(Request $request): Response
    {
        return $this->traiterWebhook($request, 'orange_money', 'X-Orange-Signature');
    }

    private function traiterWebhook(Request $request, string $processeur, string $headerSignature): Response
    {
        $payload   = $request->getContent();
        $signature = $request->header($headerSignature, '');

        Log::info("Webhook {$processeur} reçu", ['payload_length' => strlen($payload)]);

        $driver = $this->paymentService->driver($processeur);
        if (!$driver->validerSignatureWebhook($payload, $signature)) {
            Log::warning("Webhook {$processeur} : signature invalide");
            return response('Signature invalide', 400);
        }

        $data        = json_decode($payload, true);
        $referenceId = $data['client_reference'] ?? $data['order_id'] ?? null;

        if (!$referenceId) {
            return response('Référence manquante', 400);
        }

        $historique = AbonnementHistorique::where('reference_paiement', $referenceId)->first();
        if (!$historique) {
            return response('Référence inconnue', 404);
        }

        if ($historique->statut === 'paye') {
            return response('Déjà traité', 200);
        }

        $estReussi = $this->detecterSucces($processeur, $data);

        if ($estReussi) {
            $historique->update([
                'statut'   => 'paye',
                'date_fin' => now()->addYear()->toDateString(),
            ]);

            $organisation = Organisation::find($historique->organisation_id);
            $organisation->update([
                'plan'           => $historique->plan_nouveau,
                'plan_expire_at' => now()->addYear(),
            ]);

            AuditLog::create([
                'organisation_id'  => $organisation->id,
                'user_id'          => null,
                'action'           => 'webhook_paiement_confirme',
                'model_type'       => 'AbonnementHistorique',
                'model_id'         => $historique->id,
                'nouvelles_valeurs' => ['processeur' => $processeur, 'plan' => $historique->plan_nouveau],
            ]);

            Log::info("Webhook {$processeur} : paiement confirmé pour org {$organisation->id}");
        }

        return response('OK', 200);
    }

    private function detecterSucces(string $processeur, array $data): bool
    {
        return match($processeur) {
            'wave'         => ($data['payment_status'] ?? '') === 'succeeded',
            'orange_money' => ($data['status'] ?? '') === 'SUCCESS',
            default        => false,
        };
    }
}

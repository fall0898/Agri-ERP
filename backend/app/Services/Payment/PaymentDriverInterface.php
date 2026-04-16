<?php
// backend/app/Services/Payment/PaymentDriverInterface.php

namespace App\Services\Payment;

interface PaymentDriverInterface
{
    /**
     * Initier une transaction de paiement.
     * @return array{payment_url: string, reference_id: string}
     */
    public function initier(int $montant, string $telephone, string $description): array;

    /**
     * Vérifier le statut d'une transaction.
     * @return array{statut: 'en_attente'|'reussi'|'echoue', montant?: int}
     */
    public function verifier(string $referenceId): array;

    /**
     * Valider la signature HMAC d'un webhook entrant.
     */
    public function validerSignatureWebhook(string $payload, string $signature): bool;
}

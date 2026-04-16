<?php
// backend/app/Services/Payment/PaymentService.php

namespace App\Services\Payment;

class PaymentService
{
    public function driver(string $processeur): PaymentDriverInterface
    {
        return match($processeur) {
            'wave'         => new WaveDriver(),
            'orange_money' => new OrangeMoneyDriver(),
            default        => throw new \InvalidArgumentException("Processeur inconnu : {$processeur}"),
        };
    }
}

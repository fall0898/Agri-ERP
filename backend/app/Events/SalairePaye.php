<?php

namespace App\Events;

use App\Models\PaiementSalaire;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SalairePaye
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly PaiementSalaire $paiement) {}
}

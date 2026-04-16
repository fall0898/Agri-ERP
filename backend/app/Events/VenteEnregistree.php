<?php

namespace App\Events;

use App\Models\Vente;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VenteEnregistree
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Vente $vente) {}
}

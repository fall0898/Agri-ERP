<?php

namespace App\Events;

use App\Models\MouvementStock;
use App\Models\Stock;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockAchete
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Stock $stock,
        public readonly MouvementStock $mouvement
    ) {}
}

<?php

namespace App\Events;

use App\Models\Stock;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockEnAlerte
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Stock $stock) {}
}

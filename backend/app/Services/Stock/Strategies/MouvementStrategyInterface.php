<?php

namespace App\Services\Stock\Strategies;

use App\Models\MouvementStock;
use App\Models\Stock;

interface MouvementStrategyInterface
{
    public function execute(Stock $stock, array $data): MouvementStock;
}

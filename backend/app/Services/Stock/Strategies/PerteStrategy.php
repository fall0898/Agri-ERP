<?php

namespace App\Services\Stock\Strategies;

use App\Events\StockEnAlerte;
use App\Models\MouvementStock;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class PerteStrategy implements MouvementStrategyInterface
{
    public function execute(Stock $stock, array $data): MouvementStock
    {
        return DB::transaction(function () use ($stock, $data) {
            $mouvement = MouvementStock::create([
                'stock_id' => $stock->id,
                'type' => 'perte',
                'quantite' => $data['quantite'],
                'motif' => $data['motif'] ?? null,
                'date_mouvement' => $data['date_mouvement'],
            ]);

            $stock->decrement('quantite_actuelle', $data['quantite']);
            $stock->refresh();

            if ($stock->isEnAlerte()) {
                StockEnAlerte::dispatch($stock);
            }

            return $mouvement;
        });
    }
}

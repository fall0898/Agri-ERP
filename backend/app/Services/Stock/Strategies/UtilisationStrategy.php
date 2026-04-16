<?php

namespace App\Services\Stock\Strategies;

use App\Events\StockEnAlerte;
use App\Models\MouvementStock;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class UtilisationStrategy implements MouvementStrategyInterface
{
    public function execute(Stock $stock, array $data): MouvementStock
    {
        return DB::transaction(function () use ($stock, $data) {
            $mouvement = MouvementStock::create([
                'stock_id' => $stock->id,
                'type' => 'utilisation',
                'quantite' => $data['quantite'],
                'culture_id' => $data['culture_id'] ?? null,
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

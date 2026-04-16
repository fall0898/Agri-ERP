<?php

namespace App\Services\Stock\Strategies;

use App\Models\MouvementStock;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class AjustementStrategy implements MouvementStrategyInterface
{
    public function execute(Stock $stock, array $data): MouvementStock
    {
        return DB::transaction(function () use ($stock, $data) {
            $ancienneQuantite = $stock->quantite_actuelle;
            $nouvelleQuantite = $data['nouvelle_quantite'] ?? ($ancienneQuantite + $data['quantite']);
            $delta = $nouvelleQuantite - $ancienneQuantite;

            $mouvement = MouvementStock::create([
                'stock_id' => $stock->id,
                'type' => 'ajustement',
                'quantite' => abs($delta),
                'motif' => $data['motif'] ?? 'Ajustement de stock',
                'date_mouvement' => $data['date_mouvement'],
            ]);

            $stock->update(['quantite_actuelle' => max(0, $nouvelleQuantite)]);

            return $mouvement;
        });
    }
}

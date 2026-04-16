<?php

namespace App\Services\Stock\Strategies;

use App\Events\StockAchete;
use App\Events\StockEnAlerte;
use App\Models\MouvementStock;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class AchatStrategy implements MouvementStrategyInterface
{
    public function execute(Stock $stock, array $data): MouvementStock
    {
        return DB::transaction(function () use ($stock, $data) {
            $montantTotal = isset($data['prix_unitaire_fcfa']) && isset($data['quantite'])
                ? round($data['quantite'] * $data['prix_unitaire_fcfa'], 2)
                : null;

            $mouvement = MouvementStock::create([
                'stock_id' => $stock->id,
                'type' => 'achat',
                'quantite' => $data['quantite'],
                'prix_unitaire_fcfa' => $data['prix_unitaire_fcfa'] ?? null,
                'montant_total_fcfa' => $montantTotal,
                'fournisseur' => $data['fournisseur'] ?? null,
                'date_mouvement' => $data['date_mouvement'],
                'motif' => $data['motif'] ?? null,
            ]);

            $stock->increment('quantite_actuelle', $data['quantite']);
            $stock->refresh();

            StockAchete::dispatch($stock, $mouvement);

            if ($stock->isEnAlerte()) {
                StockEnAlerte::dispatch($stock);
            }

            return $mouvement;
        });
    }
}

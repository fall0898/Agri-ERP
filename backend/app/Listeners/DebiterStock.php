<?php

namespace App\Listeners;

use App\Events\IntrantUtilise;
use App\Events\StockEnAlerte;
use App\Models\MouvementStock;
use Illuminate\Contracts\Queue\ShouldQueue;

class DebiterStock implements ShouldQueue
{
    public function handle(IntrantUtilise $event): void
    {
        $utilisation = $event->utilisation;

        if ($utilisation->stock_id === null) {
            return;
        }

        $stock = $utilisation->stock;

        MouvementStock::create([
            'stock_id' => $stock->id,
            'type' => 'utilisation',
            'quantite' => $utilisation->quantite,
            'culture_id' => $utilisation->culture_id,
            'motif' => "Utilisation pour culture : {$utilisation->culture->nom}",
            'date_mouvement' => $utilisation->date_utilisation,
        ]);

        $stock->decrement('quantite_actuelle', $utilisation->quantite);
        $stock->refresh();

        if ($stock->isEnAlerte()) {
            StockEnAlerte::dispatch($stock);
        }
    }
}

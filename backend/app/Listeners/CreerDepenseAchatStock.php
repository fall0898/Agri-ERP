<?php

namespace App\Listeners;

use App\Events\StockAchete;
use App\Models\Depense;
use Illuminate\Contracts\Queue\ShouldQueue;

class CreerDepenseAchatStock implements ShouldQueue
{
    public function handle(StockAchete $event): void
    {
        $mouvement = $event->mouvement;
        $stock = $event->stock;

        if ($mouvement->montant_total_fcfa === null || $mouvement->montant_total_fcfa <= 0) {
            return;
        }

        $depense = Depense::create([
            'organisation_id' => $stock->organisation_id,
            'user_id' => $stock->user_id,
            'categorie' => 'intrant',
            'description' => "Achat stock : {$stock->nom}" . ($mouvement->fournisseur ? " (Fournisseur: {$mouvement->fournisseur})" : ''),
            'montant_fcfa' => $mouvement->montant_total_fcfa,
            'date_depense' => $mouvement->date_mouvement,
            'est_auto_generee' => true,
            'source_type' => 'mouvement_stock',
            'source_id' => $mouvement->id,
        ]);

        $mouvement->update(['depense_id' => $depense->id]);
    }
}

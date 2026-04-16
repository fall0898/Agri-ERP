<?php

namespace App\Listeners;

use App\Events\SalairePaye;
use App\Models\Depense;
use Illuminate\Contracts\Queue\ShouldQueue;

class CreerDepenseSalaire implements ShouldQueue
{
    public function handle(SalairePaye $event): void
    {
        $paiement = $event->paiement;
        $employe = $paiement->employe;

        $depense = Depense::create([
            'organisation_id' => $paiement->organisation_id,
            'user_id' => $employe->user_id,
            'categorie' => 'salaire',
            'description' => "Salaire {$employe->nom} — {$paiement->mois}",
            'montant_fcfa' => $paiement->montant_fcfa,
            'date_depense' => $paiement->date_paiement,
            'est_auto_generee' => true,
            'source_type' => 'paiement_salaire',
            'source_id' => $paiement->id,
        ]);

        $paiement->update(['depense_id' => $depense->id]);
    }
}

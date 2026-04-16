<?php

namespace App\Services\Employe;

use App\Events\SalairePaye;
use App\Models\Employe;
use App\Models\PaiementSalaire;
use Illuminate\Support\Facades\DB;

class SalaireService
{
    public function payerSalaire(Employe $employe, array $data): PaiementSalaire
    {
        return DB::transaction(function () use ($employe, $data) {
            $paiement = PaiementSalaire::create([
                'organisation_id' => $employe->organisation_id,
                'employe_id' => $employe->id,
                'montant_fcfa' => $data['montant_fcfa'],
                'mois' => $data['mois'],
                'date_paiement' => $data['date_paiement'],
                'mode_paiement' => $data['mode_paiement'] ?? 'especes',
                'notes' => $data['notes'] ?? null,
            ]);

            SalairePaye::dispatch($paiement->load('employe'));

            return $paiement->fresh();
        });
    }
}

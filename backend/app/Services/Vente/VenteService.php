<?php

namespace App\Services\Vente;

use App\Events\VenteEnregistree;
use App\Models\Vente;
use Illuminate\Support\Facades\DB;

class VenteService
{
    public function creer(array $data): Vente
    {
        return DB::transaction(function () use ($data) {
            $data['montant_total_fcfa'] = round($data['quantite_kg'] * $data['prix_unitaire_fcfa'], 2);

            $vente = Vente::create($data);

            VenteEnregistree::dispatch($vente);

            return $vente->load(['champ', 'culture', 'campagne']);
        });
    }

    public function modifier(Vente $vente, array $data): Vente
    {
        if (isset($data['quantite_kg']) || isset($data['prix_unitaire_fcfa'])) {
            $quantite = $data['quantite_kg'] ?? $vente->quantite_kg;
            $prix = $data['prix_unitaire_fcfa'] ?? $vente->prix_unitaire_fcfa;
            $data['montant_total_fcfa'] = round($quantite * $prix, 2);
        }

        $vente->update($data);

        return $vente->fresh()->load(['champ', 'culture', 'campagne']);
    }
}

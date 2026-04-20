<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class VenteResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                 => $this->id,
            'produit'            => $this->produit,
            'quantite_kg'        => $this->quantite_kg,
            'unite'              => $this->unite ?? 'kg',
            'prix_unitaire_fcfa' => $this->prix_unitaire_fcfa,
            'montant_total_fcfa' => $this->montant_total_fcfa,
            'date_vente'         => $this->date_vente,
            'acheteur'           => $this->acheteur,
            'notes'              => $this->notes,
            'est_auto_generee'   => $this->est_auto_generee,
            'source_type'        => $this->source_type,
            'source_id'          => $this->source_id,
            'champ'              => $this->whenLoaded('champ', fn() => $this->champ ? ['id' => $this->champ->id, 'nom' => $this->champ->nom] : null),
            'culture'            => $this->whenLoaded('culture', fn() => $this->culture ? ['id' => $this->culture->id, 'nom' => $this->culture->nom] : null),
            'campagne'           => $this->whenLoaded('campagne', fn() => $this->campagne ? ['id' => $this->campagne->id, 'nom' => $this->campagne->nom] : null),
        ];
    }
}

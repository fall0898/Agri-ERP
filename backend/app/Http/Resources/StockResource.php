<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StockResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                => $this->id,
            'nom'               => $this->nom,
            'categorie'         => $this->categorie,
            'quantite_actuelle' => $this->quantite_actuelle,
            'unite'             => $this->unite,
            'seuil_alerte'      => $this->seuil_alerte,
            'est_actif'         => $this->est_actif,
        ];
    }
}

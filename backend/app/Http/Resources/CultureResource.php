<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CultureResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                     => $this->id,
            'nom'                    => $this->nom,
            'variete'                => $this->variete,
            'saison'                 => $this->saison,
            'annee'                  => $this->annee,
            'statut'                 => $this->statut,
            'superficie_cultivee_ha' => $this->superficie_cultivee_ha,
            'date_semis'             => $this->date_semis,
            'date_recolte_prevue'    => $this->date_recolte_prevue,
            'champ_id'               => $this->champ_id,
            'champ'                  => $this->whenLoaded('champ', fn() => ['id' => $this->champ->id, 'nom' => $this->champ->nom]),
        ];
    }
}

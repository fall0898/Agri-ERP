<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TacheResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'titre'       => $this->titre,
            'description' => $this->description,
            'date_debut'  => $this->date_debut,
            'date_fin'    => $this->date_fin,
            'statut'      => $this->statut,
            'priorite'    => $this->priorite,
            'employe'     => $this->whenLoaded('employe', fn() => $this->employe ? ['id' => $this->employe->id, 'nom' => $this->employe->nom] : null),
            'champ'       => $this->whenLoaded('champ', fn() => $this->champ ? ['id' => $this->champ->id, 'nom' => $this->champ->nom] : null),
            'culture'     => $this->whenLoaded('culture', fn() => $this->culture ? ['id' => $this->culture->id, 'nom' => $this->culture->nom] : null),
            'created_at'  => $this->created_at,
        ];
    }
}

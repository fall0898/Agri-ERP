<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DepenseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'description'      => $this->description,
            'montant_fcfa'     => $this->montant_fcfa,
            'categorie'        => $this->categorie,
            'date_depense'     => $this->date_depense,
            'notes'            => $this->notes,
            'est_auto_generee' => $this->est_auto_generee,
            'source_type'      => $this->source_type,
            'source_id'        => $this->source_id,
            'champ'            => $this->whenLoaded('champ', fn() => ['id' => $this->champ->id, 'nom' => $this->champ->nom]),
            'user'             => $this->whenLoaded('user', fn() => ['id' => $this->user->id, 'nom' => $this->user->nom]),
            'campagne'         => $this->whenLoaded('campagne', fn() => ['id' => $this->campagne->id, 'nom' => $this->campagne->nom]),
        ];
    }
}

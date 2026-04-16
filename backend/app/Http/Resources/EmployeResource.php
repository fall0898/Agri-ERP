<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EmployeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'nom'                  => $this->nom,
            'poste'                => $this->poste,
            'telephone'            => $this->telephone,
            'salaire_mensuel_fcfa' => $this->salaire_mensuel_fcfa,
            'est_actif'            => $this->est_actif,
            'date_embauche'        => $this->date_embauche,
        ];
    }
}

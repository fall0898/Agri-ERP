<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChampResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'nom'           => $this->nom,
            'superficie_ha' => $this->superficie_ha,
            'localisation'  => $this->localisation,
            'latitude'      => $this->latitude,
            'longitude'     => $this->longitude,
            'description'   => $this->description,
            'est_actif'     => $this->est_actif,
            'user'          => $this->whenLoaded('user', fn() => ['id' => $this->user->id, 'nom' => $this->user->nom]),
            'cultures'      => $this->whenLoaded('cultures'),
            'created_at'    => $this->created_at,
        ];
    }
}

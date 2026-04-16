<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class VenteCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data'  => VenteResource::collection($this->collection),
            'total' => $this->collection->sum('montant_total_fcfa'),
        ];
    }
}

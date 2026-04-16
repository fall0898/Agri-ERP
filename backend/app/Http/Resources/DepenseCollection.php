<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class DepenseCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data'  => DepenseResource::collection($this->collection),
            'total' => $this->collection->sum('montant_fcfa'),
        ];
    }
}

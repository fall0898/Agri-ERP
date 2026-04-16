<?php

namespace App\Listeners;

use App\Events\TenantCree;
use App\Models\Intrant;

class CreerIntrantsDefaut
{
    private array $intrantsDefaut = [
        ['nom' => 'NPK 15-15-15', 'categorie' => 'Engrais', 'unite' => 'kg'],
        ['nom' => 'Urée 46%', 'categorie' => 'Engrais', 'unite' => 'kg'],
        ['nom' => 'Semence de riz', 'categorie' => 'Semence', 'unite' => 'kg'],
        ['nom' => "Semence d'oignon", 'categorie' => 'Semence', 'unite' => 'kg'],
        ['nom' => 'Semence de mil', 'categorie' => 'Semence', 'unite' => 'kg'],
        ['nom' => 'Herbicide total', 'categorie' => 'Phytosanitaire', 'unite' => 'L'],
        ['nom' => 'Insecticide', 'categorie' => 'Phytosanitaire', 'unite' => 'L'],
        ['nom' => 'Fumure organique', 'categorie' => 'Engrais', 'unite' => 'kg'],
        ['nom' => 'Fongicide', 'categorie' => 'Phytosanitaire', 'unite' => 'L'],
    ];

    public function handle(TenantCree $event): void
    {
        if (Intrant::where('organisation_id', $event->organisation->id)->exists()) {
            return;
        }

        foreach ($this->intrantsDefaut as $intrant) {
            Intrant::create([
                'organisation_id' => $event->organisation->id,
                ...$intrant,
            ]);
        }
    }
}

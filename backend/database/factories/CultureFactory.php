<?php

namespace Database\Factories;

use App\Models\Culture;
use Illuminate\Database\Eloquent\Factories\Factory;

class CultureFactory extends Factory
{
    protected $model = Culture::class;

    public function definition(): array
    {
        return [
            'organisation_id'        => 1,
            'champ_id'               => 1,
            'nom'                    => $this->faker->randomElement(['Maïs', 'Mil', 'Arachide', 'Niébé']),
            'variete'                => $this->faker->optional()->word(),
            'saison'                 => $this->faker->randomElement(['normale', 'contre_saison']),
            'annee'                  => 2026,
            'statut'                 => 'en_cours',
            'superficie_cultivee_ha' => $this->faker->randomFloat(2, 0.5, 10),
        ];
    }
}

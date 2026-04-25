<?php

namespace Database\Factories;

use App\Models\Tache;
use Illuminate\Database\Eloquent\Factories\Factory;

class TacheFactory extends Factory
{
    protected $model = Tache::class;

    public function definition(): array
    {
        return [
            'organisation_id' => 1,
            'employe_id'      => 1,
            'titre'           => $this->faker->sentence(3),
            'description'     => $this->faker->optional()->sentence(),
            'date_debut'      => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'date_fin'        => null,
            'statut'          => 'a_faire',
            'priorite'        => $this->faker->randomElement(['basse', 'normale', 'haute']),
        ];
    }
}

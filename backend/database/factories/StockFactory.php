<?php

namespace Database\Factories;

use App\Models\Stock;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockFactory extends Factory
{
    protected $model = Stock::class;

    public function definition(): array
    {
        return [
            'organisation_id'   => 1,
            'nom'               => $this->faker->word() . ' stock',
            'categorie'         => $this->faker->randomElement(['semence', 'intrant', 'materiel']),
            'quantite_actuelle' => $this->faker->numberBetween(0, 200),
            'unite'             => $this->faker->randomElement(['kg', 'litre', 'sac']),
            'seuil_alerte'      => $this->faker->numberBetween(5, 20),
            'est_actif'         => true,
        ];
    }
}

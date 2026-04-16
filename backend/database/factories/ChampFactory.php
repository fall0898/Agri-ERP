<?php

namespace Database\Factories;

use App\Models\Champ;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Champ>
 */
class ChampFactory extends Factory
{
    protected $model = Champ::class;

    public function definition(): array
    {
        return [
            'organisation_id' => Organisation::factory(),
            'user_id'         => User::factory(),
            'nom'             => $this->faker->words(2, true) . ' Field',
            'superficie_ha'   => $this->faker->randomFloat(2, 0.5, 50),
            'localisation'    => $this->faker->city(),
            'est_actif'       => true,
        ];
    }
}

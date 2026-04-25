<?php

namespace Database\Factories;

use App\Models\Employe;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeFactory extends Factory
{
    protected $model = Employe::class;

    public function definition(): array
    {
        return [
            'organisation_id'      => 1,
            'user_id'              => null,
            'nom'                  => $this->faker->name(),
            'telephone'            => '+221' . $this->faker->numerify('7########'),
            'poste'                => $this->faker->randomElement(['Cultivateur', 'Gardien', 'Tractoriste']),
            'salaire_mensuel_fcfa' => $this->faker->numberBetween(50000, 150000),
            'est_actif'            => true,
            'date_embauche'        => $this->faker->date(),
        ];
    }
}

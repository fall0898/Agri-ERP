<?php

namespace Database\Factories;

use App\Models\Depense;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Depense>
 */
class DepenseFactory extends Factory
{
    protected $model = Depense::class;

    public function definition(): array
    {
        return [
            'organisation_id'  => Organisation::factory(),
            'user_id'          => User::factory(),
            'champ_id'         => null,
            'campagne_id'      => null,
            'description'      => $this->faker->sentence(4),
            'montant_fcfa'     => $this->faker->randomFloat(2, 1000, 500000),
            'categorie'        => $this->faker->randomElement(['intrant', 'salaire', 'materiel', 'carburant', 'main_oeuvre']),
            'date_depense'     => $this->faker->dateTimeBetween('-6 months', 'now'),
            'est_auto_generee' => false,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Organisation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Organisation>
 */
class OrganisationFactory extends Factory
{
    protected $model = Organisation::class;

    public function definition(): array
    {
        return [
            'nom'                   => $this->faker->company(),
            'slug'                  => $this->faker->unique()->slug(),
            'email_contact'         => $this->faker->companyEmail(),
            'telephone'             => $this->faker->optional()->phoneNumber(),
            'devise'                => 'FCFA',
            'plan'                  => 'pro',
            'plan_expire_at'        => now()->addYear(),
            'est_active'            => true,
            'est_suspendue'         => false,
            'campagne_debut_mois'   => 10,
            'campagne_debut_jour'   => 1,
        ];
    }
}

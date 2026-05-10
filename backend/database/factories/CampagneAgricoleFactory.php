<?php

namespace Database\Factories;

use App\Models\CampagneAgricole;
use App\Models\Organisation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CampagneAgricole>
 */
class CampagneAgricoleFactory extends Factory
{
    protected $model = CampagneAgricole::class;

    public function definition(): array
    {
        $annee = $this->faker->numberBetween(2023, 2026);

        return [
            'organisation_id' => Organisation::factory(),
            'nom'             => "Saison {$annee}/" . ($annee + 1),
            'date_debut'      => "{$annee}-11-01",
            'date_fin'        => ($annee + 1) . '-06-30',
            'est_courante'    => false,
            'notes'           => null,
        ];
    }
}

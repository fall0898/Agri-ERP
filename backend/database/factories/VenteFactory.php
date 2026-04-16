<?php

namespace Database\Factories;

use App\Models\Organisation;
use App\Models\User;
use App\Models\Vente;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vente>
 */
class VenteFactory extends Factory
{
    protected $model = Vente::class;

    public function definition(): array
    {
        $qte  = $this->faker->randomFloat(2, 10, 1000);
        $prix = $this->faker->randomElement([150, 200, 250, 300, 400, 500]);

        return [
            'organisation_id'    => Organisation::factory(),
            'user_id'            => User::factory(),
            'champ_id'           => null,
            'culture_id'         => null,
            'campagne_id'        => null,
            'produit'            => $this->faker->randomElement(['Oignon', 'Tomate', 'Riz', 'Mil']),
            'quantite_kg'        => $qte,
            'prix_unitaire_fcfa' => $prix,
            'montant_total_fcfa' => round($qte * $prix, 2),
            'date_vente'         => $this->faker->dateTimeBetween('-6 months', 'now'),
            'est_auto_generee'   => false,
        ];
    }
}

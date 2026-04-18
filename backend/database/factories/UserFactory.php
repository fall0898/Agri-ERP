<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $phone = '7' . fake()->numerify('########');   // 9 chiffres, ex: 770809798
        return [
            'nom'                     => fake()->name(),
            'telephone'               => fake()->unique()->numerify('7########'),
            'email'                   => $phone . '@agri-erp.local',
            'password'                => static::$password ??= Hash::make('password'),
            'remember_token'          => Str::random(10),
            'role'                    => 'lecteur',
            'est_actif'               => true,
            'organisation_id'         => null,
            'onboarding_complete'     => false,
        ];
    }
}

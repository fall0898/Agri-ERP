<?php

namespace App\Console\Commands;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdminUser extends Command
{
    protected $signature = 'app:create-super-admin
                            {--telephone=770809798 : Numéro de téléphone (sans indicatif)}
                            {--nom=Cheikh Ahmed : Nom complet}
                            {--password=password : Mot de passe initial}
                            {--org=kadiar : Slug ou nom partiel de l\'organisation}';

    protected $description = 'Crée un super-admin et l\'affecte à une organisation existante';

    public function handle(): int
    {
        $telephone = $this->option('telephone');
        $nom       = $this->option('nom');
        $password  = $this->option('password');
        $orgSearch = $this->option('org');

        // Trouver l'organisation
        $org = Organisation::where('slug', 'like', "%{$orgSearch}%")
            ->orWhere('nom', 'like', "%{$orgSearch}%")
            ->first();

        if (!$org) {
            $this->error("Organisation introuvable pour la recherche : {$orgSearch}");
            $this->line('Organisations disponibles :');
            Organisation::select('id', 'nom', 'slug')->get()->each(fn($o) => $this->line("  #{$o->id} {$o->nom} ({$o->slug})"));
            return self::FAILURE;
        }

        // Vérifier si le téléphone existe déjà
        $existing = User::where('telephone', $telephone)->first();
        if ($existing) {
            $existing->update([
                'role'            => 'super_admin',
                'organisation_id' => $org->id,
                'est_actif'       => true,
                'password'        => Hash::make($password),
            ]);
            $this->info("✓ Compte mis à jour — super_admin : #{$existing->id} — {$existing->nom}");
            $this->line("  Téléphone : {$telephone}");
            $this->line("  Mot de passe : {$password}");
            $this->line("  Organisation : {$org->nom} (#{$org->id})");
            return self::SUCCESS;
        }

        $user = User::create([
            'nom'             => $nom,
            'telephone'       => $telephone,
            'email'           => $telephone . '@agri-erp.local',
            'password'        => Hash::make($password),
            'role'            => 'super_admin',
            'organisation_id' => $org->id,
            'est_actif'       => true,
            'onboarding_complete' => true,
        ]);

        $this->info("✓ Super-admin créé avec succès !");
        $this->table(
            ['Champ', 'Valeur'],
            [
                ['ID',           $user->id],
                ['Nom',          $user->nom],
                ['Téléphone',    $telephone],
                ['Organisation', "{$org->nom} (#{$org->id})"],
                ['Mot de passe', $password . '  ← à changer dès la première connexion'],
            ]
        );

        return self::SUCCESS;
    }
}

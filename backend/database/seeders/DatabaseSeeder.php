<?php

namespace Database\Seeders;

use App\Models\CampagneAgricole;
use App\Models\Intrant;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super-Admin Plateforme (sans organisation)
        User::firstOrCreate(['email' => 'superadmin@agri-erp.com'], [
            'organisation_id' => null,
            'nom'             => 'Super Admin Agri-ERP',
            'telephone'       => '00000000',
            'password'        => Hash::make('password'),
            'role'            => 'super_admin',
            'est_actif'       => true,
            'onboarding_complete' => true,
        ]);

        // 2. Organisation Démo "Exploitation Kadiar"
        $organisation = Organisation::firstOrCreate(['slug' => 'kadiar-demo'], [
            'nom'               => 'Exploitation Kadiar',
            'slug'              => 'kadiar-demo',
            'email_contact'     => 'admin@kadiar-demo.com',
            'telephone'         => '+221 77 000 0000',
            'devise'            => 'FCFA',
            'plan'              => 'pro',
            'plan_expire_at'    => now()->addYear(),
            'periode_essai_fin' => now()->addDays(30),
            'est_active'        => true,
            'campagne_debut_mois' => 10,
            'campagne_debut_jour' => 1,
        ]);

        // 3. Admin du tenant démo
        User::firstOrCreate(['email' => 'admin@kadiar-demo.com'], [
            'organisation_id' => $organisation->id,
            'nom'             => 'Mamadou Diallo',
            'telephone'       => '77 000 0001',
            'password'        => Hash::make('password'),
            'role'            => 'admin',
            'est_actif'       => true,
            'onboarding_complete' => true,
        ]);

        // 4. Lecteur du tenant démo
        User::firstOrCreate(['email' => 'lecteur@kadiar-demo.com'], [
            'organisation_id' => $organisation->id,
            'nom'             => 'Aïssatou Bah',
            'telephone'       => '77 000 0002',
            'password'        => Hash::make('password'),
            'role'            => 'lecteur',
            'est_actif'       => true,
            'onboarding_complete' => true,
        ]);

        // 5. Campagne agricole courante
        if (!$organisation->campagnes()->exists()) {
            CampagneAgricole::create([
                'organisation_id' => $organisation->id,
                'nom' => 'Campagne 2025-2026',
                'date_debut' => '2025-10-01',
                'date_fin' => '2026-09-30',
                'est_courante' => true,
            ]);
        }

        // 6. Catalogue d'intrants de base
        $intrantsDefaut = [
            ['nom' => 'NPK 15-15-15', 'categorie' => 'Engrais', 'unite' => 'kg'],
            ['nom' => 'Urée 46%', 'categorie' => 'Engrais', 'unite' => 'kg'],
            ['nom' => 'Semence de riz', 'categorie' => 'Semence', 'unite' => 'kg'],
            ['nom' => "Semence d'oignon", 'categorie' => 'Semence', 'unite' => 'kg'],
            ['nom' => 'Semence de mil', 'categorie' => 'Semence', 'unite' => 'kg'],
            ['nom' => 'Herbicide total', 'categorie' => 'Phytosanitaire', 'unite' => 'L'],
            ['nom' => 'Insecticide', 'categorie' => 'Phytosanitaire', 'unite' => 'L'],
            ['nom' => 'Fumure organique', 'categorie' => 'Engrais', 'unite' => 'kg'],
            ['nom' => 'Fongicide', 'categorie' => 'Phytosanitaire', 'unite' => 'L'],
        ];

        foreach ($intrantsDefaut as $intrant) {
            if (!Intrant::where('organisation_id', $organisation->id)->where('nom', $intrant['nom'])->exists()) {
                Intrant::create(['organisation_id' => $organisation->id, ...$intrant]);
            }
        }

        $this->command->info('Seeder Agri-ERP execute avec succes !');
        $this->command->info('  Super-Admin : superadmin@agri-erp.com / password');
        $this->command->info('  Admin demo  : admin@kadiar-demo.com / password');
        $this->command->info('  Lecteur demo: lecteur@kadiar-demo.com / password');
    }
}

<?php

namespace App\Listeners;

use App\Events\TenantCree;
use App\Models\CampagneAgricole;

class CreerCampagneDefaut
{
    public function handle(TenantCree $event): void
    {
        $org = $event->organisation;
        $now = now();

        $debutMois = $org->campagne_debut_mois ?? 10;
        $currentYear = $now->year;
        $currentMonth = $now->month;

        if ($currentMonth >= $debutMois) {
            $debutAnnee = $currentYear;
        } else {
            $debutAnnee = $currentYear - 1;
        }

        $finAnnee = $debutAnnee + 1;
        $finMois = $debutMois - 1 === 0 ? 12 : $debutMois - 1;
        $finAnneeCorrecte = $debutMois === 1 ? $debutAnnee : $finAnnee;

        if (!CampagneAgricole::where('organisation_id', $org->id)->exists()) {
            CampagneAgricole::create([
                'organisation_id' => $org->id,
                'nom' => "Campagne {$debutAnnee}-{$finAnnee}",
                'date_debut' => "{$debutAnnee}-{$debutMois}-01",
                'date_fin' => date('Y-m-t', mktime(0, 0, 0, $finMois, 1, $finAnneeCorrecte)),
                'est_courante' => true,
            ]);
        }
    }
}

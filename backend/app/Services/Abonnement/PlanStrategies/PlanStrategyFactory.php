<?php

namespace App\Services\Abonnement\PlanStrategies;

use App\Models\Organisation;

class PlanStrategyFactory
{
    public static function make(Organisation $organisation): PlanStrategyInterface
    {
        $planEffectif = $organisation->getPlanEffectif();

        return match ($planEffectif) {
            'pro' => new PlanProStrategy(),
            'entreprise' => new PlanEntrepriseStrategy(),
            default => new PlanGratuitStrategy(),
        };
    }
}

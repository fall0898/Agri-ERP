<?php

namespace App\Listeners;

use App\Events\TenantCree;

class ActiverPeriodeEssai
{
    public function handle(TenantCree $event): void
    {
        $event->organisation->update([
            'periode_essai_fin' => now()->addDays(30),
        ]);
    }
}

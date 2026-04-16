<?php

namespace App\Listeners;

use App\Events\TenantCree;
use App\Mail\BienvenueOrganisationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class EnvoyerEmailBienvenue implements ShouldQueue
{
    public function handle(TenantCree $event): void
    {
        Mail::to($event->adminUser->email)
            ->send(new BienvenueOrganisationMail($event->organisation, $event->adminUser));
    }
}

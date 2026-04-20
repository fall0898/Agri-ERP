<?php

namespace App\Listeners;

use App\Events\TenantCree;
use App\Mail\BienvenueOrganisationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EnvoyerEmailBienvenue implements ShouldQueue
{
    public function handle(TenantCree $event): void
    {
        try {
            Mail::to($event->adminUser->email)
                ->send(new BienvenueOrganisationMail($event->organisation, $event->adminUser));
        } catch (\Throwable $e) {
            Log::warning('Email bienvenue non envoyé : ' . $e->getMessage());
        }
    }
}

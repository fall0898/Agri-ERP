<?php

namespace App\Listeners;

use App\Events\StockEnAlerte;
use App\Mail\AlerteStockMail;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class EnvoyerNotificationStockBas implements ShouldQueue
{
    public function handle(StockEnAlerte $event): void
    {
        $stock = $event->stock;

        $admins = User::where('organisation_id', $stock->organisation_id)
            ->whereIn('role', ['admin'])
            ->where('est_actif', true)
            ->get();

        foreach ($admins as $admin) {
            Notification::create([
                'organisation_id' => $stock->organisation_id,
                'user_id' => $admin->id,
                'type' => 'alerte_stock',
                'titre' => "Stock bas : {$stock->nom}",
                'message' => "Le stock de {$stock->nom} est bas ({$stock->quantite_actuelle} {$stock->unite} restants). Seuil d'alerte : {$stock->seuil_alerte} {$stock->unite}.",
                'canal' => 'app',
                'action_url' => "/stocks/{$stock->id}",
                'envoyee_at' => now(),
            ]);

            Mail::to($admin->email)->send(new AlerteStockMail($admin, $stock));
        }
    }
}

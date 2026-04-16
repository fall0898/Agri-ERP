<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Le lien de reset pointe vers le frontend Angular (SPA)
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));
            return "{$frontend}/reinitialiser-mot-de-passe?token={$token}&email={$user->email}";
        });
    }
}

<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        if (app()->isProduction()) {
            URL::forceScheme('https');
        }

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));
            return "{$frontend}/reinitialiser-mot-de-passe?token={$token}&email={$user->email}";
        });
    }
}

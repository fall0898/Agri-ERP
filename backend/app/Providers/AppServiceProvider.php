<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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

        RateLimiter::for('login', fn(Request $req) =>
            Limit::perMinute(5)->by($req->input('email').$req->ip())->response(
                fn() => response()->json(['message' => 'Trop de tentatives. Réessayez dans 1 minute.'], 429)
            )
        );

        RateLimiter::for('register', fn(Request $req) =>
            Limit::perMinute(3)->by($req->ip())->response(
                fn() => response()->json(['message' => 'Trop de tentatives. Réessayez dans 1 minute.'], 429)
            )
        );

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));
            return "{$frontend}/reinitialiser-mot-de-passe?token={$token}&email={$user->email}";
        });
    }
}

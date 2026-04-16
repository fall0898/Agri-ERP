<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RateLimitByTenant
{
    public function __construct(private RateLimiter $limiter) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $tenantKey = 'tenant_rate_' . ($user->organisation_id ?? $user->id);
        $userKey = 'user_rate_' . $user->id;

        if ($this->limiter->tooManyAttempts($tenantKey, 1000)) {
            return response()->json([
                'message' => 'Trop de requêtes depuis votre organisation. Réessayez dans une heure.',
            ], 429);
        }

        if ($this->limiter->tooManyAttempts($userKey, 60)) {
            return response()->json([
                'message' => 'Trop de requêtes. Réessayez dans une minute.',
            ], 429);
        }

        $this->limiter->hit($tenantKey, 3600);
        $this->limiter->hit($userKey, 60);

        return $next($request);
    }
}

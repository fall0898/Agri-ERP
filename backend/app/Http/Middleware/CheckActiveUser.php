<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->est_actif) {
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Votre compte a été désactivé.',
            ], 401);
        }

        if ($user && !$user->isSuperAdmin() && $user->organisation && !$user->organisation->est_active) {
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Votre organisation est désactivée. Contactez le support.',
            ], 401);
        }

        return $next($request);
    }
}

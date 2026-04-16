<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAbonnement
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->isSuperAdmin()) {
            return $next($request);
        }

        $organisation = $user->organisation;

        if (!$organisation) {
            return response()->json(['message' => 'Organisation introuvable.'], 404);
        }

        if ($organisation->est_suspendue) {
            return response()->json([
                'message' => 'Votre compte est suspendu. Contactez le support ou réglez votre abonnement.',
                'code' => 'COMPTE_SUSPENDU',
            ], 403);
        }

        if ($organisation->plan_expire_at !== null) {
            $expire = $organisation->plan_expire_at;
            $now = now();

            if ($expire->isPast()) {
                $joursExpire = $now->diffInDays($expire);

                // Plan gratuit expiré : accès immédiatement bloqué (7 jours c'est court)
                if ($organisation->plan === 'gratuit') {
                    return response()->json([
                        'message' => 'Votre période d\'essai gratuite a expiré. Souscrivez au plan Pro pour continuer.',
                        'code' => 'ESSAI_GRATUIT_EXPIRE',
                    ], 403);
                }

                if ($joursExpire > 30) {
                    $organisation->update(['est_suspendue' => true]);
                    return response()->json([
                        'message' => 'Votre abonnement a expiré depuis plus de 30 jours. Compte suspendu.',
                        'code' => 'ABONNEMENT_EXPIRE_SUSPENDU',
                    ], 403);
                }

                if ($joursExpire > 7 && !$request->isMethod('GET')) {
                    return response()->json([
                        'message' => 'Votre abonnement a expiré. Mode lecture seule actif.',
                        'code' => 'ABONNEMENT_EXPIRE_LECTURE_SEULE',
                        'jours_expire' => $joursExpire,
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}

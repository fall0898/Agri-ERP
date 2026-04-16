<?php

namespace App\Http\Middleware;

use App\Services\Abonnement\PlanStrategies\PlanStrategyFactory;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanLimit
{
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $user = $request->user();

        if (!$user || $user->isSuperAdmin()) {
            return $next($request);
        }

        $organisation = $user->organisation;
        $strategy = PlanStrategyFactory::make($organisation);

        $allowed = match ($resource) {
            'champ' => $strategy->canCreateChamp(
                $organisation->champs()->count()
            ),
            'user' => $strategy->canAddUser(
                $organisation->users()->count()
            ),
            'culture' => $strategy->canCreateCulture(
                $organisation->cultures()->count()
            ),
            'excel' => $strategy->canExportExcel(),
            'import' => $strategy->canImportCsv(),
            'meteo' => $strategy->canAccessMeteo(),
            default => true,
        };

        if (!$allowed) {
            return response()->json([
                'message' => 'Limite du plan atteinte. Passez au plan supérieur pour continuer.',
                'code' => 'PLAN_LIMIT_REACHED',
                'resource' => $resource,
                'plan_actuel' => $organisation->getPlanEffectif(),
            ], 403);
        }

        return $next($request);
    }
}

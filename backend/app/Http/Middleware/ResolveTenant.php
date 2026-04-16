<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->organisation_id) {
            $organisation = $user->organisation;

            if ($organisation) {
                app()->instance('tenant', $organisation);
            }
        } elseif ($user && $user->isSuperAdmin()) {
            app()->instance('tenant', null);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\User;
use App\Models\Vente;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'nb_organisations' => Organisation::count(),
            'nb_organisations_actives' => Organisation::where('est_active', true)->count(),
            'nb_organisations_par_plan' => Organisation::select('plan', DB::raw('count(*) as total'))
                ->groupBy('plan')
                ->pluck('total', 'plan'),
            'nb_users' => User::whereNotNull('organisation_id')->count(),
            'nb_inscriptions_ce_mois' => Organisation::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'total_ventes_plateforme' => Vente::sum('montant_total_fcfa'),
        ]);
    }
}

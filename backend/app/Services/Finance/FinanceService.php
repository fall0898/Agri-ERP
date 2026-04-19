<?php

namespace App\Services\Finance;

use App\Models\CampagneAgricole;
use App\Models\Depense;
use App\Models\Vente;
use Illuminate\Support\Facades\DB;

class FinanceService
{
    public function getResume(int $organisationId, array $filters = []): array
    {
        $ventesQuery = Vente::where('organisation_id', $organisationId);
        $depensesQuery = Depense::where('organisation_id', $organisationId);

        $this->applyFilters($ventesQuery, $depensesQuery, $filters);

        $totalVentes = (float) $ventesQuery->sum('montant_total_fcfa');
        $totalDepenses = (float) $depensesQuery->sum('montant_fcfa');

        return [
            'total_ventes' => $totalVentes,
            'total_depenses' => $totalDepenses,
            'solde_net' => $totalVentes - $totalDepenses,
        ];
    }

    public function getParChamp(int $organisationId, array $filters = []): array
    {
        $ventesQuery = Vente::where('organisation_id', $organisationId)
            ->whereNotNull('champ_id');
        $depensesQuery = Depense::where('organisation_id', $organisationId)
            ->whereNotNull('champ_id');

        $this->applyFilters($ventesQuery, $depensesQuery, $filters);

        $ventes = $ventesQuery->select('champ_id', DB::raw('SUM(montant_total_fcfa) as total'))
            ->groupBy('champ_id')
            ->pluck('total', 'champ_id');

        $depenses = $depensesQuery->select('champ_id', DB::raw('SUM(montant_fcfa) as total'))
            ->groupBy('champ_id')
            ->pluck('total', 'champ_id');

        $champIds = $ventes->keys()->merge($depenses->keys())->unique();
        $champNoms = \App\Models\Champ::whereIn('id', $champIds)->pluck('nom', 'id');

        return $champIds->map(function ($champId) use ($ventes, $depenses, $champNoms) {
            $totalVentes = (float) ($ventes[$champId] ?? 0);
            $totalDepenses = (float) ($depenses[$champId] ?? 0);

            return [
                'champ_id'       => $champId,
                'nom'            => $champNoms[$champId] ?? "Champ #{$champId}",
                'total_ventes'   => $totalVentes,
                'total_depenses' => $totalDepenses,
                'solde_net'      => $totalVentes - $totalDepenses,
            ];
        })->values()->toArray();
    }

    public function getParCulture(int $organisationId, array $filters = []): array
    {
        $query = Vente::where('organisation_id', $organisationId)
            ->whereNotNull('culture_id');

        if (isset($filters['date_debut'])) {
            $query->where('date_vente', '>=', $filters['date_debut']);
        }
        if (isset($filters['date_fin'])) {
            $query->where('date_vente', '<=', $filters['date_fin']);
        }
        if (isset($filters['campagne_id'])) {
            $query->where('campagne_id', $filters['campagne_id']);
        }

        return $query->select('culture_id', DB::raw('SUM(montant_total_fcfa) as total_ventes'), DB::raw('SUM(quantite_kg) as total_kg'))
            ->groupBy('culture_id')
            ->with(['culture:id,nom,champ_id'])
            ->get()
            ->map(fn($v) => [
                'culture_id' => $v->culture_id,
                'culture' => $v->culture,
                'total_ventes' => (float) $v->total_ventes,
                'total_kg' => (float) $v->total_kg,
            ])
            ->toArray();
    }

    public function getComparaison(int $organisationId, int $campagne1Id, int $campagne2Id): array
    {
        $c1 = $this->getResume($organisationId, ['campagne_id' => $campagne1Id]);
        $c2 = $this->getResume($organisationId, ['campagne_id' => $campagne2Id]);

        $variation = function ($val1, $val2) {
            if ($val2 == 0) return null;
            return round((($val1 - $val2) / $val2) * 100, 2);
        };

        return [
            'campagne_1' => array_merge($c1, ['id' => $campagne1Id]),
            'campagne_2' => array_merge($c2, ['id' => $campagne2Id]),
            'variation' => [
                'ventes' => $variation($c1['total_ventes'], $c2['total_ventes']),
                'depenses' => $variation($c1['total_depenses'], $c2['total_depenses']),
                'solde_net' => $variation($c1['solde_net'], $c2['solde_net']),
            ],
        ];
    }

    public function getGraphiqueFinance(int $organisationId, ?int $campagneId = null): array
    {
        $isPgsql = DB::connection()->getDriverName() === 'pgsql';
        $moisVente   = $isPgsql ? "TO_CHAR(date_vente, 'YYYY-MM')"   : 'DATE_FORMAT(date_vente, "%Y-%m")';
        $moisDepense = $isPgsql ? "TO_CHAR(date_depense, 'YYYY-MM')" : 'DATE_FORMAT(date_depense, "%Y-%m")';

        $ventesParMois = Vente::where('organisation_id', $organisationId)
            ->when($campagneId, fn($q) => $q->where('campagne_id', $campagneId))
            ->select(DB::raw("$moisVente as mois"), DB::raw('SUM(montant_total_fcfa) as total'))
            ->groupBy('mois')
            ->orderBy('mois')
            ->pluck('total', 'mois');

        $depensesParMois = Depense::where('organisation_id', $organisationId)
            ->when($campagneId, fn($q) => $q->where('campagne_id', $campagneId))
            ->select(DB::raw("$moisDepense as mois"), DB::raw('SUM(montant_fcfa) as total'))
            ->groupBy('mois')
            ->orderBy('mois')
            ->pluck('total', 'mois');

        $allMois = $ventesParMois->keys()->merge($depensesParMois->keys())->unique()->sort()->values();

        return $allMois->map(fn($m) => [
            'mois' => $m,
            'ventes' => (float) ($ventesParMois[$m] ?? 0),
            'depenses' => (float) ($depensesParMois[$m] ?? 0),
        ])->values()->toArray();
    }

    public function getDepensesParCategorie(int $organisationId, ?int $campagneId = null): array
    {
        return Depense::where('organisation_id', $organisationId)
            ->when($campagneId, fn($q) => $q->where('campagne_id', $campagneId))
            ->select('categorie', DB::raw('SUM(montant_fcfa) as total'))
            ->groupBy('categorie')
            ->orderByDesc('total')
            ->get()
            ->map(fn($d) => [
                'categorie' => $d->categorie,
                'total' => (float) $d->total,
            ])
            ->toArray();
    }

    public function getRentabiliteCulture(int $organisationId, int $cultureId): array
    {
        $totalVentes = (float) Vente::where('organisation_id', $organisationId)
            ->where('culture_id', $cultureId)
            ->sum('montant_total_fcfa');

        $coutIntrants = (float) \App\Models\UtilisationIntrant::where('organisation_id', $organisationId)
            ->where('culture_id', $cultureId)
            ->sum('cout_total_fcfa');

        return [
            'total_ventes' => $totalVentes,
            'cout_intrants' => $coutIntrants,
            'benefice_brut' => $totalVentes - $coutIntrants,
        ];
    }

    private function applyFilters($ventesQuery, $depensesQuery, array $filters): void
    {
        if (isset($filters['campagne_id'])) {
            $ventesQuery->where('campagne_id', $filters['campagne_id']);
            $depensesQuery->where('campagne_id', $filters['campagne_id']);
        }
        if (isset($filters['date_debut'])) {
            $ventesQuery->where('date_vente', '>=', $filters['date_debut']);
            $depensesQuery->where('date_depense', '>=', $filters['date_debut']);
        }
        if (isset($filters['date_fin'])) {
            $ventesQuery->where('date_vente', '<=', $filters['date_fin']);
            $depensesQuery->where('date_depense', '<=', $filters['date_fin']);
        }
        if (isset($filters['champ_id'])) {
            $ventesQuery->where('champ_id', $filters['champ_id']);
            $depensesQuery->where('champ_id', $filters['champ_id']);
        }
    }
}

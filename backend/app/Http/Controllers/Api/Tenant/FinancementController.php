<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\FinancementIndividuel;
use App\Services\Financement\FinancementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancementController extends Controller
{
    public function __construct(private FinancementService $financementService) {}

    /** Liste globale de tous les financements du tenant */
    public function all(Request $request): JsonResponse
    {
        $financements = FinancementIndividuel::with(['employe:id,nom', 'remboursements.vente'])
            ->orderByDesc('date_financement')
            ->get()
            ->map(fn($f) => [
                ...$f->toArray(),
                'montant_restant' => $f->montantRestant(),
            ]);

        return response()->json($financements);
    }

    /** Liste des financements d'un employé */
    public function index(Request $request, int $employeId): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)
            ->findOrFail($employeId);

        $financements = FinancementIndividuel::where('employe_id', $employe->id)
            ->with(['remboursements.vente', 'depense'])
            ->orderByDesc('date_financement')
            ->get()
            ->map(fn($f) => [
                ...$f->toArray(),
                'montant_restant' => $f->montantRestant(),
            ]);

        return response()->json($financements);
    }

    /** Créer un financement pour un employé */
    public function store(Request $request, int $employeId): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)
            ->findOrFail($employeId);

        $validated = $request->validate([
            'montant_fcfa'     => 'required|numeric|min:1',
            'motif'            => 'required|string|max:300',
            'date_financement' => 'required|date',
            'mode_paiement'    => 'nullable|in:especes,virement,orange_money,wave',
            'notes'            => 'nullable|string',
        ]);

        $financement = $this->financementService->creer($validated, $employe, $request->user()->id);

        return response()->json($financement, 201);
    }

    /** Enregistrer un remboursement */
    public function rembourser(Request $request, int $financementId): JsonResponse
    {
        $financement = FinancementIndividuel::where('organisation_id', $request->user()->organisation_id)
            ->with('employe')
            ->findOrFail($financementId);

        if ($financement->statut === 'rembourse') {
            return response()->json(['message' => 'Ce financement est déjà entièrement remboursé.'], 422);
        }

        $validated = $request->validate([
            'montant_fcfa'       => 'required|numeric|min:1|max:' . $financement->montantRestant(),
            'date_remboursement' => 'required|date',
            'mode_paiement'      => 'nullable|in:especes,virement,orange_money,wave',
        ]);

        $remboursement = $this->financementService->rembourser($financement, $validated, $request->user()->id);

        return response()->json($remboursement, 201);
    }

    /** Supprimer un financement (et sa dépense associée) */
    public function destroy(Request $request, int $financementId): JsonResponse
    {
        $financement = FinancementIndividuel::where('organisation_id', $request->user()->organisation_id)
            ->findOrFail($financementId);

        if ($financement->remboursements()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer un financement ayant des remboursements.'], 422);
        }

        // Supprimer la dépense auto-générée
        if ($financement->depense_id) {
            $financement->depense()->delete();
        }

        $financement->delete();

        return response()->json(['message' => 'Financement supprimé.']);
    }
}

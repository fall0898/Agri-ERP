<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\PaiementSalaire;
use App\Services\Employe\SalaireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaireController extends Controller
{
    public function __construct(private SalaireService $salaireService) {}

    public function index(Request $request): JsonResponse
    {
        $query = PaiementSalaire::where('organisation_id', $request->user()->organisation_id)
            ->with(['employe:id,nom']);

        if ($request->employe_id) $query->where('employe_id', $request->employe_id);
        if ($request->mois) $query->where('mois', $request->mois);

        return response()->json($query->orderByDesc('date_paiement')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'montant_fcfa' => 'required|numeric|min:0',
            'mois' => 'required|string|regex:/^\d{4}-\d{2}$/',
            'date_paiement' => 'required|date',
            'mode_paiement' => 'in:especes,mobile_money,virement,autre',
            'notes' => 'nullable|string',
        ]);

        $employe = Employe::where('organisation_id', $request->user()->organisation_id)
            ->findOrFail($validated['employe_id']);

        $paiement = $this->salaireService->payerSalaire($employe, $validated);

        return response()->json(
            array_merge($paiement->load(['employe:id,nom'])->toArray(), [
                'message' => 'Salaire payé avec succès. Une dépense a été créée automatiquement.',
            ]),
            201
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $paiement = PaiementSalaire::where('organisation_id', $request->user()->organisation_id)
            ->with(['employe:id,nom', 'depense'])
            ->findOrFail($id);

        return response()->json($paiement);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $paiement = PaiementSalaire::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'montant_fcfa' => 'sometimes|numeric|min:0',
            'mode_paiement' => 'sometimes|in:especes,mobile_money,virement,autre',
            'notes' => 'nullable|string',
        ]);

        $paiement->update($validated);

        return response()->json($paiement->fresh()->load(['employe:id,nom']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $paiement = PaiementSalaire::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $paiement->delete();

        return response()->json(['message' => 'Paiement supprimé avec succès.']);
    }
}

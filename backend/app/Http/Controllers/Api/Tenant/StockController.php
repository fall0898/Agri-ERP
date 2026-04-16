<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Services\Stock\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function __construct(private StockService $stockService) {}

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $query = Stock::where('organisation_id', $orgId)->with(['intrant:id,nom']);

        if ($request->categorie) $query->where('categorie', $request->categorie);
        if ($request->has('en_alerte') && filter_var($request->en_alerte, FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNotNull('seuil_alerte')->whereRaw('quantite_actuelle <= seuil_alerte');
        }

        return response()->json($query->where('est_actif', true)->orderBy('nom')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'intrant_id' => 'nullable|exists:intrants,id',
            'nom' => 'required|string|max:200',
            'categorie' => 'required|string|max:100',
            'quantite_actuelle' => 'sometimes|numeric|min:0',
            'unite' => 'required|string|max:20',
            'seuil_alerte' => 'nullable|numeric|min:0',
        ]);

        $stock = Stock::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($stock, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $stock = Stock::where('organisation_id', $request->user()->organisation_id)
            ->with(['intrant:id,nom', 'mouvements' => fn($q) => $q->orderByDesc('date_mouvement')->limit(50)])
            ->findOrFail($id);

        return response()->json(array_merge($stock->toArray(), [
            'niveau_alerte' => $stock->getNiveauAlerte(),
        ]));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $stock = Stock::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:200',
            'categorie' => 'sometimes|string|max:100',
            'unite' => 'sometimes|string|max:20',
            'seuil_alerte' => 'nullable|numeric|min:0',
            'est_actif' => 'boolean',
        ]);

        $stock->update($validated);

        return response()->json($stock->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $stock = Stock::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $stock->delete();

        return response()->json(['message' => 'Stock supprimé avec succès.']);
    }

    public function mouvements(Request $request, int $id): JsonResponse
    {
        $stock = Stock::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $mouvements = $stock->mouvements()->with(['culture:id,nom', 'depense:id,montant_fcfa'])->get();

        return response()->json($mouvements);
    }

    public function ajouterMouvement(Request $request, int $id): JsonResponse
    {
        $stock = Stock::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|in:achat,utilisation,perte,ajustement',
            'quantite' => 'required|numeric|min:0',
            'prix_unitaire_fcfa' => 'nullable|numeric|min:0',
            'fournisseur' => 'nullable|string|max:200',
            'culture_id' => 'nullable|exists:cultures,id',
            'motif' => 'nullable|string|max:300',
            'date_mouvement' => 'required|date',
            'nouvelle_quantite' => 'nullable|numeric|min:0',
        ]);

        $mouvement = $this->stockService->enregistrerMouvement($stock, $validated);

        return response()->json($mouvement->load(['depense:id,montant_fcfa']), 201);
    }

    public function alertes(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $stocks = $this->stockService->getAlertes($orgId);

        return response()->json($stocks);
    }
}

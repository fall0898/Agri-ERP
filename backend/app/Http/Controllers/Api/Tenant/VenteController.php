<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\VenteCollection;
use App\Http\Resources\VenteResource;
use App\Models\Vente;
use App\Services\Vente\RecuPdfService;
use App\Services\Vente\VenteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VenteController extends Controller
{
    public function __construct(
        private VenteService $venteService,
        private RecuPdfService $recuPdfService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $query = Vente::where('organisation_id', $orgId)
            ->where(fn($q) => $q->where('est_auto_generee', false)->orWhereNull('est_auto_generee'))
            ->with(['champ:id,nom', 'culture:id,nom', 'campagne:id,nom']);

        if ($request->champ_id) $query->where('champ_id', $request->champ_id);
        if ($request->culture_id) $query->where('culture_id', $request->culture_id);
        if ($request->campagne_id) $query->where('campagne_id', $request->campagne_id);
        if ($request->date_debut) $query->where('date_vente', '>=', $request->date_debut);
        if ($request->date_fin) $query->where('date_vente', '<=', $request->date_fin);

        $ventes = $query->orderByDesc('date_vente')->get();

        return (new VenteCollection($ventes))->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'champ_id' => 'nullable|exists:champs,id',
            'culture_id' => 'nullable|exists:cultures,id',
            'campagne_id' => 'nullable|exists:campagnes_agricoles,id',
            'acheteur' => 'nullable|string|max:200',
            'produit' => 'required|string|max:200',
            'quantite_kg' => 'required|numeric|min:0',
            'unite' => 'nullable|in:kg,sac,caisse',
            'prix_unitaire_fcfa' => 'required|numeric|min:0',
            'date_vente' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Auto-assigner la campagne courante si non fournie
        if (empty($validated['campagne_id'])) {
            $campagne = app('tenant')?->campagneCourante();
            if ($campagne) $validated['campagne_id'] = $campagne->id;
        }

        $vente = $this->venteService->creer([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
            'user_id' => $request->user()->id,
        ]);

        return (new VenteResource($vente))->response()->setStatusCode(201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $vente = Vente::where('organisation_id', $request->user()->organisation_id)
            ->with(['champ:id,nom', 'culture:id,nom', 'campagne:id,nom', 'user:id,nom'])
            ->findOrFail($id);

        return new VenteResource($vente);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $vente = Vente::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        if ($vente->est_auto_generee) {
            return response()->json(['message' => 'Les ventes générées automatiquement (remboursements) ne peuvent pas être modifiées.'], 403);
        }

        $validated = $request->validate([
            'champ_id' => 'nullable|exists:champs,id',
            'culture_id' => 'nullable|exists:cultures,id',
            'campagne_id' => 'nullable|exists:campagnes_agricoles,id',
            'acheteur' => 'nullable|string|max:200',
            'produit' => 'sometimes|string|max:200',
            'quantite_kg' => 'sometimes|numeric|min:0',
            'unite' => 'nullable|in:kg,sac,caisse',
            'prix_unitaire_fcfa' => 'sometimes|numeric|min:0',
            'date_vente' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $vente = $this->venteService->modifier($vente, $validated);

        return new VenteResource($vente);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $vente = Vente::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        if ($vente->est_auto_generee) {
            return response()->json(['message' => 'Les ventes générées automatiquement (remboursements) ne peuvent pas être supprimées.'], 403);
        }

        $vente->delete();

        return response()->json(['message' => 'Vente supprimée avec succès.']);
    }

    public function recuPdf(Request $request, int $id): Response
    {
        $vente = Vente::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $pdf = $this->recuPdfService->generer($vente);

        return $pdf->download("recu-VNT-{$vente->id}.pdf");
    }
}

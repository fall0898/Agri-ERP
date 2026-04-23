<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepenseCollection;
use App\Http\Resources\DepenseResource;
use App\Models\CategorieDepense;
use App\Models\Depense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $query = Depense::where('organisation_id', $orgId)
            ->with(['champ:id,nom', 'user:id,nom', 'campagne:id,nom']);

        if ($request->champ_id === 'sans_exploitation') {
            $query->whereNull('champ_id');
        } elseif ($request->champ_id) {
            $query->where('champ_id', $request->champ_id);
        }

        if ($request->categorie) $query->where('categorie', $request->categorie);
        if ($request->campagne_id) $query->where('campagne_id', $request->campagne_id);
        if ($request->date_debut) $query->where('date_depense', '>=', $request->date_debut);
        if ($request->date_fin) $query->where('date_depense', '<=', $request->date_fin);

        $depenses = $query->orderByDesc('date_depense')->get();

        return response()->json([
            'data'  => $depenses->map(fn($d) => (new DepenseResource($d))->toArray($request))->values(),
            'total' => $depenses->sum('montant_fcfa'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'champ_id' => 'nullable|exists:champs,id',
            'campagne_id' => 'nullable|exists:campagnes_agricoles,id',
            'categorie' => ['required', $this->categorieRule($request)],
            'description' => 'required|string|max:300',
            'montant_fcfa' => 'required|numeric|min:0',
            'date_depense' => 'required|date',
        ]);

        $depense = Depense::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
            'user_id' => $request->user()->id,
        ]);

        return (new DepenseResource($depense->load(['champ:id,nom', 'campagne:id,nom'])))->response()->setStatusCode(201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $depense = Depense::where('organisation_id', $request->user()->organisation_id)
            ->with(['champ:id,nom', 'user:id,nom', 'campagne:id,nom'])
            ->findOrFail($id);

        return new DepenseResource($depense);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $depense = Depense::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        if ($depense->est_auto_generee) {
            return response()->json([
                'message' => 'Les dépenses générées automatiquement ne peuvent pas être modifiées.',
            ], 403);
        }

        $validated = $request->validate([
            'champ_id' => 'nullable|exists:champs,id',
            'campagne_id' => 'nullable|exists:campagnes_agricoles,id',
            'categorie' => ['sometimes', $this->categorieRule($request)],
            'description' => 'sometimes|string|max:300',
            'montant_fcfa' => 'sometimes|numeric|min:0',
            'date_depense' => 'sometimes|date',
        ]);

        $depense->update($validated);

        return new DepenseResource($depense->fresh()->load(['champ:id,nom', 'campagne:id,nom']));
    }

    private function categorieRule(Request $request): \Illuminate\Validation\Rules\In
    {
        $builtIn = array_column(CategorieDepenseController::BUILT_IN, 'slug');
        $builtIn[] = 'financement_individuel';
        $custom = CategorieDepense::where('organisation_id', $request->user()->organisation_id)
            ->pluck('slug')->toArray();

        return Rule::in(array_merge($builtIn, $custom));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $depense = Depense::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        if ($depense->est_auto_generee) {
            return response()->json([
                'message' => 'Les dépenses générées automatiquement ne peuvent pas être supprimées.',
            ], 403);
        }

        $depense->delete();

        return response()->json(['message' => 'Dépense supprimée avec succès.']);
    }
}

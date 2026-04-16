<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TacheController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tache::where('organisation_id', $request->user()->organisation_id)
            ->with(['employe:id,nom', 'champ:id,nom', 'culture:id,nom']);

        if ($request->employe_id) $query->where('employe_id', $request->employe_id);
        if ($request->champ_id) $query->where('champ_id', $request->champ_id);
        if ($request->statut) $query->where('statut', $request->statut);
        if ($request->priorite) $query->where('priorite', $request->priorite);
        if ($request->date_debut) $query->where('date_debut', '>=', $request->date_debut);
        if ($request->date_fin) $query->where('date_debut', '<=', $request->date_fin);

        return response()->json($query->orderByRaw("FIELD(priorite, 'urgente', 'haute', 'normale', 'basse')")->orderBy('date_debut')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'champ_id' => 'nullable|exists:champs,id',
            'culture_id' => 'nullable|exists:cultures,id',
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'statut' => 'in:a_faire,en_cours,termine,annule',
            'priorite' => 'in:basse,normale,haute,urgente',
        ]);

        $tache = Tache::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
        ]);

        return response()->json($tache->load(['employe:id,nom', 'champ:id,nom']), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tache = Tache::where('organisation_id', $request->user()->organisation_id)
            ->with(['employe:id,nom', 'champ:id,nom', 'culture:id,nom'])
            ->findOrFail($id);

        return response()->json($tache);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tache = Tache::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'employe_id' => 'sometimes|exists:employes,id',
            'champ_id' => 'nullable|exists:champs,id',
            'culture_id' => 'nullable|exists:cultures,id',
            'titre' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'nullable|date',
            'statut' => 'sometimes|in:a_faire,en_cours,termine,annule',
            'priorite' => 'sometimes|in:basse,normale,haute,urgente',
        ]);

        $tache->update($validated);

        return response()->json($tache->fresh()->load(['employe:id,nom', 'champ:id,nom']));
    }

    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $tache = Tache::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $request->validate(['statut' => 'required|in:a_faire,en_cours,termine,annule']);

        $tache->update(['statut' => $request->statut]);

        return response()->json($tache->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tache = Tache::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $tache->delete();

        return response()->json(['message' => 'Tâche supprimée avec succès.']);
    }
}

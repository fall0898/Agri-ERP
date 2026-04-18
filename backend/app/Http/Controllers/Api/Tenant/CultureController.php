<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Events\IntrantUtilise;
use App\Http\Controllers\Controller;
use App\Models\Culture;
use App\Models\Media;
use App\Models\UtilisationIntrant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CultureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Culture::where('organisation_id', $request->user()->organisation_id)
            ->with(['champ:id,nom', 'campagne:id,nom']);

        if ($request->champ_id) $query->where('champ_id', $request->champ_id);
        if ($request->campagne_id) $query->where('campagne_id', $request->campagne_id);
        if ($request->saison) $query->where('saison', $request->saison);
        if ($request->annee) $query->where('annee', $request->annee);
        if ($request->statut) $query->where('statut', $request->statut);
        if ($request->search) $query->where('nom', 'like', '%' . $request->search . '%');

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'champ_id' => 'required|exists:champs,id',
            'campagne_id' => 'nullable|exists:campagnes_agricoles,id',
            'nom' => 'required|string|max:150',
            'variete' => 'nullable|string|max:100',
            'saison' => 'required|in:normale,contre_saison',
            'annee' => 'required|integer|min:2000|max:2100',
            'date_semis' => 'nullable|date',
            'date_recolte_prevue' => 'nullable|date',
            'superficie_cultivee_ha' => 'nullable|numeric|min:0',
            'statut' => 'in:en_cours,recolte,termine,abandonne',
            'notes' => 'nullable|string',
        ]);

        $culture = Culture::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
        ]);

        return response()->json($culture->load(['champ:id,nom', 'campagne:id,nom']), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)
            ->with(['champ:id,nom', 'campagne:id,nom', 'medias', 'utilisationsIntrants.intrant'])
            ->findOrFail($id);

        return response()->json($culture);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'champ_id' => 'sometimes|exists:champs,id',
            'campagne_id' => 'nullable|exists:campagnes_agricoles,id',
            'nom' => 'sometimes|string|max:150',
            'variete' => 'nullable|string|max:100',
            'saison' => 'sometimes|in:normale,contre_saison',
            'annee' => 'sometimes|integer|min:2000|max:2100',
            'date_semis' => 'nullable|date',
            'date_recolte_prevue' => 'nullable|date',
            'date_recolte_effective' => 'nullable|date',
            'superficie_cultivee_ha' => 'nullable|numeric|min:0',
            'quantite_recoltee_kg' => 'nullable|numeric|min:0',
            'statut' => 'sometimes|in:en_cours,recolte,termine,abandonne',
            'notes' => 'nullable|string',
        ]);

        $culture->update($validated);

        return response()->json($culture->fresh()->load(['champ:id,nom', 'campagne:id,nom']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $culture->delete();

        return response()->json(['message' => 'Culture supprimée avec succès.']);
    }

    public function intrants(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        return response()->json(
            $culture->utilisationsIntrants()->with(['intrant:id,nom', 'stock:id,nom'])->orderByDesc('date_utilisation')->get()
        );
    }

    public function ajouterIntrant(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'intrant_id' => 'nullable|exists:intrants,id',
            'stock_id' => 'nullable|exists:stocks,id',
            'nom_intrant' => 'required|string|max:200',
            'quantite' => 'required|numeric|min:0',
            'unite' => 'required|string|max:20',
            'cout_total_fcfa' => 'nullable|numeric|min:0',
            'date_utilisation' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $utilisation = UtilisationIntrant::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
            'culture_id' => $culture->id,
        ]);

        if ($utilisation->stock_id) {
            IntrantUtilise::dispatch($utilisation->load('stock', 'culture'));
        }

        return response()->json($utilisation->load(['intrant:id,nom', 'stock:id,nom']), 201);
    }

    public function supprimerIntrant(Request $request, int $id): JsonResponse
    {
        $utilisation = UtilisationIntrant::where('organisation_id', $request->user()->organisation_id)
            ->findOrFail($id);
        $utilisation->delete();

        return response()->json(['message' => 'Utilisation supprimée avec succès.']);
    }

    public function medias(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        return response()->json($culture->medias()->orderByDesc('created_at')->get());
    }

    public function ajouterMedia(Request $request, int $id): JsonResponse
    {
        $culture = Culture::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $request->validate([
            'fichier' => 'required|file|mimetypes:image/jpeg,image/png,image/webp,video/mp4|max:51200',
            'description' => 'nullable|string|max:300',
            'date_prise' => 'nullable|date',
        ]);

        $file = $request->file('fichier');
        $type = str_contains($file->getMimeType(), 'video') ? 'video' : 'photo';

        $path = $file->store("organisations/{$request->user()->organisation_id}/medias", 'r2');

        $media = Media::create([
            'culture_id' => $culture->id,
            'type' => $type,
            'fichier_url' => Storage::disk('r2')->url($path),
            'fichier_nom' => $file->getClientOriginalName(),
            'taille_octets' => $file->getSize(),
            'description' => $request->description,
            'date_prise' => $request->date_prise,
        ]);

        return response()->json($media, 201);
    }

    public function supprimerMedia(Request $request, int $id): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $media = Media::where(function ($q) use ($orgId) {
            $q->whereHas('culture', fn ($c) => $c->where('organisation_id', $orgId))
              ->orWhereHas('champ', fn ($c) => $c->where('organisation_id', $orgId));
        })->findOrFail($id);

        $media->delete();

        return response()->json(['message' => 'Média supprimé avec succès.']);
    }
}

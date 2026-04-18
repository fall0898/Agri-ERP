<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChampResource;
use App\Models\Champ;
use App\Models\Media;
use App\Services\Finance\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChampController extends Controller
{
    public function __construct(private FinanceService $financeService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Champ::where('organisation_id', $request->user()->organisation_id)
            ->with(['user:id,nom']);

        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%');
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        $champs = $query->orderBy('nom')->get();

        return ChampResource::collection($champs)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:150',
            'superficie_ha' => 'required|numeric|min:0',
            'localisation' => 'nullable|string|max:300',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'est_actif' => 'boolean',
        ]);

        $champ = Champ::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
            'user_id' => $request->user()->id,
        ]);

        return (new ChampResource($champ))->response()->setStatusCode(201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)
            ->with(['user:id,nom', 'cultures:id,nom,statut,saison,annee'])
            ->findOrFail($id);

        return new ChampResource($champ);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:150',
            'superficie_ha' => 'sometimes|numeric|min:0',
            'localisation' => 'nullable|string|max:300',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'est_actif' => 'boolean',
        ]);

        $champ->update($validated);

        return new ChampResource($champ->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $champ->delete();

        return response()->json(['message' => 'Champ supprimé avec succès.']);
    }

    public function cultures(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $cultures = $champ->cultures()
            ->with(['campagne:id,nom'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($cultures);
    }

    public function depenses(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $depenses = $champ->depenses()
            ->orderByDesc('date_depense')
            ->get();

        return response()->json($depenses);
    }

    public function ventes(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $ventes = $champ->ventes()
            ->orderByDesc('date_vente')
            ->get();

        return response()->json($ventes);
    }

    public function finance(Request $request, int $id): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $champ = Champ::where('organisation_id', $orgId)->findOrFail($id);

        $finance = $this->financeService->getResume($orgId, ['champ_id' => $champ->id]);

        return response()->json(array_merge($finance, ['champ' => $champ->only('id', 'nom')]));
    }

    public function medias(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        return response()->json($champ->medias()->orderByDesc('created_at')->get());
    }

    public function ajouterMedia(Request $request, int $id): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $request->validate([
            'fichier' => 'required|file|mimetypes:image/jpeg,image/png,image/webp,video/mp4|max:51200',
            'description' => 'nullable|string|max:300',
            'date_prise' => 'nullable|date',
        ]);

        $file = $request->file('fichier');
        $type = str_contains($file->getMimeType(), 'video') ? 'video' : 'photo';
        $path = $file->store("organisations/{$request->user()->organisation_id}/medias", 'r2');

        $media = Media::create([
            'champ_id' => $champ->id,
            'type' => $type,
            'fichier_url' => Storage::disk('r2')->url($path),
            'fichier_nom' => $file->getClientOriginalName(),
            'taille_octets' => $file->getSize(),
            'description' => $request->description,
            'date_prise' => $request->date_prise,
        ]);

        return response()->json($media, 201);
    }
}

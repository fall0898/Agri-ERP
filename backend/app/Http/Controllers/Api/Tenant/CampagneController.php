<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\CampagneAgricole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CampagneController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $campagnes = CampagneAgricole::where('organisation_id', $request->user()->organisation_id)
            ->orderByDesc('date_debut')
            ->get();

        return response()->json($campagnes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'notes' => 'nullable|string',
        ]);

        $campagne = CampagneAgricole::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
        ]);

        return response()->json($campagne, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $campagne = CampagneAgricole::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        return response()->json($campagne);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $campagne = CampagneAgricole::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $campagne->update($validated);

        return response()->json($campagne->fresh());
    }

    public function setCourante(Request $request, int $id): JsonResponse
    {
        $orgId = $request->user()->organisation_id;
        $campagne = CampagneAgricole::where('organisation_id', $orgId)->findOrFail($id);

        DB::transaction(function () use ($orgId, $campagne) {
            CampagneAgricole::where('organisation_id', $orgId)->update(['est_courante' => false]);
            $campagne->update(['est_courante' => true]);
        });

        return response()->json($campagne->fresh());
    }
}

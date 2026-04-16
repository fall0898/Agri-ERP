<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Intrant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntrantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $intrants = Intrant::where('organisation_id', $request->user()->organisation_id)
            ->where('est_actif', true)
            ->orderBy('nom')
            ->get();

        return response()->json($intrants);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:200',
            'categorie' => 'required|string|max:100',
            'unite' => 'required|string|max:20',
            'description' => 'nullable|string',
        ]);

        $intrant = Intrant::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
        ]);

        return response()->json($intrant, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $intrant = Intrant::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:200',
            'categorie' => 'sometimes|string|max:100',
            'unite' => 'sometimes|string|max:20',
            'description' => 'nullable|string',
            'est_actif' => 'boolean',
        ]);

        $intrant->update($validated);

        return response()->json($intrant->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $intrant = Intrant::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $intrant->update(['est_actif' => false]);

        return response()->json(['message' => 'Intrant désactivé avec succès.']);
    }
}

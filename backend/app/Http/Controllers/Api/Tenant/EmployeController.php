<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $employes = Employe::where('organisation_id', $request->user()->organisation_id)
            ->orderBy('nom')
            ->get();

        return response()->json($employes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'telephone' => 'nullable|string|max:20',
            'poste' => 'nullable|string|max:100',
            'date_embauche' => 'nullable|date',
            'salaire_mensuel_fcfa' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $employe = Employe::create([
            ...$validated,
            'organisation_id' => $request->user()->organisation_id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($employe, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)
            ->with(['taches' => fn($q) => $q->orderByDesc('date_debut')->limit(20)])
            ->findOrFail($id);

        return response()->json($employe);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'telephone' => 'nullable|string|max:20',
            'poste' => 'nullable|string|max:100',
            'date_embauche' => 'nullable|date',
            'salaire_mensuel_fcfa' => 'nullable|numeric|min:0',
            'est_actif' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $employe->update($validated);

        return response()->json($employe->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);
        $employe->delete();

        return response()->json(['message' => 'Employé supprimé avec succès.']);
    }

    public function taches(Request $request, int $id): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        return response()->json(
            $employe->taches()->with(['champ:id,nom', 'culture:id,nom'])->orderByDesc('date_debut')->get()
        );
    }

    public function paiements(Request $request, int $id): JsonResponse
    {
        $employe = Employe::where('organisation_id', $request->user()->organisation_id)->findOrFail($id);

        return response()->json(
            $employe->paiements()->orderByDesc('date_paiement')->get()
        );
    }
}

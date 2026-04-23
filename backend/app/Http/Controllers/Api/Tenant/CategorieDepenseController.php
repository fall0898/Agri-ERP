<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\CategorieDepense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategorieDepenseController extends Controller
{
    // Built-in categories shared by all orgs
    const BUILT_IN = [
        ['slug' => 'intrant',                    'nom' => 'Intrant agricole'],
        ['slug' => 'main_oeuvre',                'nom' => "Main d'œuvre"],
        ['slug' => 'carburant',                  'nom' => 'Carburant'],
        ['slug' => 'materiel',                   'nom' => 'Matériel'],
        ['slug' => 'traitement_phytosanitaire',  'nom' => 'Traitement phytosanitaire'],
        ['slug' => 'transport',                  'nom' => 'Transport'],
        ['slug' => 'irrigation',                 'nom' => 'Irrigation'],
        ['slug' => 'entretien_materiel',         'nom' => 'Entretien matériel'],
        ['slug' => 'alimentation_betail',        'nom' => 'Alimentation bétail'],
        ['slug' => 'frais_recolte',              'nom' => 'Frais de récolte'],
        ['slug' => 'salaire',                    'nom' => 'Salaire'],
        ['slug' => 'autre',                      'nom' => 'Autre'],
    ];

    public function index(): JsonResponse
    {
        $custom = CategorieDepense::orderBy('nom')->get()
            ->map(fn($c) => ['id' => $c->id, 'slug' => $c->slug, 'nom' => $c->nom, 'custom' => true]);

        $builtIn = collect(self::BUILT_IN)
            ->map(fn($c) => [...$c, 'id' => null, 'custom' => false]);

        return response()->json($builtIn->concat($custom)->values());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
        ]);

        $slug = Str::slug($validated['nom'], '_');

        // Ensure uniqueness within org
        $base = $slug;
        $i = 2;
        while (CategorieDepense::where('slug', $slug)->exists()) {
            $slug = $base . '_' . $i++;
        }

        $cat = CategorieDepense::create([
            'organisation_id' => $request->user()->organisation_id,
            'nom'  => $validated['nom'],
            'slug' => $slug,
        ]);

        return response()->json(['id' => $cat->id, 'slug' => $cat->slug, 'nom' => $cat->nom, 'custom' => true], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $cat = CategorieDepense::findOrFail($id);
        $cat->delete();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}

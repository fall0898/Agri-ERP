<?php

namespace App\Http\Controllers\Api\Import;

use App\Http\Controllers\Controller;
use App\Models\Import;
use App\Services\Import\CsvImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportController extends Controller
{
    private const TEMPLATES = [
        'champs'   => ['nom', 'superficie_ha', 'localisation', 'description'],
        'cultures' => ['nom', 'champ_nom', 'saison', 'annee', 'date_semis', 'date_recolte_prevue', 'superficie_cultivee_ha', 'variete', 'notes'],
        'stocks'   => ['nom', 'categorie', 'quantite_actuelle', 'unite', 'seuil_alerte'],
        'depenses' => ['description', 'categorie', 'montant_fcfa', 'date_depense', 'champ_nom'],
        'ventes'   => ['produit', 'acheteur', 'quantite_kg', 'prix_unitaire_fcfa', 'date_vente', 'champ_nom'],
    ];

    public function __construct(private CsvImportService $csvService) {}

    public function template(string $type): StreamedResponse|JsonResponse
    {
        if (! isset(self::TEMPLATES[$type])) {
            return response()->json(['message' => 'Type invalide.'], 422);
        }

        $headers = self::TEMPLATES[$type];

        return response()->streamDownload(function () use ($headers) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // BOM UTF-8
            fputcsv($handle, $headers, ';');
            fclose($handle);
        }, "template_{$type}.csv", [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"template_{$type}.csv\"",
        ]);
    }

    public function import(Request $request, string $type): JsonResponse
    {
        if (! isset(self::TEMPLATES[$type])) {
            return response()->json(['message' => 'Type invalide.'], 422);
        }

        $request->validate([
            'fichier' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $user    = $request->user();
        $orgId   = $user->organisation_id;
        $file    = $request->file('fichier');
        $tmpPath = $file->getRealPath();

        $import = Import::create([
            'organisation_id'  => $orgId,
            'user_id'          => $user->id,
            'type'             => $type,
            'fichier_url'      => $file->getClientOriginalName(),
            'fichier_nom'      => $file->getClientOriginalName(),
            'statut'           => 'en_cours',
            'lignes_total'     => 0,
            'lignes_importees' => 0,
            'lignes_erreur'    => 0,
        ]);

        try {
            $result = $this->csvService->process($tmpPath, $type, $orgId, $user->id);

            $import->update([
                'statut'           => 'termine',
                'lignes_total'     => $result['imported'] + count($result['errors']),
                'lignes_importees' => $result['imported'],
                'lignes_erreur'    => count($result['errors']),
                'erreurs_detail'   => $result['errors'] ?: null,
            ]);

            return response()->json([
                'message'  => "{$result['imported']} ligne(s) importée(s) avec succès.",
                'imported' => $result['imported'],
                'errors'   => $result['errors'],
            ]);
        } catch (\Throwable $e) {
            $import->update(['statut' => 'erreur', 'erreurs_detail' => [$e->getMessage()]]);

            return response()->json([
                'message'  => 'Erreur lors de l\'import.',
                'imported' => 0,
                'errors'   => [$e->getMessage()],
            ], 500);
        }
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $import = Import::findOrFail($id);

        return response()->json([
            'id'               => $import->id,
            'statut'           => $import->statut,
            'lignes_total'     => $import->lignes_total,
            'lignes_importees' => $import->lignes_importees,
            'lignes_erreur'    => $import->lignes_erreur,
            'erreurs_detail'   => $import->erreurs_detail,
        ]);
    }
}

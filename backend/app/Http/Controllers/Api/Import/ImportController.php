<?php

namespace App\Http\Controllers\Api\Import;

use App\Http\Controllers\Controller;
use App\Jobs\ImportJob;
use App\Models\Import;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        $user  = $request->user();
        $orgId = $user->organisation_id;

        // Store file permanently so the queued job can access it
        $storedPath = $request->file('fichier')->store('imports', 'local');
        $fullPath   = Storage::disk('local')->path($storedPath);

        // Count data rows for progress tracking (skip BOM + header)
        $lignesTotal = max(0, $this->countCsvRows($fullPath) - 1);

        $import = Import::create([
            'organisation_id' => $orgId,
            'user_id'         => $user->id,
            'type'            => $type,
            'fichier_nom'     => $request->file('fichier')->getClientOriginalName(),
            'statut'          => 'en_attente',
            'lignes_total'    => $lignesTotal,
            'lignes_importees' => 0,
            'lignes_erreur'   => 0,
        ]);

        ImportJob::dispatch($import->id, $fullPath, $type, $orgId, $user->id);

        return response()->json([
            'message' => 'Import en cours de traitement.',
            'job_id'  => $import->id,
        ], 202);
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

    private function countCsvRows(string $filePath): int
    {
        $count  = 0;
        $handle = fopen($filePath, 'r');

        // Skip BOM
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
            rewind($handle);
        }

        while (fgetcsv($handle, 0, ';') !== false) {
            $count++;
        }

        fclose($handle);

        return $count;
    }
}

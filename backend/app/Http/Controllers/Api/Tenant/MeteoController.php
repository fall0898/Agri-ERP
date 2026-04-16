<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Champ;
use App\Services\Meteo\MeteoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeteoController extends Controller
{
    public function __construct(private MeteoService $meteoService) {}

    public function show(Request $request, int $champId): JsonResponse
    {
        $champ = Champ::where('organisation_id', $request->user()->organisation_id)->findOrFail($champId);

        if (!$champ->latitude || !$champ->longitude) {
            return response()->json([
                'message' => 'Ce champ n\'a pas de coordonnées GPS configurées.',
                'meteo_indisponible' => true,
            ], 422);
        }

        $meteo = $this->meteoService->getMeteo($champ->latitude, $champ->longitude);

        return response()->json($meteo);
    }
}

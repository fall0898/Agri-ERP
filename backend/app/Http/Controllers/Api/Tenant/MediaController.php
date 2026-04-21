<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organisation_id;

        $query = Media::where(function ($q) use ($orgId) {
            $q->whereHas('culture', fn ($c) => $c->where('organisation_id', $orgId))
              ->orWhereHas('champ', fn ($c) => $c->where('organisation_id', $orgId));
        })->with(['culture:id,nom', 'champ:id,nom']);

        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->champ_id) {
            $query->where('champ_id', $request->champ_id);
        }
        if ($request->culture_id) {
            $query->where('culture_id', $request->culture_id);
        }

        $medias = $query->orderByDesc('created_at')->get();

        return response()->json($medias);
    }
}

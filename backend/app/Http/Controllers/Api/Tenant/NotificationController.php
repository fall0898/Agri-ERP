<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', $request->user()->id);

        if ($request->has('est_lue')) {
            $query->where('est_lue', filter_var($request->est_lue, FILTER_VALIDATE_BOOLEAN));
        }

        $notifications = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($notifications);
    }

    public function marquerLue(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);

        $notification->update(['est_lue' => true, 'lue_at' => now()]);

        return response()->json($notification);
    }

    public function marquerToutesLues(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('est_lue', false)
            ->update(['est_lue' => true, 'lue_at' => now()]);

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues.']);
    }

    public function countNonLues(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('est_lue', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}

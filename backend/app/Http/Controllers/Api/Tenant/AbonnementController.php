<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Mail\PaiementConfirmeMail;
use App\Models\AbonnementHistorique;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class AbonnementController extends Controller
{
    private array $tarifs = [
        'pro'        => ['mensuel' => 10000, 'annuel' => 100000],
        'entreprise' => ['mensuel' => null,  'annuel' => null],
        'gratuit'    => ['mensuel' => 0,     'annuel' => 0],
    ];

    public function __construct(private PaymentService $paymentService) {}

    public function historique(): JsonResponse
    {
        $org = Auth::user()->organisation;
        $historique = AbonnementHistorique::where('organisation_id', $org->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($h) => [
                'id'                  => $h->id,
                'plan'                => $h->plan_nouveau,
                'plan_precedent'      => $h->plan_precedent,
                'montant_fcfa'        => $h->montant_fcfa,
                'processeur_paiement' => $h->processeur_paiement,
                'reference_paiement'  => $h->reference_paiement,
                'statut'              => $h->statut,
                'debut'               => $h->date_debut,
                'fin'                 => $h->date_fin,
            ]);

        return response()->json(['data' => $historique]);
    }

    public function initierPaiement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'processeur' => 'required|in:wave,orange_money',
            'plan'       => 'required|in:pro',
            'telephone'  => 'nullable|string|max:20',
        ]);

        $organisation = app('tenant');
        $montant = 10000; // FCFA — plan pro uniquement via paiement

        try {
            $result = $this->paymentService
                ->driver($validated['processeur'])
                ->initier($montant, $validated['telephone'] ?? '', "Abonnement {$validated['plan']} Agri-ERP");
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'initialisation du paiement.'], 503);
        }

        \App\Models\AbonnementHistorique::create([
            'organisation_id'     => $organisation->id,
            'plan_precedent'      => $organisation->plan ?? 'gratuit',
            'plan_nouveau'        => $validated['plan'],
            'montant_fcfa'        => $montant,
            'processeur_paiement' => $validated['processeur'],
            'reference_paiement'  => $result['reference_id'],
            'statut'              => 'en_attente',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => null,
        ]);

        return response()->json([
            'payment_url'  => $result['payment_url'],
            'reference_id' => $result['reference_id'],
        ]);
    }

    public function verifierPaiement(Request $request): JsonResponse
    {
        $validated = $request->validate(['reference_id' => 'required|string']);

        $historique = \App\Models\AbonnementHistorique::where('reference_paiement', $validated['reference_id'])
            ->where('organisation_id', app('tenant')->id)
            ->firstOrFail();

        if (in_array($historique->statut, ['paye', 'confirme'])) {
            return response()->json(['statut' => $historique->statut]);
        }

        try {
            $result = $this->paymentService
                ->driver($historique->processeur_paiement)
                ->verifier($historique->reference_paiement);
        } catch (\Exception $e) {
            return response()->json(['statut' => 'en_attente']);
        }

        if ($result['statut'] === 'reussi') {
            $historique->update([
                'statut'   => 'paye',
                'date_fin' => now()->addDays(30)->toDateString(),
            ]);

            $organisation = app('tenant');
            $organisation->update([
                'plan'           => $historique->plan_nouveau,
                'plan_expire_at' => now()->addDays(30),
            ]);

            \App\Models\AuditLog::create([
                'organisation_id' => $organisation->id,
                'user_id'         => $request->user()->id,
                'action'          => 'paiement_confirme',
                'model_type'      => 'AbonnementHistorique',
                'model_id'        => $historique->id,
                'nouvelles_valeurs' => ['plan' => $historique->plan_nouveau, 'montant' => $historique->montant_fcfa],
            ]);
        }

        return response()->json(['statut' => $result['statut']]);
    }

    public function changerPlan(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => 'required|in:gratuit,pro,entreprise',
        ]);

        $org = Auth::user()->organisation;
        $ancienPlan = $org->plan;
        $nouveauPlan = $request->plan;

        if ($nouveauPlan !== 'gratuit') {
            return response()->json([
                'message' => 'Un paiement est requis pour ce plan.',
            ], 422);
        }

        AbonnementHistorique::create([
            'organisation_id'    => $org->id,
            'plan_precedent'     => $ancienPlan,
            'plan_nouveau'       => $nouveauPlan,
            'montant_fcfa'       => 0,
            'processeur_paiement' => null,
            'reference_paiement' => null,
            'statut'             => 'paye',
            'date_debut'         => now()->toDateString(),
            'date_fin'           => null,
        ]);

        $org->update([
            'plan'           => $nouveauPlan,
            'plan_expire_at' => now()->addDays(7),
        ]);

        return response()->json(['message' => 'Plan Gratuit activé. Valide 7 jours.']);
    }

}

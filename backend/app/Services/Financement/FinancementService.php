<?php

namespace App\Services\Financement;

use App\Models\Depense;
use App\Models\Employe;
use App\Models\FinancementIndividuel;
use App\Models\RemboursementFinancement;
use App\Models\Vente;
use Illuminate\Support\Facades\DB;

class FinancementService
{
    /**
     * Crée un financement et génère automatiquement la dépense associée.
     */
    public function creer(array $data, Employe $employe, int $userId): FinancementIndividuel
    {
        return DB::transaction(function () use ($data, $employe, $userId) {
            // Créer la dépense auto-générée
            $depense = Depense::create([
                'organisation_id' => $employe->organisation_id,
                'user_id'         => $userId,
                'champ_id'        => null,
                'categorie'       => 'financement_individuel',
                'description'     => "Financement individuel — {$employe->nom} : {$data['motif']}",
                'montant_fcfa'    => $data['montant_fcfa'],
                'date_depense'    => $data['date_financement'],
                'est_auto_generee' => true,
                'source_type'     => FinancementIndividuel::class,
            ]);

            // Créer le financement
            $financement = FinancementIndividuel::create([
                'organisation_id' => $employe->organisation_id,
                'employe_id'      => $employe->id,
                'user_id'         => $userId,
                'montant_fcfa'    => $data['montant_fcfa'],
                'motif'           => $data['motif'],
                'date_financement' => $data['date_financement'],
                'mode_paiement'   => $data['mode_paiement'] ?? 'especes',
                'notes'           => $data['notes'] ?? null,
                'statut'          => 'en_attente',
                'montant_rembourse_fcfa' => 0,
                'depense_id'      => $depense->id,
            ]);

            // Mettre à jour la source_id maintenant qu'on a l'ID du financement
            $depense->update(['source_id' => $financement->id]);

            return $financement->load(['employe', 'depense', 'remboursements']);
        });
    }

    /**
     * Enregistre un remboursement et génère automatiquement la vente associée.
     */
    public function rembourser(FinancementIndividuel $financement, array $data, int $userId): RemboursementFinancement
    {
        return DB::transaction(function () use ($financement, $data, $userId) {
            $employe = $financement->employe;
            $montant = (float) $data['montant_fcfa'];
            $dateStr = $data['date_remboursement'];

            // Générer la vente (encaissement du remboursement)
            $vente = Vente::create([
                'organisation_id'    => $financement->organisation_id,
                'user_id'            => $userId,
                'acheteur'           => $employe->nom,
                'produit'            => 'Remboursement financement individuel',
                'quantite_kg'        => 1,
                'prix_unitaire_fcfa' => $montant,
                'montant_total_fcfa' => $montant,
                'date_vente'         => $dateStr,
                'notes'              => "Remboursement financement individuel — {$employe->nom} | Motif : {$financement->motif} | Financement du " . $financement->date_financement->format('d/m/Y'),
                'est_auto_generee'   => true,
                'source_type'        => RemboursementFinancement::class,
            ]);

            // Créer le remboursement
            $remboursement = RemboursementFinancement::create([
                'organisation_id'   => $financement->organisation_id,
                'financement_id'    => $financement->id,
                'user_id'           => $userId,
                'montant_fcfa'      => $montant,
                'date_remboursement' => $dateStr,
                'mode_paiement'     => $data['mode_paiement'] ?? 'especes',
                'vente_id'          => $vente->id,
            ]);

            // Mettre à jour source_id sur la vente
            $vente->update(['source_id' => $remboursement->id]);

            // Mettre à jour le montant remboursé et le statut du financement
            $nouveauMontantRembourse = (float) $financement->montant_rembourse_fcfa + $montant;
            $statut = $nouveauMontantRembourse >= (float) $financement->montant_fcfa
                ? 'rembourse'
                : 'en_attente';

            $financement->update([
                'montant_rembourse_fcfa' => $nouveauMontantRembourse,
                'statut'                 => $statut,
            ]);

            return $remboursement->load(['vente']);
        });
    }
}

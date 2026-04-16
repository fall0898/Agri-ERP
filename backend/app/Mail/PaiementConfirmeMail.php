<?php

namespace App\Mail;

use App\Models\AbonnementHistorique;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaiementConfirmeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly AbonnementHistorique $historique,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Paiement confirmé — Agri-ERP ✅');
    }

    public function content(): Content
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));

        return new Content(view: 'emails.paiement_confirme', with: [
            'nomUser'       => $this->user->prenom ?? $this->user->nom,
            'plan'          => ucfirst($this->historique->plan_nouveau),
            'montant'       => number_format($this->historique->montant_fcfa, 0, ',', ' ') . ' FCFA',
            'reference'     => $this->historique->reference_paiement,
            'dateDebut'     => $this->historique->date_debut ? \Carbon\Carbon::parse($this->historique->date_debut)->format('d/m/Y') : '',
            'dateFin'       => $this->historique->date_fin   ? \Carbon\Carbon::parse($this->historique->date_fin)->format('d/m/Y')   : '',
            'urlAbonnement' => "{$frontend}/abonnement",
        ]);
    }
}

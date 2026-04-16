<?php

namespace App\Mail;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BienvenueOrganisationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Organisation $organisation,
        public readonly User $admin,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Bienvenue sur Agri-ERP 🌾');
    }

    public function content(): Content
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));

        return new Content(view: 'emails.bienvenue', with: [
            'nomAdmin'       => $this->admin->prenom ?? $this->admin->nom,
            'nomOrg'         => $this->organisation->nom,
            'plan'           => ucfirst($this->organisation->plan),
            'essaiFinLe'     => $this->organisation->periode_essai_fin?->format('d/m/Y'),
            'urlTableauBord' => "{$frontend}/tableau-de-bord",
        ]);
    }
}

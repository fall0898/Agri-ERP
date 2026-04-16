<?php

namespace App\Mail;

use App\Models\Stock;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlerteStockMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly Stock $stock,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "⚠️ Stock bas : {$this->stock->nom}");
    }

    public function content(): Content
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));

        return new Content(view: 'emails.alerte_stock', with: [
            'nomUser'     => $this->user->prenom ?? $this->user->nom,
            'nomStock'    => $this->stock->nom,
            'quantite'    => $this->stock->quantite_actuelle . ' ' . $this->stock->unite,
            'seuil'       => $this->stock->seuil_alerte . ' ' . $this->stock->unite,
            'urlStocks'   => "{$frontend}/stocks",
        ]);
    }
}

<?php

namespace App\Services\Vente;

use App\Models\Vente;
use Barryvdh\DomPDF\Facade\Pdf;

class RecuPdfService
{
    public function generer(Vente $vente): \Barryvdh\DomPDF\PDF
    {
        $vente->load(['organisation', 'champ', 'culture', 'user']);

        return Pdf::loadView('pdf.recu-vente', ['vente' => $vente])
            ->setPaper('a5', 'portrait');
    }
}

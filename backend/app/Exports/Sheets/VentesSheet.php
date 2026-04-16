<?php

namespace App\Exports\Sheets;

use App\Models\Organisation;
use App\Models\Vente;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class VentesSheet implements FromCollection, WithTitle, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function collection()
    {
        $query = Vente::where('organisation_id', $this->organisation->id)
            ->with(['champ:id,nom', 'culture:id,nom', 'campagne:id,nom'])
            ->orderBy('date_vente');

        if (isset($this->filters['campagne_id'])) $query->where('campagne_id', $this->filters['campagne_id']);
        if (isset($this->filters['date_debut'])) $query->where('date_vente', '>=', $this->filters['date_debut']);
        if (isset($this->filters['date_fin'])) $query->where('date_vente', '<=', $this->filters['date_fin']);

        return $query->get();
    }

    public function headings(): array
    {
        return ['Date', 'Produit', 'Acheteur', 'Quantité (kg)', 'Prix unitaire (FCFA/kg)', 'Montant total (FCFA)', 'Exploitation', 'Culture', 'Campagne'];
    }

    public function map($vente): array
    {
        return [
            $vente->date_vente->format('d/m/Y'),
            $vente->produit,
            $vente->acheteur ?? '—',
            number_format($vente->quantite_kg, 2, ',', ' '),
            number_format($vente->prix_unitaire_fcfa, 0, ',', ' '),
            number_format($vente->montant_total_fcfa, 0, ',', ' '),
            $vente->champ?->nom ?? '—',
            $vente->culture?->nom ?? '—',
            $vente->campagne?->nom ?? '—',
        ];
    }

    public function title(): string
    {
        return 'Ventes';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '22C55E']]],
        ];
    }
}

<?php

namespace App\Exports\Sheets;

use App\Models\Depense;
use App\Models\Organisation;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DepensesSheet implements FromCollection, WithTitle, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function collection()
    {
        $query = Depense::where('organisation_id', $this->organisation->id)
            ->with(['champ:id,nom', 'campagne:id,nom'])
            ->orderBy('date_depense');

        if (isset($this->filters['campagne_id'])) $query->where('campagne_id', $this->filters['campagne_id']);
        if (isset($this->filters['date_debut'])) $query->where('date_depense', '>=', $this->filters['date_debut']);
        if (isset($this->filters['date_fin'])) $query->where('date_depense', '<=', $this->filters['date_fin']);

        return $query->get();
    }

    public function headings(): array
    {
        return ['Date', 'Description', 'Catégorie', 'Exploitation', 'Campagne', 'Montant (FCFA)', 'Auto-générée'];
    }

    public function map($depense): array
    {
        return [
            $depense->date_depense->format('d/m/Y'),
            $depense->description,
            $depense->categorie,
            $depense->champ?->nom ?? '—',
            $depense->campagne?->nom ?? '—',
            number_format($depense->montant_fcfa, 0, ',', ' '),
            $depense->est_auto_generee ? 'Oui' : 'Non',
        ];
    }

    public function title(): string
    {
        return 'Dépenses';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '22C55E']]],
        ];
    }
}

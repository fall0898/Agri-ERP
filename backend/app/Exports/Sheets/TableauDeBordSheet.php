<?php

namespace App\Exports\Sheets;

use App\Models\Depense;
use App\Models\Organisation;
use App\Models\Vente;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TableauDeBordSheet implements FromArray, WithTitle, WithStyles, ShouldAutoSize
{
    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function array(): array
    {
        $ventesQ = Vente::where('organisation_id', $this->organisation->id);
        $depensesQ = Depense::where('organisation_id', $this->organisation->id);

        if (isset($this->filters['campagne_id'])) {
            $ventesQ->where('campagne_id', $this->filters['campagne_id']);
            $depensesQ->where('campagne_id', $this->filters['campagne_id']);
        }
        if (isset($this->filters['date_debut'])) {
            $ventesQ->where('date_vente', '>=', $this->filters['date_debut']);
            $depensesQ->where('date_depense', '>=', $this->filters['date_debut']);
        }
        if (isset($this->filters['date_fin'])) {
            $ventesQ->where('date_vente', '<=', $this->filters['date_fin']);
            $depensesQ->where('date_depense', '<=', $this->filters['date_fin']);
        }

        $totalVentes = $ventesQ->sum('montant_total_fcfa');
        $totalDepenses = $depensesQ->sum('montant_fcfa');

        return [
            ['Agri-ERP — Tableau de Bord Financier'],
            ['Organisation', $this->organisation->nom],
            ['Généré le', now()->format('d/m/Y H:i')],
            [],
            ['Indicateur', 'Montant (FCFA)'],
            ['Total Ventes', number_format($totalVentes, 0, ',', ' ')],
            ['Total Dépenses', number_format($totalDepenses, 0, ',', ' ')],
            ['Solde Net', number_format($totalVentes - $totalDepenses, 0, ',', ' ')],
        ];
    }

    public function title(): string
    {
        return 'Tableau de Bord';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '22C55E']]],
            5 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'D1FAE5']]],
        ];
    }
}

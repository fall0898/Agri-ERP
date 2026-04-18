<?php

namespace App\Exports\Sheets;

use App\Models\Organisation;
use App\Models\Vente;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class VentesSheet implements FromCollection, WithTitle, WithHeadings, WithMapping, WithStyles, WithEvents, ShouldAutoSize
{
    private const GREEN       = '1A7A3E';
    private const GREEN_LIGHT = 'D1FAE5';
    private const GRAY_BG     = 'F9FAFB';

    private int $dataCount = 0;

    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function collection()
    {
        $query = Vente::where('organisation_id', $this->organisation->id)
            ->with(['champ:id,nom', 'culture:id,nom', 'campagne:id,nom'])
            ->orderBy('date_vente');

        if (!empty($this->filters['campagne_id']))  $query->where('campagne_id', $this->filters['campagne_id']);
        if (!empty($this->filters['date_debut']))    $query->where('date_vente', '>=', $this->filters['date_debut']);
        if (!empty($this->filters['date_fin']))      $query->where('date_vente', '<=', $this->filters['date_fin']);

        $results = $query->get();
        $this->dataCount = $results->count();
        return $results;
    }

    public function headings(): array
    {
        return ['Date', 'Produit', 'Acheteur', 'Quantité (kg)', 'Prix unit. (FCFA/kg)', 'Montant total (FCFA)', 'Exploitation', 'Culture', 'Campagne'];
    }

    public function map($vente): array
    {
        return [
            $vente->date_vente->format('d/m/Y'),
            $vente->produit,
            $vente->acheteur ?? '—',
            (float) $vente->quantite_kg,
            (float) $vente->prix_unitaire_fcfa,
            (float) $vente->montant_total_fcfa,
            $vente->champ?->nom   ?? '—',
            $vente->culture?->nom ?? '—',
            $vente->campagne?->nom ?? '—',
        ];
    }

    public function title(): string { return 'Ventes'; }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::GREEN]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $ws       = $event->sheet->getDelegate();
                $lastData = $this->dataCount + 1;

                // Alternating rows
                for ($r = 2; $r <= $lastData; $r++) {
                    $bg = ($r % 2 === 0) ? self::GRAY_BG : 'FFFFFF';
                    $ws->getStyle("A{$r}:I{$r}")->applyFromArray([
                        'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                        'borders' => ['bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['rgb' => 'E5E7EB']]],
                    ]);
                }

                // Number formats for data
                $ws->getStyle("D2:F{$lastData}")->getNumberFormat()->setFormatCode('#,##0.##');
                $ws->getStyle("F2:F{$lastData}")->getNumberFormat()->setFormatCode('#,##0');

                // Total row
                $totalRow = $lastData + 1;
                $query = Vente::where('organisation_id', $this->organisation->id)
                    ->when(!empty($this->filters['campagne_id']), fn($q) => $q->where('campagne_id', $this->filters['campagne_id']))
                    ->when(!empty($this->filters['date_debut']),  fn($q) => $q->where('date_vente', '>=', $this->filters['date_debut']))
                    ->when(!empty($this->filters['date_fin']),    fn($q) => $q->where('date_vente', '<=', $this->filters['date_fin']));

                $totalKg      = (float) (clone $query)->sum('quantite_kg');
                $totalMontant = (float) (clone $query)->sum('montant_total_fcfa');

                $ws->setCellValue("A{$totalRow}", 'TOTAL');
                $ws->setCellValue("C{$totalRow}", "{$this->dataCount} vente(s)");
                $ws->setCellValue("D{$totalRow}", $totalKg);
                $ws->setCellValue("F{$totalRow}", $totalMontant);
                $ws->getStyle("D{$totalRow}")->getNumberFormat()->setFormatCode('#,##0.##');
                $ws->getStyle("F{$totalRow}")->getNumberFormat()->setFormatCode('#,##0');

                $ws->getStyle("A{$totalRow}:I{$totalRow}")->applyFromArray([
                    'font'    => ['bold' => true, 'size' => 11],
                    'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::GREEN_LIGHT]],
                    'borders' => [
                        'top'    => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::GREEN]],
                        'bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::GREEN]],
                    ],
                ]);

                // Column widths
                $ws->getColumnDimension('A')->setWidth(14);
                $ws->getColumnDimension('B')->setWidth(18);
                $ws->getColumnDimension('C')->setWidth(20);
                $ws->getColumnDimension('D')->setWidth(16);
                $ws->getColumnDimension('E')->setWidth(22);
                $ws->getColumnDimension('F')->setWidth(22);
                $ws->getColumnDimension('G')->setWidth(20);
                $ws->getColumnDimension('H')->setWidth(18);
                $ws->getColumnDimension('I')->setWidth(18);

                $ws->getRowDimension(1)->setRowHeight(22);
                $ws->freezePane('A2');
            },
        ];
    }
}

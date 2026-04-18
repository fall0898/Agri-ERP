<?php

namespace App\Exports\Sheets;

use App\Models\Depense;
use App\Models\Organisation;
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

class DepensesSheet implements FromCollection, WithTitle, WithHeadings, WithMapping, WithStyles, WithEvents, ShouldAutoSize
{
    private const GREEN       = '1A7A3E';
    private const GREEN_LIGHT = 'D1FAE5';
    private const GRAY_BG     = 'F9FAFB';

    private const CATEGORIES_FR = [
        'intrant'                   => 'Intrant',
        'salaire'                   => 'Salaire',
        'materiel'                  => 'Matériel',
        'carburant'                 => 'Carburant',
        'main_oeuvre'               => "Main-d'œuvre",
        'traitement_phytosanitaire' => 'Traitement phytosanitaire',
        'transport'                 => 'Transport',
        'irrigation'                => 'Irrigation',
        'entretien_materiel'        => 'Entretien matériel',
        'alimentation_betail'       => 'Alimentation bétail',
        'frais_recolte'             => 'Frais de récolte',
        'financement_individuel'    => 'Financement individuel',
        'autre'                     => 'Autre',
    ];

    private int $dataCount = 0;

    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function collection()
    {
        $query = Depense::where('organisation_id', $this->organisation->id)
            ->with(['champ:id,nom', 'campagne:id,nom'])
            ->orderBy('date_depense');

        if (!empty($this->filters['campagne_id']))  $query->where('campagne_id', $this->filters['campagne_id']);
        if (!empty($this->filters['date_debut']))    $query->where('date_depense', '>=', $this->filters['date_debut']);
        if (!empty($this->filters['date_fin']))      $query->where('date_depense', '<=', $this->filters['date_fin']);

        $results = $query->get();
        $this->dataCount = $results->count();
        return $results;
    }

    public function headings(): array
    {
        return ['Date', 'Description', 'Catégorie', 'Exploitation', 'Campagne', 'Montant (FCFA)'];
    }

    public function map($depense): array
    {
        return [
            $depense->date_depense->format('d/m/Y'),
            $depense->description,
            self::CATEGORIES_FR[$depense->categorie] ?? $depense->categorie,
            $depense->champ?->nom ?? '—',
            $depense->campagne?->nom ?? '—',
            (float) $depense->montant_fcfa,
        ];
    }

    public function title(): string { return 'Dépenses'; }

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
                $ws     = $event->sheet->getDelegate();
                $total  = $this->dataCount;
                $lastData = $total + 1; // +1 for header row

                // Alternating rows
                for ($r = 2; $r <= $lastData; $r++) {
                    $bg = ($r % 2 === 0) ? self::GRAY_BG : 'FFFFFF';
                    $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                        'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                        'borders' => ['bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['rgb' => 'E5E7EB']]],
                    ]);
                }

                // Total row
                $totalRow = $lastData + 1;
                $totalMontant = Depense::where('organisation_id', $this->organisation->id)
                    ->when(!empty($this->filters['campagne_id']), fn($q) => $q->where('campagne_id', $this->filters['campagne_id']))
                    ->when(!empty($this->filters['date_debut']),  fn($q) => $q->where('date_depense', '>=', $this->filters['date_debut']))
                    ->when(!empty($this->filters['date_fin']),    fn($q) => $q->where('date_depense', '<=', $this->filters['date_fin']))
                    ->sum('montant_fcfa');

                $ws->setCellValue("A{$totalRow}", 'TOTAL');
                $ws->setCellValue("E{$totalRow}", "{$total} ligne(s)");
                $ws->setCellValue("F{$totalRow}", (float) $totalMontant);
                $ws->getStyle("F{$totalRow}")->getNumberFormat()->setFormatCode('#,##0');
                $ws->getStyle("A{$totalRow}:F{$totalRow}")->applyFromArray([
                    'font'    => ['bold' => true, 'size' => 11],
                    'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::GREEN_LIGHT]],
                    'borders' => [
                        'top'    => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::GREEN]],
                        'bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::GREEN]],
                    ],
                ]);

                // Number format for montant column
                $ws->getStyle("F2:F{$lastData}")->getNumberFormat()->setFormatCode('#,##0');

                // Column widths
                $ws->getColumnDimension('A')->setWidth(14);
                $ws->getColumnDimension('B')->setWidth(40);
                $ws->getColumnDimension('C')->setWidth(26);
                $ws->getColumnDimension('D')->setWidth(22);
                $ws->getColumnDimension('E')->setWidth(18);
                $ws->getColumnDimension('F')->setWidth(20);

                // Header row height
                $ws->getRowDimension(1)->setRowHeight(22);

                // Freeze header
                $ws->freezePane('A2');
            },
        ];
    }
}

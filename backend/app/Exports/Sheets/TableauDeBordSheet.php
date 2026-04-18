<?php

namespace App\Exports\Sheets;

use App\Models\Champ;
use App\Models\Depense;
use App\Models\Organisation;
use App\Models\Vente;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class TableauDeBordSheet implements WithTitle, WithEvents, ShouldAutoSize
{
    private const GREEN       = '1A7A3E';
    private const GREEN_LIGHT = 'D1FAE5';
    private const GREEN_MID   = 'A7F3D0';
    private const GRAY_BG     = 'F9FAFB';
    private const HEADER_TXT  = 'FFFFFF';

    private const CATEGORIES_FR = [
        'intrant'                    => 'Intrant',
        'salaire'                    => 'Salaire',
        'materiel'                   => 'Matériel',
        'carburant'                  => 'Carburant',
        'main_oeuvre'                => "Main-d'œuvre",
        'traitement_phytosanitaire'  => 'Traitement phytosanitaire',
        'transport'                  => 'Transport',
        'irrigation'                 => 'Irrigation',
        'entretien_materiel'         => 'Entretien matériel',
        'alimentation_betail'        => 'Alimentation bétail',
        'frais_recolte'              => 'Frais de récolte',
        'financement_individuel'     => 'Financement individuel',
        'autre'                      => 'Autre',
    ];

    private array $sectionRows = [];

    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function title(): string { return 'Résumé'; }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $ws = $event->sheet->getDelegate();
                $this->build($ws);
                $this->applyStyles($ws);
            },
        ];
    }

    private function build($ws): void
    {
        $orgId = $this->organisation->id;

        $ventesQ   = Vente::where('organisation_id', $orgId);
        $depensesQ = Depense::where('organisation_id', $orgId);
        $this->applyFilters($ventesQ, $depensesQ);

        $totalVentes   = (float) (clone $ventesQ)->sum('montant_total_fcfa');
        $totalDepenses = (float) (clone $depensesQ)->sum('montant_fcfa');
        $soldeNet      = $totalVentes - $totalDepenses;
        $marge         = $totalVentes > 0 ? round($soldeNet / $totalVentes * 100, 1) : 0;

        // Per-champ
        $ventesParChamp   = (clone $ventesQ)->whereNotNull('champ_id')
            ->select('champ_id', DB::raw('SUM(montant_total_fcfa) as total'))
            ->groupBy('champ_id')->pluck('total', 'champ_id');
        $depensesParChamp = (clone $depensesQ)->whereNotNull('champ_id')
            ->select('champ_id', DB::raw('SUM(montant_fcfa) as total'))
            ->groupBy('champ_id')->pluck('total', 'champ_id');
        $champIds = $ventesParChamp->keys()->merge($depensesParChamp->keys())->unique();
        $champs   = Champ::whereIn('id', $champIds)->pluck('nom', 'id');

        // Per-category
        $depensesParCat = (clone $depensesQ)
            ->select('categorie', DB::raw('SUM(montant_fcfa) as total'))
            ->groupBy('categorie')->orderByDesc('total')->get();

        $row = 1;

        // ── TITRE ─────────────────────────────────────────────────────────────
        $ws->mergeCells("A{$row}:F{$row}");
        $ws->setCellValue("A{$row}", "RAPPORT FINANCIER — {$this->organisation->nom}");
        $this->sectionRows['title'] = $row;
        $row++;

        $ws->mergeCells("A{$row}:C{$row}");
        $ws->mergeCells("D{$row}:F{$row}");
        $periode = '';
        if (!empty($this->filters['date_debut']) && !empty($this->filters['date_fin'])) {
            $periode = "Période : {$this->filters['date_debut']} → {$this->filters['date_fin']}";
        }
        $ws->setCellValue("A{$row}", $periode ?: 'Toutes périodes confondues');
        $ws->setCellValue("D{$row}", "Généré le " . now()->format('d/m/Y à H:i'));
        $this->sectionRows['subtitle'] = $row;
        $row += 2;

        // ── SYNTHÈSE ──────────────────────────────────────────────────────────
        $ws->mergeCells("A{$row}:F{$row}");
        $ws->setCellValue("A{$row}", 'SYNTHÈSE FINANCIÈRE');
        $this->sectionRows['synthese_header'] = $row;
        $row++;

        $ws->setCellValue("A{$row}", 'Indicateur');
        $ws->setCellValue("D{$row}", 'Montant (FCFA)');
        $ws->setCellValue("F{$row}", '%');
        $this->sectionRows['synthese_col_header'] = $row;
        $row++;

        $this->sectionRows['synthese_data_start'] = $row;
        $rows = [
            ['Total ventes',   $totalVentes,   '100 %'],
            ['Total dépenses', $totalDepenses, $totalVentes > 0 ? round($totalDepenses / $totalVentes * 100, 1) . ' %' : '—'],
            ['Solde net',      $soldeNet,      "{$marge} %"],
        ];
        foreach ($rows as $r) {
            $ws->mergeCells("A{$row}:C{$row}");
            $ws->mergeCells("D{$row}:E{$row}");
            $ws->setCellValue("A{$row}", $r[0]);
            $ws->setCellValue("D{$row}", $r[1]);
            $ws->setCellValue("F{$row}", $r[2]);
            $ws->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $row++;
        }
        $this->sectionRows['synthese_data_end'] = $row - 1;
        $row++;

        // ── PAR EXPLOITATION ──────────────────────────────────────────────────
        if ($champIds->isNotEmpty()) {
            $ws->mergeCells("A{$row}:F{$row}");
            $ws->setCellValue("A{$row}", 'RÉSULTATS PAR EXPLOITATION');
            $this->sectionRows['champ_header'] = $row;
            $row++;

            $ws->setCellValue("A{$row}", 'Exploitation');
            $ws->setCellValue("B{$row}", 'Ventes (FCFA)');
            $ws->setCellValue("C{$row}", 'Dépenses (FCFA)');
            $ws->setCellValue("D{$row}", 'Solde net (FCFA)');
            $ws->setCellValue("E{$row}", 'Marge');
            $this->sectionRows['champ_col_header'] = $row;
            $row++;

            $this->sectionRows['champ_data_start'] = $row;
            foreach ($champIds as $champId) {
                $v = (float) ($ventesParChamp[$champId] ?? 0);
                $d = (float) ($depensesParChamp[$champId] ?? 0);
                $s = $v - $d;
                $ws->setCellValue("A{$row}", $champs[$champId] ?? "Champ #{$champId}");
                $ws->setCellValue("B{$row}", $v);
                $ws->setCellValue("C{$row}", $d);
                $ws->setCellValue("D{$row}", $s);
                $ws->setCellValue("E{$row}", $v > 0 ? round($s / $v * 100, 1) . ' %' : '—');
                foreach (['B', 'C', 'D'] as $col) {
                    $ws->getStyle("{$col}{$row}")->getNumberFormat()->setFormatCode('#,##0');
                }
                $row++;
            }

            // Dépenses générales
            $depGenerales = max(0, $totalDepenses - (float) $depensesParChamp->sum());
            if ($depGenerales > 0) {
                $ws->setCellValue("A{$row}", 'Dépenses générales (sans exploitation)');
                $ws->setCellValue("B{$row}", 0);
                $ws->setCellValue("C{$row}", $depGenerales);
                $ws->setCellValue("D{$row}", -$depGenerales);
                $ws->setCellValue("E{$row}", '—');
                foreach (['B', 'C', 'D'] as $col) {
                    $ws->getStyle("{$col}{$row}")->getNumberFormat()->setFormatCode('#,##0');
                }
                $row++;
            }

            // Ligne TOTAL
            $ws->setCellValue("A{$row}", 'TOTAL');
            $ws->setCellValue("B{$row}", $totalVentes);
            $ws->setCellValue("C{$row}", $totalDepenses);
            $ws->setCellValue("D{$row}", $soldeNet);
            $ws->setCellValue("E{$row}", "{$marge} %");
            foreach (['B', 'C', 'D'] as $col) {
                $ws->getStyle("{$col}{$row}")->getNumberFormat()->setFormatCode('#,##0');
            }
            $this->sectionRows['champ_total'] = $row;
            $this->sectionRows['champ_data_end'] = $row;
            $row += 2;
        }

        // ── PAR CATÉGORIE ─────────────────────────────────────────────────────
        if ($depensesParCat->isNotEmpty()) {
            $ws->mergeCells("A{$row}:F{$row}");
            $ws->setCellValue("A{$row}", 'DÉPENSES PAR CATÉGORIE');
            $this->sectionRows['cat_header'] = $row;
            $row++;

            $ws->setCellValue("A{$row}", 'Catégorie');
            $ws->setCellValue("C{$row}", 'Montant (FCFA)');
            $ws->setCellValue("E{$row}", '% du total dépenses');
            $this->sectionRows['cat_col_header'] = $row;
            $row++;

            $this->sectionRows['cat_data_start'] = $row;
            foreach ($depensesParCat as $item) {
                $pct = $totalDepenses > 0 ? round($item->total / $totalDepenses * 100, 1) : 0;
                $ws->mergeCells("A{$row}:B{$row}");
                $ws->mergeCells("C{$row}:D{$row}");
                $ws->setCellValue("A{$row}", self::CATEGORIES_FR[$item->categorie] ?? $item->categorie);
                $ws->setCellValue("C{$row}", (float) $item->total);
                $ws->setCellValue("E{$row}", "{$pct} %");
                $ws->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0');
                $row++;
            }
            $this->sectionRows['cat_data_end'] = $row - 1;
        }
    }

    private function applyStyles($ws): void
    {
        $green      = self::GREEN;
        $greenLight = self::GREEN_LIGHT;
        $greenMid   = self::GREEN_MID;
        $gray       = self::GRAY_BG;
        $white      = 'FFFFFF';

        // Title row
        if (isset($this->sectionRows['title'])) {
            $r = $this->sectionRows['title'];
            $ws->getRowDimension($r)->setRowHeight(30);
            $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 16, 'color' => ['rgb' => $white]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $green]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ]);
        }

        // Subtitle row
        if (isset($this->sectionRows['subtitle'])) {
            $r = $this->sectionRows['subtitle'];
            $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                'font'      => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '374151']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $greenLight]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $ws->getStyle("D{$r}:F{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        // Section headers (big green blocks)
        foreach (['synthese_header', 'champ_header', 'cat_header'] as $key) {
            if (!isset($this->sectionRows[$key])) continue;
            $r = $this->sectionRows[$key];
            $ws->getRowDimension($r)->setRowHeight(22);
            $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 12, 'color' => ['rgb' => $white]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $green]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
            ]);
        }

        // Column headers (light green)
        foreach (['synthese_col_header', 'champ_col_header', 'cat_col_header'] as $key) {
            if (!isset($this->sectionRows[$key])) continue;
            $r = $this->sectionRows[$key];
            $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 10],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $greenMid]],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $green]]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
        }

        // Data rows — alternating background
        foreach ([['synthese_data_start', 'synthese_data_end'], ['champ_data_start', 'champ_data_end'], ['cat_data_start', 'cat_data_end']] as [$startKey, $endKey]) {
            if (!isset($this->sectionRows[$startKey], $this->sectionRows[$endKey])) continue;
            for ($r = $this->sectionRows[$startKey]; $r <= $this->sectionRows[$endKey]; $r++) {
                $bg = ($r % 2 === 0) ? $gray : $white;
                $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['rgb' => 'E5E7EB']]],
                ]);
            }
        }

        // Total row — bold dark green
        if (isset($this->sectionRows['champ_total'])) {
            $r = $this->sectionRows['champ_total'];
            $ws->getStyle("A{$r}:F{$r}")->applyFromArray([
                'font'    => ['bold' => true, 'size' => 11],
                'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $greenLight]],
                'borders' => [
                    'top'    => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $green]],
                    'bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $green]],
                ],
            ]);
        }

        // Column widths
        $ws->getColumnDimension('A')->setWidth(35);
        $ws->getColumnDimension('B')->setWidth(22);
        $ws->getColumnDimension('C')->setWidth(22);
        $ws->getColumnDimension('D')->setWidth(22);
        $ws->getColumnDimension('E')->setWidth(14);
        $ws->getColumnDimension('F')->setWidth(14);
    }

    private function applyFilters($ventesQ, $depensesQ): void
    {
        if (!empty($this->filters['campagne_id'])) {
            $ventesQ->where('campagne_id', $this->filters['campagne_id']);
            $depensesQ->where('campagne_id', $this->filters['campagne_id']);
        }
        if (!empty($this->filters['date_debut'])) {
            $ventesQ->where('date_vente', '>=', $this->filters['date_debut']);
            $depensesQ->where('date_depense', '>=', $this->filters['date_debut']);
        }
        if (!empty($this->filters['date_fin'])) {
            $ventesQ->where('date_vente', '<=', $this->filters['date_fin']);
            $depensesQ->where('date_depense', '<=', $this->filters['date_fin']);
        }
    }
}

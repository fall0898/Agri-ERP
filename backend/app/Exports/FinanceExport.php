<?php

namespace App\Exports;

use App\Models\Depense;
use App\Models\Organisation;
use App\Models\Vente;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class FinanceExport implements WithMultipleSheets
{
    use Exportable;

    public function __construct(
        private Organisation $organisation,
        private array $filters = []
    ) {}

    public function sheets(): array
    {
        return [
            new Sheets\TableauDeBordSheet($this->organisation, $this->filters),
            new Sheets\DepensesSheet($this->organisation, $this->filters),
            new Sheets\VentesSheet($this->organisation, $this->filters),
        ];
    }
}

<?php

namespace App\Services\Finance;

use App\Exports\FinanceExport;
use App\Models\Organisation;
use Maatwebsite\Excel\Facades\Excel;

class RapportExcelService
{
    public function generer(Organisation $organisation, array $filters = [])
    {
        $nom = "rapport-finance-{$organisation->slug}-" . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new FinanceExport($organisation, $filters), $nom);
    }
}

<?php

namespace App\Jobs;

use App\Models\Import;
use App\Services\Import\CsvImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries   = 1;

    public function __construct(
        private int    $importId,
        private string $filePath,
        private string $type,
        private int    $orgId,
        private int    $userId,
    ) {}

    public function handle(CsvImportService $service): void
    {
        $import = Import::find($this->importId);
        if (! $import) return;

        $import->update(['statut' => 'en_cours']);

        try {
            $result = $service->process($this->filePath, $this->type, $this->orgId, $this->userId);

            $import->update([
                'statut'           => 'termine',
                'lignes_importees' => $result['imported'],
                'lignes_erreur'    => count($result['errors']),
                'erreurs_detail'   => $result['errors'] ?: null,
            ]);
        } catch (\Throwable $e) {
            $import->update([
                'statut'         => 'erreur',
                'erreurs_detail' => [$e->getMessage()],
            ]);
        } finally {
            // Clean up the temp file
            if (file_exists($this->filePath)) {
                @unlink($this->filePath);
            }
        }
    }
}

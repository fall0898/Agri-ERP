<?php

namespace App\Services\Stock;

use App\Models\MouvementStock;
use App\Models\Stock;
use App\Services\Stock\Strategies\AchatStrategy;
use App\Services\Stock\Strategies\AjustementStrategy;
use App\Services\Stock\Strategies\MouvementStrategyInterface;
use App\Services\Stock\Strategies\PerteStrategy;
use App\Services\Stock\Strategies\UtilisationStrategy;
use InvalidArgumentException;

class StockService
{
    private function getStrategy(string $type): MouvementStrategyInterface
    {
        return match ($type) {
            'achat' => new AchatStrategy(),
            'utilisation' => new UtilisationStrategy(),
            'perte' => new PerteStrategy(),
            'ajustement' => new AjustementStrategy(),
            default => throw new InvalidArgumentException("Type de mouvement inconnu : {$type}"),
        };
    }

    public function enregistrerMouvement(Stock $stock, array $data): MouvementStock
    {
        $strategy = $this->getStrategy($data['type']);
        return $strategy->execute($stock, $data);
    }

    public function getAlertes(int $organisationId): \Illuminate\Database\Eloquent\Collection
    {
        return Stock::where('organisation_id', $organisationId)
            ->where('est_actif', true)
            ->whereNotNull('seuil_alerte')
            ->whereRaw('quantite_actuelle <= seuil_alerte')
            ->with(['intrant'])
            ->get();
    }
}

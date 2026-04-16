<?php

namespace App\Providers;

use App\Events\AbonnementExpire;
use App\Events\IntrantUtilise;
use App\Events\SalairePaye;
use App\Events\StockAchete;
use App\Events\StockEnAlerte;
use App\Events\TenantCree;
use App\Listeners\ActiverPeriodeEssai;
use App\Listeners\CreerCampagneDefaut;
use App\Listeners\CreerDepenseAchatStock;
use App\Listeners\CreerDepenseSalaire;
use App\Listeners\CreerIntrantsDefaut;
use App\Listeners\DebiterStock;
use App\Listeners\EnvoyerEmailBienvenue;
use App\Listeners\EnvoyerNotificationStockBas;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        StockAchete::class => [
            CreerDepenseAchatStock::class,
        ],
        SalairePaye::class => [
            CreerDepenseSalaire::class,
        ],
        IntrantUtilise::class => [
            DebiterStock::class,
        ],
        StockEnAlerte::class => [
            EnvoyerNotificationStockBas::class,
        ],
        TenantCree::class => [
            ActiverPeriodeEssai::class,
            CreerCampagneDefaut::class,
            CreerIntrantsDefaut::class,
            EnvoyerEmailBienvenue::class,
        ],
    ];

    public function boot(): void {}

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}

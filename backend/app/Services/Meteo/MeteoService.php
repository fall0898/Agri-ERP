<?php
namespace App\Services\Meteo;

use Illuminate\Support\Facades\Http;

class MeteoService
{
    private array $zones = [
        'dakar_niayes' => ['lat' => 14.72, 'lon' => -17.47],
        'thies'        => ['lat' => 14.79, 'lon' => -16.92],
        'louga'        => ['lat' => 15.62, 'lon' => -16.22],
        'saint_louis'  => ['lat' => 16.03, 'lon' => -16.50],
        'podor'        => ['lat' => 16.66, 'lon' => -15.20],
        'dagana'       => ['lat' => 16.43, 'lon' => -16.06],
        'kaolack'      => ['lat' => 14.15, 'lon' => -16.07],
        'ziguinchor'   => ['lat' => 12.57, 'lon' => -16.27],
        'tambacounda'  => ['lat' => 13.77, 'lon' => -13.67],
    ];

    public function getMeteo(?string $zone, ?float $latitude, ?float $longitude): array
    {
        if ($latitude && $longitude) {
            $lat = $latitude;
            $lon = $longitude;
        } elseif ($zone && isset($this->zones[$zone])) {
            $lat = $this->zones[$zone]['lat'];
            $lon = $this->zones[$zone]['lon'];
        } else {
            $lat = 14.72;
            $lon = -17.47;
        }

        try {
            $response = Http::timeout(8)->get('https://api.open-meteo.com/v1/forecast', [
                'latitude'       => $lat,
                'longitude'      => $lon,
                'daily'          => 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,et0_fao_evapotranspiration',
                'timezone'       => 'Africa/Dakar',
                'forecast_days'  => 7,
            ]);

            if (! $response->successful()) {
                return $this->defaultMeteo();
            }

            $daily = $response->json('daily') ?? [];

            return [
                'temp_max_moy' => round(collect($daily['temperature_2m_max'] ?? [])->avg() ?? 32, 1),
                'temp_min_moy' => round(collect($daily['temperature_2m_min'] ?? [])->avg() ?? 22, 1),
                'humidite_moy' => (int) round(collect($daily['relative_humidity_2m_mean'] ?? [])->avg() ?? 60),
                'pluie_totale' => round(collect($daily['precipitation_sum'] ?? [])->sum() ?? 0, 1),
                'et0_moy'      => round(collect($daily['et0_fao_evapotranspiration'] ?? [])->avg() ?? 5, 1),
            ];
        } catch (\Throwable) {
            return $this->defaultMeteo();
        }
    }

    private function defaultMeteo(): array
    {
        return [
            'temp_max_moy' => 32.0,
            'temp_min_moy' => 22.0,
            'humidite_moy' => 60,
            'pluie_totale' => 0.0,
            'et0_moy'      => 5.0,
        ];
    }
}

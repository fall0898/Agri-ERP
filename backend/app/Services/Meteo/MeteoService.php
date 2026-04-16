<?php

namespace App\Services\Meteo;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MeteoService
{
    private string $apiKey;
    private string $baseUrl;
    private int $maxRetries = 3;

    public function __construct()
    {
        $this->apiKey = config('services.openweather.key', '');
        $this->baseUrl = config('services.openweather.url', 'https://api.openweathermap.org/data/2.5');
    }

    public function getMeteo(float $latitude, float $longitude): ?array
    {
        if (empty($this->apiKey)) {
            return $this->getFallback();
        }

        $cacheKey = "meteo_{$latitude}_{$longitude}";

        return Cache::remember($cacheKey, 10800, function () use ($latitude, $longitude) {
            return $this->fetchWithCircuitBreaker($latitude, $longitude);
        });
    }

    private function fetchWithCircuitBreaker(float $lat, float $lon): ?array
    {
        $circuitKey = "meteo_circuit_open";

        if (Cache::get($circuitKey, false)) {
            return $this->getFallback();
        }

        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                $current = Http::timeout(5)->get("{$this->baseUrl}/weather", [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => $this->apiKey,
                    'units' => 'metric',
                    'lang' => 'fr',
                ]);

                $forecast = Http::timeout(5)->get("{$this->baseUrl}/forecast", [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => $this->apiKey,
                    'units' => 'metric',
                    'lang' => 'fr',
                    'cnt' => 24,
                ]);

                if ($current->successful() && $forecast->successful()) {
                    Cache::forget("meteo_circuit_open");
                    return $this->formatResponse($current->json(), $forecast->json());
                }
            } catch (\Exception $e) {
                Log::warning("Tentative météo {$attempt}/{$this->maxRetries} échouée : {$e->getMessage()}");

                if ($attempt < $this->maxRetries) {
                    sleep(pow(2, $attempt));
                }
            }
        }

        Cache::put("meteo_circuit_open", true, 300);
        return $this->getFallback();
    }

    private function formatResponse(array $current, array $forecast): array
    {
        $previsions = collect($forecast['list'] ?? [])
            ->groupBy(fn($item) => date('Y-m-d', $item['dt']))
            ->take(3)
            ->map(fn($items, $date) => [
                'date' => $date,
                'temp_min' => round(collect($items)->min('main.temp_min'), 1),
                'temp_max' => round(collect($items)->max('main.temp_max'), 1),
                'description' => $items[0]['weather'][0]['description'] ?? '',
                'icone' => $items[0]['weather'][0]['icon'] ?? '',
            ])
            ->values()
            ->toArray();

        return [
            'temperature' => round($current['main']['temp'] ?? 0, 1),
            'ressentie' => round($current['main']['feels_like'] ?? 0, 1),
            'humidite' => $current['main']['humidity'] ?? 0,
            'vent_kmh' => round(($current['wind']['speed'] ?? 0) * 3.6, 1),
            'description' => $current['weather'][0]['description'] ?? '',
            'icone' => $current['weather'][0]['icon'] ?? '',
            'prevision_3j' => $previsions,
            'meteo_indisponible' => false,
        ];
    }

    private function getFallback(): array
    {
        return [
            'meteo_indisponible' => true,
            'message' => 'Service météo temporairement indisponible.',
        ];
    }
}

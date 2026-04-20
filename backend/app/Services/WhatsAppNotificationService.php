<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService
{
    private string $phone;
    private string $apiKey;

    public function __construct()
    {
        $this->phone  = config('services.callmebot.phone', '');
        $this->apiKey = config('services.callmebot.api_key', '');
    }

    public function sendNouvelleInscription(array $data): void
    {
        if (empty($this->phone) || empty($this->apiKey)) {
            return;
        }

        $pays = $data['pays'] ?? 'Non renseigné';
        $now  = now()->format('d/m/Y à H:i');

        $message = "🌾 *Nouvelle inscription Agri-ERP !*\n\n"
            . "👤 Nom : {$data['nom']}\n"
            . "📱 Téléphone : {$data['telephone']}\n"
            . "🏡 Exploitation : {$data['nom_organisation']}\n"
            . "🌍 Pays : {$pays}\n"
            . "🕐 Le : {$now}";

        try {
            Http::timeout(8)->get('https://api.callmebot.com/whatsapp.php', [
                'phone'  => $this->phone,
                'text'   => $message,
                'apikey' => $this->apiKey,
            ]);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp notification failed: ' . $e->getMessage());
        }
    }
}

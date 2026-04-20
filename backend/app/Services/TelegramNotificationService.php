<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotificationService
{
    private string $token;
    private string $chatId;

    public function __construct()
    {
        $this->token  = config('services.telegram.token', '');
        $this->chatId = config('services.telegram.chat_id', '');
    }

    public function sendNouvelleInscription(array $data): void
    {
        if (empty($this->token) || empty($this->chatId)) {
            Log::warning('Telegram: token ou chat_id manquant');
            return;
        }

        $pays = $data['pays'] ?? 'Non renseigné';
        $now  = now()->format('d/m/Y à H:i');

        $message = "🌾 Nouvelle inscription Agri-ERP !\n\n"
            . "👤 Nom : {$data['nom']}\n"
            . "📱 Téléphone : {$data['telephone']}\n"
            . "🏡 Exploitation : {$data['nom_organisation']}\n"
            . "🌍 Pays : {$pays}\n"
            . "🕐 Le : {$now}";

        try {
            $response = Http::timeout(8)->post("https://api.telegram.org/bot{$this->token}/sendMessage", [
                'chat_id' => $this->chatId,
                'text'    => $message,
            ]);
            if (!$response->successful()) {
                Log::warning('Telegram notification failed: ' . $response->body());
            }
        } catch (\Throwable $e) {
            Log::warning('Telegram notification exception: ' . $e->getMessage());
        }
    }
}

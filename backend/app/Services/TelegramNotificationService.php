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
            return;
        }

        $pays = $data['pays'] ?? 'Non renseigné';
        $now  = now()->format('d/m/Y à H:i');

        $message = "🌾 *Nouvelle inscription Agri-ERP \!*\n\n"
            . "👤 Nom : " . $this->escape($data['nom']) . "\n"
            . "📱 Téléphone : " . $this->escape($data['telephone']) . "\n"
            . "🏡 Exploitation : " . $this->escape($data['nom_organisation']) . "\n"
            . "🌍 Pays : " . $this->escape($pays) . "\n"
            . "🕐 Le : " . $now;

        try {
            Http::timeout(8)->post("https://api.telegram.org/bot{$this->token}/sendMessage", [
                'chat_id'    => $this->chatId,
                'text'       => $message,
                'parse_mode' => 'MarkdownV2',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Telegram notification failed: ' . $e->getMessage());
        }
    }

    private function escape(string $text): string
    {
        return preg_replace('/([_*\[\]()~`>#+=|{}.!\-])/', '\\\\$1', $text);
    }
}

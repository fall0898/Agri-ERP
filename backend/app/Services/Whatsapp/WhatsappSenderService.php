<?php
namespace App\Services\Whatsapp;

use Twilio\Rest\Client;

class WhatsappSenderService
{
    private Client $twilio;
    private string $from;

    public function __construct()
    {
        $this->twilio = new Client(
            config('whatsapp.twilio_account_sid'),
            config('whatsapp.twilio_auth_token')
        );
        $this->from = config('whatsapp.twilio_from', 'whatsapp:+14155238886');
    }

    public function send(string $toPhone, string $message): void
    {
        $this->twilio->messages->create(
            'whatsapp:' . $toPhone,
            ['from' => $this->from, 'body' => $message]
        );
    }
}

<?php

namespace App\Services\Whatsapp;

use Illuminate\Support\Facades\Http;

class TranscriptionService
{
    /**
     * Transcribe an audio file from a Twilio media URL using OpenAI Whisper.
     *
     * @param  string  $audioUrl   Twilio media URL (requires Basic Auth)
     * @param  string  $mimeType   MIME type of the audio file
     * @return string              Transcribed text
     *
     * @throws \Exception on download or transcription failure
     */
    public function transcribe(string $audioUrl, string $mimeType = 'audio/ogg'): string
    {
        $sid   = config('whatsapp.twilio_account_sid');
        $token = config('whatsapp.twilio_auth_token');
        $key   = config('whatsapp.openai_key');

        // 1. Download audio from Twilio with Basic Auth
        $download = Http::withBasicAuth($sid, $token)->get($audioUrl);

        if (! $download->successful()) {
            throw new \Exception("Impossible de télécharger l'audio Twilio (HTTP {$download->status()}).");
        }

        $audioContent = $download->body();

        // 2. Determine file extension from MIME type
        $extension = $this->extensionFromMime($mimeType);

        // 3. Send to OpenAI Whisper
        $response = Http::withToken($key)
            ->attach('file', $audioContent, "audio.{$extension}", ['Content-Type' => $mimeType])
            ->post('https://api.openai.com/v1/audio/transcriptions', [
                'model'    => 'whisper-1',
                'language' => 'fr',
            ]);

        if (! $response->successful()) {
            throw new \Exception("Échec de la transcription Whisper (HTTP {$response->status()}).");
        }

        $text = $response->json('text');

        if (! is_string($text) || trim($text) === '') {
            throw new \Exception('Whisper a renvoyé une transcription vide.');
        }

        return trim($text);
    }

    /**
     * Map a MIME type to an appropriate file extension accepted by Whisper.
     */
    private function extensionFromMime(string $mimeType): string
    {
        $map = [
            'audio/ogg'          => 'ogg',
            'audio/ogg; codecs=opus' => 'ogg',
            'audio/amr'          => 'amr',
            'audio/mpeg'         => 'mp3',
            'audio/mp3'          => 'mp3',
            'audio/mp4'          => 'mp4',
            'audio/m4a'          => 'm4a',
            'audio/wav'          => 'wav',
            'audio/webm'         => 'webm',
            'audio/flac'         => 'flac',
            'audio/x-flac'       => 'flac',
        ];

        // Strip parameters (e.g. "audio/ogg; codecs=opus" → "audio/ogg") for lookup
        $base = strtolower(trim(explode(';', $mimeType)[0]));

        return $map[$mimeType] ?? $map[$base] ?? 'ogg';
    }
}

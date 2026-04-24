<?php

namespace App\Services\Whatsapp;

use Illuminate\Support\Facades\Cache;

class ConversationStateService
{
    private string $prefix = 'wa_conv_';
    private int    $ttl    = 600; // 10 minutes

    public function get(string $phone): ?array
    {
        return Cache::get($this->prefix . $phone);
    }

    public function set(string $phone, array $state): void
    {
        Cache::put($this->prefix . $phone, $state, $this->ttl);
    }

    public function clear(string $phone): void
    {
        Cache::forget($this->prefix . $phone);
    }
}

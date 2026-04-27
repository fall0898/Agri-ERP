<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    'openweather' => [
        'key' => env('OPENWEATHER_API_KEY', ''),
        'url' => env('OPENWEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5'),
    ],
    'wave' => [
        'api_key'    => env('WAVE_API_KEY'),
        'secret_key' => env('WAVE_SECRET_KEY'),
        'api_url'    => env('WAVE_API_URL', 'https://api.wave.com/v1'),
    ],

    'orange_money' => [
        'api_key'      => env('ORANGE_MONEY_API_KEY'),
        'secret_key'   => env('ORANGE_MONEY_SECRET_KEY'),
        'merchant_key' => env('ORANGE_MONEY_MERCHANT_KEY'),
        'api_url'      => env('ORANGE_MONEY_API_URL', 'https://api.orange.com/orange-money-webpay/dev/v1'),
    ],

    'telegram' => [
        'token'   => env('TELEGRAM_BOT_TOKEN', ''),
        'chat_id' => env('TELEGRAM_CHAT_ID', ''),
    ],

    'anthropic' => [
        'key' => env('ANTHROPIC_API_KEY'),
    ],
];

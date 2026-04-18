<?php

return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
    'profiles_sample_rate' => 0.0,
    'send_default_pii' => false,
    'environment' => env('APP_ENV', 'production'),
    'release' => env('APP_VERSION', null),
];

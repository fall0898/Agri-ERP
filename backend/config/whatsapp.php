<?php

return [
    'twilio_account_sid' => env('TWILIO_ACCOUNT_SID'),
    'twilio_auth_token'  => env('TWILIO_AUTH_TOKEN'),
    'twilio_from'        => env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
    'openai_key'         => env('OPENAI_API_KEY'),
    'validate_signature' => env('TWILIO_VALIDATE_SIGNATURE', false),
];

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Twilio\Security\RequestValidator;

class ValidateTwilioSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('whatsapp.validate_signature', false)) {
            return $next($request);
        }

        $token = config('whatsapp.twilio_auth_token');
        if (! $token) {
            return response('Twilio auth token not configured', 500);
        }

        $signature = $request->header('X-Twilio-Signature', '');
        $url       = $request->fullUrl();

        $validator = new RequestValidator($token);

        if (! $validator->validate($signature, $url, $request->post())) {
            \Log::warning('WhatsApp: signature Twilio invalide', [
                'ip'  => $request->ip(),
                'url' => $url,
            ]);
            return response('Forbidden', 403);
        }

        return $next($request);
    }
}

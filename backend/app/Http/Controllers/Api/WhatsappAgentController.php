<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappUser;
use App\Services\Whatsapp\ActionExecutor;
use App\Services\Whatsapp\AgentService;
use App\Services\Whatsapp\ConversationStateService;
use App\Services\Whatsapp\TranscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WhatsappAgentController extends Controller
{
    public function __construct(
        private AgentService             $agentService,
        private ActionExecutor           $actionExecutor,
        private ConversationStateService $conversationState,
        private TranscriptionService     $transcription,
    ) {}

    public function handle(Request $request): Response
    {
        $from  = $request->input('From', '');
        $phone = preg_replace('/^whatsapp:/i', '', $from);
        $body  = trim($request->input('Body', ''));

        // If audio message, transcribe first
        if ($request->has('MediaUrl0') && empty($body)) {
            try {
                $body = $this->transcription->transcribe(
                    $request->input('MediaUrl0'),
                    $request->input('MediaContentType0', 'audio/ogg')
                );
            } catch (\Exception $e) {
                return $this->twiml('Désolé, je n\'ai pas pu comprendre votre message audio. Essayez par texte.');
            }
        }

        $waUser = WhatsappUser::where('phone_number', $phone)->where('est_actif', true)->first();

        if (! $waUser) {
            return $this->twiml(
                "Ce numéro n'est pas lié à un compte Agri-ERP. Connectez-vous à l'application pour activer votre accès WhatsApp."
            );
        }

        app()->instance('tenant', $waUser->organisation);

        $state = $this->conversationState->get($phone);

        if ($state && $state['step'] === 'awaiting_confirmation') {
            if ($this->estConfirmation($body)) {
                $result = $this->actionExecutor->execute(
                    $state['intent'],
                    $state['params'],
                    $waUser,
                    $state['language'] ?? 'fr'
                );
                $this->conversationState->clear($phone);
                return $this->twiml($result['response']);
            }

            if ($this->estAnnulation($body)) {
                $this->conversationState->clear($phone);
                $msg = ($state['language'] ?? 'fr') === 'wo'
                    ? "Annulé. Waxal ma léegi te nuy def."
                    : "Annulé. Dites-moi ce que vous souhaitez faire.";
                return $this->twiml($msg);
            }
        }

        if (empty($body)) {
            return $this->twiml("Envoyez un message texte ou un message vocal.");
        }

        try {
            $agent = $this->agentService->process($body, $waUser->organisation);
        } catch (\Exception $e) {
            \Log::error('WhatsApp AgentService error: ' . $e->getMessage());
            return $this->twiml("Désolé, une erreur s'est produite. Réessayez dans un instant.");
        }

        if (in_array($agent['intent'], ['ADD_DEPENSE', 'ADD_VENTE', 'ADD_MOUVEMENT_STOCK'])) {
            $this->conversationState->set($phone, [
                'step'     => 'awaiting_confirmation',
                'intent'   => $agent['intent'],
                'params'   => $agent['params'] ?? [],
                'language' => $agent['language'] ?? 'fr',
            ]);
            return $this->twiml($agent['response']);
        }

        if (in_array($agent['intent'], ['QUERY_FINANCES', 'QUERY_STOCK', 'QUERY_DEPENSES', 'QUERY_VENTES'])) {
            $result = $this->actionExecutor->execute(
                $agent['intent'],
                $agent['params'] ?? [],
                $waUser,
                $agent['language'] ?? 'fr'
            );
            return $this->twiml($result['response']);
        }

        return $this->twiml($agent['response']);
    }

    private function twiml(string $message): Response
    {
        $safe = htmlspecialchars($message, ENT_XML1, 'UTF-8');
        $xml  = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>{$safe}</Message></Response>";
        return response($xml, 200, ['Content-Type' => 'text/xml']);
    }

    private function estConfirmation(string $text): bool
    {
        return in_array(strtolower(trim($text)), ['oui', 'yes', 'waaw', 'ok', 'o', '✓']);
    }

    private function estAnnulation(string $text): bool
    {
        return in_array(strtolower(trim($text)), ['non', 'no', 'deedeet', 'annuler', 'cancel', 'annule']);
    }
}

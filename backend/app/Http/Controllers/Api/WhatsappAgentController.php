<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Culture;
use App\Models\Diagnostic;
use App\Models\WhatsappUser;
use App\Services\Whatsapp\ActionExecutor;
use App\Services\Whatsapp\AgentService;
use App\Services\Whatsapp\ConversationStateService;
use App\Services\Whatsapp\TranscriptionService;
use Anthropic\Client as AnthropicClient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;

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

        $waUser = WhatsappUser::where('phone_number', $phone)->where('est_actif', true)->first();

        if (! $waUser) {
            return $this->twiml(
                "Ce numéro n'est pas lié à un compte Agri-ERP. Connectez-vous à l'application pour activer votre accès WhatsApp."
            );
        }

        app()->instance('tenant', $waUser->organisation);

        // ── Onboarding ─────────────────────────────────────────────────────────
        if (! $waUser->onboarded_at) {
            $state = $this->conversationState->get($phone);

            if (! $state || ! isset($state['step'])) {
                $this->conversationState->set($phone, ['step' => 'awaiting_langue']);
                return $this->twiml("Bonjour ! / Asalaa Maalekum !\n\nRépondez :\n1️⃣ pour Français\n2️⃣ pour Wolof");
            }

            if ($state['step'] === 'awaiting_langue') {
                $langue = in_array(trim($body), ['2', 'wo', 'wolof']) ? 'wo' : 'fr';
                $waUser->update(['langue' => $langue]);
                $this->conversationState->set($phone, ['step' => 'awaiting_systeme', 'langue' => $langue]);
                $q = $langue === 'wo'
                    ? "Système d'arrosage bi?\n1️⃣ Aspersion\n2️⃣ Goutte-à-goutte\n3️⃣ Gravitaire"
                    : "Quel système d'arrosage utilisez-vous ?\n1️⃣ Aspersion\n2️⃣ Goutte-à-goutte\n3️⃣ Gravitaire";
                return $this->twiml($q);
            }

            if ($state['step'] === 'awaiting_systeme') {
                $systeme = match (trim($body)) {
                    '2'     => 'goutte_a_goutte',
                    '3'     => 'gravitaire',
                    default => 'aspersion',
                };
                $waUser->update(['systeme_arrosage' => $systeme, 'onboarded_at' => now()]);
                $this->conversationState->clear($phone);
                $langue = $state['langue'] ?? 'fr';
                $bienvenue = $langue === 'wo'
                    ? "✅ Jëff-jëf! Configuration bi jeex.\n\nSend menu pour xam li mën la def."
                    : "✅ Parfait ! Configuration terminée.\n\nEnvoyez *menu* pour voir ce que je peux faire.";
                return $this->twiml($bienvenue);
            }
        }

        // ── Analyse photo phytosanitaire ──────────────────────────────────────
        $mediaUrl  = $request->input('MediaUrl0', '');
        $mediaType = $request->input('MediaContentType0', '');

        if ($mediaUrl && str_starts_with($mediaType, 'image/')) {
            return $this->analyserPhoto($mediaUrl, $mediaType, $waUser);
        }

        // ── Transcription audio ───────────────────────────────────────────────
        if ($mediaUrl && empty($body)) {
            try {
                $body = $this->transcription->transcribe($mediaUrl, $mediaType ?: 'audio/ogg');
            } catch (\Exception $e) {
                return $this->twiml('Désolé, je n\'ai pas pu comprendre votre message audio. Essayez par texte.');
            }
        }

        // ── Flux conversation ─────────────────────────────────────────────────
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
            return $this->twiml("Envoyez un message texte, une photo ou un message vocal.");
        }

        try {
            $agent = $this->agentService->process($body, $waUser->organisation);
        } catch (\Exception $e) {
            \Log::error('WhatsApp AgentService error: ' . $e->getMessage());
            return $this->twiml("Désolé, une erreur s'est produite. Réessayez dans un instant.");
        }

        if (in_array($agent['intent'], ['ADD_DEPENSE', 'ADD_VENTE', 'ADD_MOUVEMENT_STOCK', 'SIGNALER_TRAITEMENT'])) {
            $this->conversationState->set($phone, [
                'step'     => 'awaiting_confirmation',
                'intent'   => $agent['intent'],
                'params'   => $agent['params'] ?? [],
                'language' => $agent['language'] ?? 'fr',
            ]);
            return $this->twiml($agent['response']);
        }

        if (in_array($agent['intent'], ['QUERY_FINANCES', 'QUERY_STOCK', 'QUERY_DEPENSES', 'QUERY_VENTES', 'CALENDRIER_CULTURAL'])) {
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

    // ── Analyse photo phytosanitaire ──────────────────────────────────────────

    private function analyserPhoto(string $mediaUrl, string $mediaType, WhatsappUser $waUser): Response
    {
        $langue = $waUser->langue ?? 'fr';

        $sid   = config('whatsapp.twilio_account_sid');
        $token = config('whatsapp.twilio_auth_token');

        try {
            $download = Http::withBasicAuth($sid, $token)->timeout(15)->get($mediaUrl);
            if (! $download->successful()) {
                return $this->twiml($langue === 'wo'
                    ? "Amul xam-xam image bi. Jëfandikoo ci kanam."
                    : "Impossible de télécharger la photo. Réessayez.");
            }
        } catch (\Throwable) {
            return $this->twiml($langue === 'wo'
                ? "Dëkkandiku ci download image."
                : "Erreur lors du téléchargement de la photo.");
        }

        $culture = Culture::where('organisation_id', $waUser->organisation_id)
            ->where('statut', 'en_cours')
            ->whereNotNull('type_culture')
            ->orderByDesc('date_semis')
            ->first();

        $typeCulture = $culture?->type_culture ?? 'tomate';

        $prompt  = "Culture concernée : {$typeCulture}";
        $prompt .= "\nZone : Sénégal";
        if ($culture) {
            $prompt .= "\nStade estimé : " . (int) $culture->date_semis?->diffInDays(now()) . " jours depuis le semis";
        }
        $prompt .= "\n\nAnalyse cette photo et identifie la maladie ou le ravageur. Réponds en JSON strict.";

        $imageData = base64_encode($download->body());

        try {
            $client   = new AnthropicClient(apiKey: env('ANTHROPIC_API_KEY'));
            $response = $client->messages->create(
                model:     'claude-opus-4-5',
                maxTokens: 512,
                system:    $this->promptPhytosanitaire(),
                messages:  [[
                    'role'    => 'user',
                    'content' => [
                        ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $mediaType, 'data' => $imageData]],
                        ['type' => 'text',  'text'   => $prompt],
                    ],
                ]],
            );

            $raw  = $response->content[0]->text;
            $json = json_decode($raw, true);

            if (! $json) {
                preg_match('/\{.*\}/s', $raw, $m);
                $json = $m ? json_decode($m[0], true) : null;
            }

            if (! $json) {
                return $this->twiml($langue === 'wo'
                    ? "IA dafa dimbéli. Jëfandikoo ci kanam."
                    : "L'analyse IA n'a pas pu identifier la maladie. Réessayez avec une photo plus nette.");
            }

            Diagnostic::create([
                'organisation_id'       => $waUser->organisation_id,
                'user_id'               => $waUser->user_id,
                'type_culture'          => $typeCulture,
                'image_url'             => $mediaUrl,
                'description_symptomes' => 'Via WhatsApp',
                'maladie_detectee'      => $json['maladie'] ?? null,
                'niveau_confiance'      => $json['niveau_confiance'] ?? 'moyen',
                'symptomes'             => $json['symptomes'] ?? [],
                'traitement_immediat'   => $json['traitement_immediat'] ?? [],
                'produits_senegal'      => $json['produits_senegal'] ?? [],
                'prevention'            => $json['prevention'] ?? [],
                'conseil'               => $json['conseil'] ?? null,
                'reponse_ia_brute'      => $raw,
            ]);

            $maladie    = $json['maladie'] ?? 'Problème détecté';
            $confiance  = $json['niveau_confiance'] ?? 'moyen';
            $traitements = collect($json['traitement_immediat'] ?? [])->take(2)->implode("\n• ");
            $produits    = collect($json['produits_senegal'] ?? [])->take(2)->implode(', ');

            $msg  = "🔬 *Diagnostic phytosanitaire*\n";
            $msg .= "🌿 Culture : {$typeCulture}\n\n";
            $msg .= "🦠 *{$maladie}* (confiance: {$confiance})\n\n";
            if ($traitements) {
                $msg .= "💊 *Traitement immédiat :*\n• {$traitements}\n\n";
            }
            if ($produits) {
                $msg .= "🏪 *Produits Sénégal :* {$produits}\n\n";
            }
            if (! empty($json['conseil'])) {
                $msg .= "💡 {$json['conseil']}";
            }

            return $this->twiml(rtrim($msg));

        } catch (\Throwable $e) {
            \Log::error('WhatsApp photo diagnostic error: ' . $e->getMessage());
            return $this->twiml($langue === 'wo'
                ? "Dëkkandiku ci analyse foto bi."
                : "Erreur lors de l'analyse de la photo.");
        }
    }

    private function promptPhytosanitaire(): string
    {
        return "Tu es un expert phytosanitaire spécialisé Sénégal / Afrique de l'Ouest. "
            . "Analyse la photo et retourne UNIQUEMENT ce JSON (sans markdown) : "
            . '{"maladie":"nom","maladie_scientifique":"nom","niveau_confiance":"élevé|moyen|faible",'
            . '"symptomes":["..."],"traitement_immediat":["..."],"produits_senegal":["..."],'
            . '"prevention":["..."],"conseil":"conseil court pratique","urgence":"immédiate|moderee|faible"}';
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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

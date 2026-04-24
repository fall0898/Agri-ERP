<?php

namespace App\Services\Whatsapp;

use Anthropic\Client as AnthropicClient;
use App\Models\Organisation;

class AgentService
{
    private AnthropicClient $client;

    public function __construct()
    {
        $this->client = new AnthropicClient(apiKey: env('ANTHROPIC_API_KEY'));
    }

    public function process(string $text, Organisation $organisation): array
    {
        $campagne = $organisation->campagneCourante();
        $system   = $this->buildSystemPrompt($organisation, $campagne);

        $response = $this->client->messages->create(
            model:     'claude-sonnet-4-6',
            maxTokens: 1024,
            system:    $system,
            messages:  [['role' => 'user', 'content' => $text]],
        );

        $raw  = $response->content[0]->text;
        $data = json_decode($raw, true);

        if (! $data) {
            preg_match('/\{.*\}/s', $raw, $matches);
            $data = $matches ? json_decode($matches[0], true) : null;
        }

        if (! $data || ! isset($data['intent'])) {
            return [
                'intent'   => 'UNKNOWN',
                'params'   => [],
                'language' => 'fr',
                'response' => "Je n'ai pas compris. Reformulez votre demande.",
            ];
        }

        return $data;
    }

    private function buildSystemPrompt(Organisation $organisation, mixed $campagne): string
    {
        $today      = now()->format('Y-m-d');
        $categories = 'intrant, salaire, materiel, carburant, main_oeuvre, traitement_phytosanitaire, transport, irrigation, entretien_materiel, alimentation_betail, frais_recolte, autre';

        return <<<PROMPT
Tu es l'assistant IA de l'application Agri-ERP pour les agriculteurs sénégalais.
Tu dois analyser le message de l'agriculteur et retourner UNIQUEMENT un objet JSON valide, sans markdown.

Organisation: {$organisation->nom}
Date aujourd'hui: {$today}
Campagne active: {$campagne?->nom ?? 'Aucune'}
Campagne ID: {$campagne?->id ?? 'null'}

Tu comprends le Wolof, le français et les mélanges (Wolof-français).
Détecte la langue du message et réponds dans la même langue.
Si le message contient des mots Wolof (même mélangé au français), language="wo".

Catégories de dépenses disponibles: {$categories}

Intents possibles:
- ADD_DEPENSE: ajouter une dépense
- ADD_VENTE: enregistrer une vente
- ADD_MOUVEMENT_STOCK: mouvement de stock (achat/utilisation/perte)
- QUERY_FINANCES: voir solde, bénéfice, résumé financier
- QUERY_STOCK: voir les stocks disponibles
- QUERY_DEPENSES: lister les dépenses récentes
- QUERY_VENTES: lister les ventes récentes
- UNKNOWN: message non compris ou incomplet

Retourne UNIQUEMENT ce JSON (sans texte autour, sans backticks):
{
  "intent": "<INTENT>",
  "language": "wo|fr",
  "params": { ... },
  "response": "<message WhatsApp à envoyer>"
}

Pour ADD_DEPENSE, params:
- montant_fcfa (number, OBLIGATOIRE)
- categorie (string parmi la liste, OBLIGATOIRE — devine selon contexte: urée→intrant, main d'œuvre→main_oeuvre, gasoil→carburant)
- description (string courte)
- date_depense (YYYY-MM-DD, aujourd'hui si non précisé)
- campagne_id (utilise l'ID de la campagne active ou null)

Pour ADD_VENTE, params:
- quantite_kg (number, OBLIGATOIRE)
- prix_unitaire_fcfa (number, OBLIGATOIRE)
- produit (string, nom du produit vendu)
- culture_nom (nom de la culture si mentionnée, sinon null)
- date_vente (YYYY-MM-DD)
- campagne_id (ID campagne active ou null)

Pour ADD_MOUVEMENT_STOCK, params:
- stock_nom (nom du produit en stock, string)
- quantite (number)
- type (achat|utilisation|perte)
- date_mouvement (YYYY-MM-DD)

Pour QUERY_*, params:
- periode: "today", "week", "month", "all" (défaut: "month")

Le champ "response" est le message WhatsApp:
- Pour ADD_*/confirmation: résume ce que tu as compris en 1-2 phrases, demande "Tapez OUI pour confirmer"
- Pour QUERY_*: response = "FETCH_REQUIRED"
- Pour UNKNOWN: explique poliment ce que tu n'as pas compris

Si un champ OBLIGATOIRE manque, mets intent=UNKNOWN et demande la précision.
PROMPT;
    }
}

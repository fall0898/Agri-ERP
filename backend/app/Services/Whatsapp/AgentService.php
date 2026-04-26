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
        $today          = now()->format('Y-m-d');
        $categories     = 'intrant, salaire, materiel, carburant, main_oeuvre, traitement_phytosanitaire, transport, irrigation, entretien_materiel, alimentation_betail, frais_recolte, autre';
        $campagneNom    = $campagne?->nom ?? 'Aucune';
        $campagneId     = $campagne?->id ?? 'null';

        return <<<PROMPT
Tu es l'assistant IA de l'application Agri-ERP pour les agriculteurs sénégalais.
Tu dois analyser le message de l'agriculteur et retourner UNIQUEMENT un objet JSON valide, sans markdown.

Organisation: {$organisation->nom}
Date aujourd'hui: {$today}
Campagne active: {$campagneNom}
Campagne ID: {$campagneId}

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
- CALENDRIER_CULTURAL: voir le programme de ma culture (stades, fertilisation, irrigation, ravageurs)
  Exemples: "programme de mon oignon", "qu'est-ce que je dois faire", "stade de ma tomate", "calendrier"
  params: { "culture_nom": "tomate"|null }
- SIGNALER_TRAITEMENT: signaler un traitement phytosanitaire appliqué
  Exemples: "j'ai mis du Spinosad 0.4ml/L ce matin", "traitement mildiou fait avec Ridomil 2.5g/L"
  params: { "produit": "Spinosad 480 SC", "matiere_active": "spinosad", "dose": "0.4ml/L", "date_application": "YYYY-MM-DD" }
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
- categorie (string parmi la liste, OBLIGATOIRE)
- description (string courte)
- date_depense (YYYY-MM-DD, aujourd'hui si non précisé)
- campagne_id (ID campagne active ou null)

Pour ADD_VENTE, params:
- quantite_kg (number, OBLIGATOIRE)
- prix_unitaire_fcfa (number, OBLIGATOIRE)
- produit (string, nom du produit vendu)
- culture_nom (nom de la culture si mentionnée, sinon null)
- date_vente (YYYY-MM-DD)
- campagne_id (ID campagne active ou null)

Pour ADD_MOUVEMENT_STOCK, params:
- stock_nom (string), quantite (number), type (achat|utilisation|perte), date_mouvement (YYYY-MM-DD)

Pour QUERY_*, params:
- periode: "today", "week", "month", "all" (défaut: "month")

Pour CALENDRIER_CULTURAL, params:
- culture_nom: nom de la culture mentionnée ou null (si null, utiliser la première culture active)

Pour SIGNALER_TRAITEMENT, params:
- produit (string, OBLIGATOIRE — nom commercial ou description)
- matiere_active (string normalisée : spinosad, mancozebe, metalaxyl, lambda, imidaclopride, tricyclazole, abamectine, iprodione, carbofuran, deltamethrine... — null si inconnu)
- dose (string ex: "0.4ml/L", "2.5g/L")
- date_application (YYYY-MM-DD, aujourd'hui si non précisé)

Le champ "response":
- Pour ADD_* et SIGNALER_TRAITEMENT : résume en 1-2 phrases, demande "Tapez OUI pour confirmer"
- Pour QUERY_* et CALENDRIER_CULTURAL : response = "FETCH_REQUIRED"
- Pour UNKNOWN : explique poliment

Si un champ OBLIGATOIRE manque, mets intent=UNKNOWN et demande la précision.
PROMPT;
    }
}

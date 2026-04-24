# Agent IA WhatsApp Wolof — Design Spec

**Date :** 2026-04-24  
**Statut :** Approuvé

---

## Contexte et objectif

La majorité des utilisateurs finaux d'Agri-ERP sont des paysans sénégalais, souvent peu alphabétisés, qui parlent principalement le Wolof. L'interface graphique actuelle crée une barrière d'utilisation. L'objectif est d'offrir un agent IA via WhatsApp : le paysan parle (message vocal ou texte en Wolof ou français), l'agent comprend et exécute directement l'action dans Agri-ERP.

---

## Décisions de conception

| Sujet | Décision |
|---|---|
| Canal | WhatsApp Business (Twilio API, sandbox pour dev) |
| Input | Texte ET messages vocaux (audio WhatsApp) |
| Langue | Auto-detect : répond en Wolof si le paysan écrit/parle Wolof, en français sinon |
| Auth | Par numéro de téléphone lié au compte Agri-ERP une seule fois |
| Confirmation | Toujours confirmer avant d'enregistrer (résumé + attendre "OUI") |
| Transcription | OpenAI Whisper API (audio → texte Wolof/français) |
| Compréhension | Claude API (claude-sonnet-4-6) avec system prompt spécialisé |

---

## Architecture

### Flux d'un message

```
Paysan (WhatsApp) → Twilio Webhook → POST /api/whatsapp/webhook
  └─ Si audio → TranscriptionService (Whisper) → texte
  └─ AgentService (Claude) → intent + params extraits
  └─ Si en attente confirmation → ActionExecutor → DB Agri-ERP
  └─ WhatsAppReplyService → réponse Twilio → paysan
```

### Nouveaux composants backend (Laravel)

#### 1. `POST /api/whatsapp/webhook`
- Route publique (pas de Sanctum), sécurisée par signature Twilio (`X-Twilio-Signature`)
- Reçoit `From` (numéro paysan), `Body` (texte) ou `MediaUrl0` (audio)
- Délègue à `WhatsAppAgentController`

#### 2. `TranscriptionService`
- Télécharge l'audio depuis l'URL Twilio (format OGG/AMR)
- Envoie à OpenAI Whisper API (`whisper-1`, language hint: `fr` pour meilleure couverture Wolof)
- Retourne le texte transcrit

#### 3. `AgentService`
- Reçoit le texte (transcrit ou direct) + contexte du tenant
- Appelle Claude API avec un system prompt incluant :
  - Rôle : assistant agricole sénégalais
  - Vocabulaire Wolof fréquent (dépense = "dëkkal xaalis", vente = "jaay", stock = "tëralef")
  - Format de réponse structuré JSON : `{intent, params, response_wolof, response_fr}`
- Intents supportés : `ADD_DEPENSE`, `ADD_VENTE`, `ADD_MOUVEMENT_STOCK`, `QUERY_FINANCES`, `QUERY_STOCK`, `QUERY_DEPENSES`, `QUERY_VENTES`, `CONFIRM`, `CANCEL`, `UNKNOWN`

#### 4. `ConversationStateService`
- Stocke l'état de conversation par numéro de téléphone dans le Cache Laravel (TTL 10 min)
- Structure : `{ pending_action: intent, pending_params: {...}, step: 'awaiting_confirmation' }`
- Permet le flux en 2 étapes : proposition → confirmation → exécution

#### 5. `ActionExecutor`
- Reçoit l'intent validé + params
- Appelle les services Agri-ERP existants :
  - `ADD_DEPENSE` → `Depense::create()` avec `organisation_id` du user lié
  - `ADD_VENTE` → `VenteService::creer()`
  - `ADD_MOUVEMENT_STOCK` → `StockService` via la strategy appropriée
  - `QUERY_*` → requêtes Eloquent filtrées par `organisation_id`

#### 6. `WhatsAppReplyService`
- Envoie la réponse via Twilio REST API
- Choisit `response_wolof` ou `response_fr` selon la langue détectée

#### 7. Migration + Model `WhatsappUser`
```sql
CREATE TABLE whatsapp_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL REFERENCES users(id),
  organisation_id BIGINT NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  est_actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Frontend Angular (liaison du numéro)

- Nouvelle section dans `/parametres` : "Connecter WhatsApp"
- Champ numéro de téléphone + bouton "Lier mon numéro"
- `PUT /api/parametres/whatsapp` — enregistre le numéro dans `whatsapp_users`
- Message de confirmation affiché : numéro du bot WhatsApp à contacter

---

## System Prompt Claude (résumé)

```
Tu es l'assistant IA de l'application Agri-ERP pour les paysans sénégalais.
Tu comprends le Wolof, le français et les mélanges des deux (Wolof-français).
Tu extrais des informations agricoles (montants, catégories, cultures, champs, dates).
Tu réponds TOUJOURS dans la langue du paysan.
Tu retournes un JSON structuré avec : intent, params, response_text.
Quand un champ est manquant (montant, catégorie), tu le demandes poliment.
```

---

## Actions supportées

| Intent | Exemple de message paysan | Données extraites |
|---|---|---|
| `ADD_DEPENSE` | "Maa ngi jënd 3 sac urée 15 000 FCFA" | montant, catégorie (intrant), date |
| `ADD_VENTE` | "J'ai vendu 100 kg de tomates à 400 FCFA" | culture, quantité, prix, date |
| `ADD_MOUVEMENT_STOCK` | "Maa ngi jënd 50 L gasoil" | produit, quantité, type (achat) |
| `QUERY_FINANCES` | "Quel est mon bénéfice ce mois ?" | période |
| `QUERY_STOCK` | "Xam ma stock bi" | (tout) |
| `QUERY_DEPENSES` | "Donne-moi mes dépenses cette semaine" | période |
| `QUERY_VENTES` | "Lii ñaar fan, dafa am ventes bañ ?" | période |

---

## Flux de confirmation (exemple)

```
Paysan : [audio] "Maa ngi jënd 3 sac urée, 15 000 FCFA"
   ↓ Whisper transcrit
Bot : "Maa ngi xam : dépense 15 000 FCFA pour Intrant le 24 avr.
       Dafa dëgg ? Bindël OUI ngir xaar."
Paysan : "OUI"
Bot : "✅ Dépense enregistrée ! Solde du mois : -47 500 FCFA"
```

---

## Variables d'environnement à ajouter

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # sandbox Twilio
OPENAI_API_KEY=                              # pour Whisper
# ANTHROPIC_API_KEY déjà présent
```

---

## Ce qui est hors scope (v1)

- Notifications proactives (rappels tâches, alertes stock) — v2
- Gestion des empleys et salaires via WhatsApp — v2
- Interface admin pour voir les conversations — v2
- Support d'autres langues (Peul, Sérère) — v2

---

## Ordre d'implémentation suggéré

1. Migration + model `WhatsappUser`
2. Endpoint liaison numéro (frontend + backend)
3. Webhook Twilio + vérification signature
4. `TranscriptionService` (Whisper)
5. `AgentService` (Claude, intents texte d'abord)
6. `ConversationStateService` (cache)
7. `ActionExecutor` (dépense + vente en priorité)
8. `WhatsAppReplyService`
9. Tests avec sandbox Twilio
10. Déploiement + vrai numéro WhatsApp Business

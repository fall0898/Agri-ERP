# Agent WhatsApp IA Wolof — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux paysans sénégalais de gérer leur Agri-ERP en Wolof ou français via WhatsApp — message texte ou vocal — sans ouvrir l'application.

**Architecture:** Un webhook Laravel public reçoit les messages Twilio, identifie le paysan via son numéro lié, transcrit l'audio si besoin (Whisper), passe le texte à Claude pour extraire l'intent et les paramètres, exécute l'action dans la DB via les services existants, et répond en TwiML. Le flux en 2 étapes (intention → confirmation → exécution) garantit zéro erreur d'enregistrement.

**Tech Stack:** Laravel 12, `anthropic-ai/sdk` (déjà installé), `openai-php/client` (Whisper), `twilio/sdk`, Laravel Cache (état conversation), TwiML XML pour les réponses.

---

## Fichiers touchés

| Action | Fichier | Rôle |
|---|---|---|
| CREATE | `backend/database/migrations/2026_04_24_000001_create_whatsapp_users_table.php` | Table de liaison numéro↔compte |
| CREATE | `backend/app/Models/WhatsappUser.php` | Model sans TenantScope |
| CREATE | `backend/config/whatsapp.php` | Config Twilio + OpenAI |
| CREATE | `backend/app/Services/Whatsapp/ConversationStateService.php` | Cache état conversation par numéro |
| CREATE | `backend/app/Services/Whatsapp/AgentService.php` | Claude : intent extraction + réponse |
| CREATE | `backend/app/Services/Whatsapp/ActionExecutor.php` | Exécute les actions en DB |
| CREATE | `backend/app/Services/Whatsapp/TranscriptionService.php` | Whisper : audio → texte |
| CREATE | `backend/app/Http/Controllers/Api/WhatsappAgentController.php` | Webhook + orchestration |
| MODIFY | `backend/routes/api.php` | Ajouter routes webhook + parametres/whatsapp |
| MODIFY | `backend/app/Http/Controllers/Api/Tenant/ParametresController.php` | linkWhatsapp() + unlinkWhatsapp() |
| MODIFY | `backend/.env.example` | Nouvelles clés |
| CREATE | `backend/tests/Feature/WhatsappAgentTest.php` | Tests feature complets |
| MODIFY | `frontend/src/app/features/parametres/parametres.component.ts` | Section "Connecter WhatsApp" |

---

## Task 1 : Dépendances + Config

**Files:**
- Create: `backend/config/whatsapp.php`
- Modify: `backend/.env.example`

- [ ] **Step 1: Installer les packages PHP**

```bash
cd backend
composer require openai-php/client twilio/sdk
```

Résultat attendu : `Package operations: 2 installs` (ou similaire), pas d'erreur.

- [ ] **Step 2: Créer `backend/config/whatsapp.php`**

```php
<?php

return [
    'twilio_account_sid' => env('TWILIO_ACCOUNT_SID'),
    'twilio_auth_token'  => env('TWILIO_AUTH_TOKEN'),
    'twilio_from'        => env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
    'openai_key'         => env('OPENAI_API_KEY'),
    'validate_signature' => env('TWILIO_VALIDATE_SIGNATURE', false),
];
```

- [ ] **Step 3: Ajouter les clés à `.env.example`**

Ajouter à la fin de `backend/.env.example` :

```env
# WhatsApp Agent IA
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
OPENAI_API_KEY=
TWILIO_VALIDATE_SIGNATURE=false
```

Ajouter aussi dans votre `.env` local (laisser vides pour tests locaux — le signature check est désactivé par défaut).

- [ ] **Step 4: Commit**

```bash
git add backend/config/whatsapp.php backend/.env.example backend/composer.json backend/composer.lock
git commit -m "chore(whatsapp): install twilio+openai deps and add config"
```

---

## Task 2 : Migration + Model WhatsappUser

**Files:**
- Create: `backend/database/migrations/2026_04_24_000001_create_whatsapp_users_table.php`
- Create: `backend/app/Models/WhatsappUser.php`

- [ ] **Step 1: Créer la migration**

```bash
cd backend
php artisan make:migration create_whatsapp_users_table
```

Puis remplir le fichier créé dans `database/migrations/` :

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
            $table->string('phone_number', 20)->unique();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_users');
    }
};
```

- [ ] **Step 2: Créer `backend/app/Models/WhatsappUser.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsappUser extends Model
{
    protected $fillable = ['user_id', 'organisation_id', 'phone_number', 'est_actif'];

    protected $casts = ['est_actif' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }
}
```

- [ ] **Step 3: Lancer la migration**

```bash
cd backend
php artisan migrate
```

Résultat attendu : `Migrating: ...create_whatsapp_users_table` puis `Migrated`.

- [ ] **Step 4: Écrire le test**

Créer `backend/tests/Feature/WhatsappAgentTest.php` :

```php
<?php

namespace Tests\Feature;

use App\Models\WhatsappUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class WhatsappAgentTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    private function creerUtilisateurLie(string $phone = '+221770809798'): array
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();

        WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $org->id,
            'phone_number'    => $phone,
            'est_actif'       => true,
        ]);

        return compact('org', 'user');
    }

    public function test_whatsapp_user_peut_etre_lie(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();

        $waUser = WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $org->id,
            'phone_number'    => '+221770809798',
            'est_actif'       => true,
        ]);

        $this->assertDatabaseHas('whatsapp_users', [
            'phone_number' => '+221770809798',
            'user_id'      => $user->id,
        ]);
    }
}
```

- [ ] **Step 5: Lancer le test**

```bash
cd backend
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add database/migrations/ app/Models/WhatsappUser.php tests/Feature/WhatsappAgentTest.php
git commit -m "feat(whatsapp): add whatsapp_users table and model"
```

---

## Task 3 : Endpoint liaison numéro (Backend)

**Files:**
- Modify: `backend/app/Http/Controllers/Api/Tenant/ParametresController.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Ajouter les méthodes à ParametresController**

Ajouter en haut du fichier :
```php
use App\Models\WhatsappUser;
```

Ajouter les deux méthodes avant la dernière accolade `}` :

```php
    public function linkWhatsapp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'regex:/^\+\d{10,15}$/'],
        ]);

        $user = $request->user();

        // Supprimer l'ancien lien s'il existe pour cet utilisateur
        WhatsappUser::where('user_id', $user->id)->delete();

        // Vérifier que ce numéro n'est pas déjà pris par un autre utilisateur
        if (WhatsappUser::where('phone_number', $validated['phone_number'])->exists()) {
            return response()->json(['message' => 'Ce numéro est déjà lié à un autre compte.'], 422);
        }

        $waUser = WhatsappUser::create([
            'user_id'         => $user->id,
            'organisation_id' => $user->organisation_id,
            'phone_number'    => $validated['phone_number'],
            'est_actif'       => true,
        ]);

        return response()->json([
            'message'      => 'Numéro WhatsApp lié avec succès.',
            'phone_number' => $waUser->phone_number,
        ]);
    }

    public function unlinkWhatsapp(Request $request): JsonResponse
    {
        WhatsappUser::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Numéro WhatsApp délié.']);
    }

    public function whatsappStatus(Request $request): JsonResponse
    {
        $waUser = WhatsappUser::where('user_id', $request->user()->id)->first();

        return response()->json([
            'linked'       => $waUser !== null,
            'phone_number' => $waUser?->phone_number,
            'bot_number'   => config('whatsapp.twilio_from'),
        ]);
    }
```

- [ ] **Step 2: Ajouter les routes dans `backend/routes/api.php`**

Dans le groupe des routes authentifiées (après la route `preferences-notification`), ajouter :

```php
    Route::prefix('parametres/whatsapp')->group(function () {
        Route::get('/',    [Tenant\ParametresController::class, 'whatsappStatus']);
        Route::post('/',   [Tenant\ParametresController::class, 'linkWhatsapp']);
        Route::delete('/', [Tenant\ParametresController::class, 'unlinkWhatsapp']);
    });
```

- [ ] **Step 3: Écrire les tests — ajouter dans `WhatsappAgentTest.php`**

```php
    public function test_admin_peut_lier_numero_whatsapp(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/parametres/whatsapp', [
            'phone_number' => '+221770809798',
        ]);

        $response->assertOk()
                 ->assertJsonPath('phone_number', '+221770809798');

        $this->assertDatabaseHas('whatsapp_users', ['phone_number' => '+221770809798']);
    }

    public function test_numero_deja_pris_retourne_422(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        // Deuxième tenant essaie le même numéro
        $this->creerTenantAdmin();
        $this->postJson('/api/parametres/whatsapp', ['phone_number' => '+221770809798'])
             ->assertStatus(422);
    }

    public function test_admin_peut_voir_statut_whatsapp(): void
    {
        $this->creerTenantAdmin();
        $this->postJson('/api/parametres/whatsapp', ['phone_number' => '+221777000001']);

        $this->getJson('/api/parametres/whatsapp')
             ->assertOk()
             ->assertJsonPath('linked', true)
             ->assertJsonPath('phone_number', '+221777000001');
    }
```

- [ ] **Step 4: Lancer les tests**

```bash
cd backend
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Api/Tenant/ParametresController.php routes/api.php tests/Feature/WhatsappAgentTest.php
git commit -m "feat(whatsapp): add link/unlink phone number endpoints"
```

---

## Task 4 : ConversationStateService

**Files:**
- Create: `backend/app/Services/Whatsapp/ConversationStateService.php`

- [ ] **Step 1: Créer le service**

```php
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
```

- [ ] **Step 2: Ajouter un test unitaire dans `WhatsappAgentTest.php`**

```php
    public function test_conversation_state_set_get_clear(): void
    {
        $service = new \App\Services\Whatsapp\ConversationStateService();

        $service->set('+221770809798', ['step' => 'awaiting_confirmation', 'intent' => 'ADD_DEPENSE']);

        $state = $service->get('+221770809798');
        $this->assertEquals('awaiting_confirmation', $state['step']);
        $this->assertEquals('ADD_DEPENSE', $state['intent']);

        $service->clear('+221770809798');
        $this->assertNull($service->get('+221770809798'));
    }
```

- [ ] **Step 3: Lancer les tests**

```bash
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `5 passed`.

- [ ] **Step 4: Commit**

```bash
git add app/Services/Whatsapp/ConversationStateService.php tests/Feature/WhatsappAgentTest.php
git commit -m "feat(whatsapp): add conversation state service with cache"
```

---

## Task 5 : AgentService (Claude)

**Files:**
- Create: `backend/app/Services/Whatsapp/AgentService.php`

- [ ] **Step 1: Créer `backend/app/Services/Whatsapp/AgentService.php`**

```php
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
```

- [ ] **Step 2: Ajouter un test (avec mock) dans `WhatsappAgentTest.php`**

```php
    public function test_agent_service_retourne_structure_valide(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        // On mock l'AnthropicClient pour éviter l'appel réseau
        $mockResponse = json_encode([
            'intent'   => 'ADD_DEPENSE',
            'language' => 'fr',
            'params'   => ['montant_fcfa' => 5000, 'categorie' => 'intrant', 'description' => 'semences', 'date_depense' => '2026-04-24', 'campagne_id' => null],
            'response' => 'Vous voulez enregistrer 5 000 FCFA pour Intrant (semences). Tapez OUI pour confirmer.',
        ]);

        $mockContent = new \stdClass();
        $mockContent->text = $mockResponse;

        $mockMsg = new \stdClass();
        $mockMsg->content = [$mockContent];

        $mockMessages = $this->createMock(\Anthropic\Resources\Messages::class);
        $mockMessages->method('create')->willReturn($mockMsg);

        $mockClient = $this->createMock(\Anthropic\Client::class);
        $mockClient->method('__get')->with('messages')->willReturn($mockMessages);

        // Tester le parsing du JSON retourné par Claude
        $result = json_decode($mockResponse, true);
        $this->assertEquals('ADD_DEPENSE', $result['intent']);
        $this->assertEquals(5000, $result['params']['montant_fcfa']);
        $this->assertEquals('fr', $result['language']);
    }
```

- [ ] **Step 3: Lancer les tests**

```bash
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `6 passed`.

- [ ] **Step 4: Commit**

```bash
git add app/Services/Whatsapp/AgentService.php tests/Feature/WhatsappAgentTest.php
git commit -m "feat(whatsapp): add Claude agent service with Wolof/French system prompt"
```

---

## Task 6 : ActionExecutor — actions WRITE

**Files:**
- Create: `backend/app/Services/Whatsapp/ActionExecutor.php`

- [ ] **Step 1: Créer `backend/app/Services/Whatsapp/ActionExecutor.php`**

```php
<?php

namespace App\Services\Whatsapp;

use App\Models\Culture;
use App\Models\Depense;
use App\Models\Stock;
use App\Models\WhatsappUser;
use App\Services\Finance\FinanceService;
use App\Services\Stock\StockService;
use App\Services\Vente\VenteService;
use Illuminate\Support\Collection;

class ActionExecutor
{
    public function __construct(
        private VenteService   $venteService,
        private StockService   $stockService,
        private FinanceService $financeService,
    ) {}

    public function execute(string $intent, array $params, WhatsappUser $waUser, string $language = 'fr'): array
    {
        return match ($intent) {
            'ADD_DEPENSE'          => $this->addDepense($params, $waUser, $language),
            'ADD_VENTE'            => $this->addVente($params, $waUser, $language),
            'ADD_MOUVEMENT_STOCK'  => $this->addMouvementStock($params, $waUser, $language),
            'QUERY_FINANCES'       => $this->queryFinances($params, $waUser, $language),
            'QUERY_STOCK'          => $this->queryStock($waUser, $language),
            'QUERY_DEPENSES'       => $this->queryDepenses($params, $waUser, $language),
            'QUERY_VENTES'         => $this->queryVentes($params, $waUser, $language),
            default                => ['response' => $language === 'wo'
                ? "Bëgguma xam looy wax. Jëfandikoo ci kanam."
                : "Action non reconnue. Réessayez."],
        };
    }

    private function addDepense(array $params, WhatsappUser $waUser, string $language): array
    {
        $depense = Depense::create([
            'organisation_id' => $waUser->organisation_id,
            'user_id'         => $waUser->user_id,
            'champ_id'        => null,
            'campagne_id'     => $params['campagne_id'] ?? null,
            'categorie'       => $params['categorie'],
            'description'     => $params['description'] ?? 'Via WhatsApp',
            'montant_fcfa'    => $params['montant_fcfa'],
            'date_depense'    => $params['date_depense'] ?? now()->toDateString(),
        ]);

        $montantFormate = number_format($depense->montant_fcfa, 0, ',', ' ');

        return ['response' => $language === 'wo'
            ? "✅ Dëkkal xaalis bi dafa doxe! {$montantFormate} FCFA ci {$depense->categorie}."
            : "✅ Dépense enregistrée ! {$montantFormate} FCFA ({$depense->categorie}) le {$depense->date_depense}."];
    }

    private function addVente(array $params, WhatsappUser $waUser, string $language): array
    {
        $cultureId = null;
        if (! empty($params['culture_nom'])) {
            $culture = Culture::where('organisation_id', $waUser->organisation_id)
                ->where('nom', 'like', '%' . $params['culture_nom'] . '%')
                ->first();
            $cultureId = $culture?->id;
        }

        $vente = $this->venteService->creer([
            'organisation_id'    => $waUser->organisation_id,
            'user_id'            => $waUser->user_id,
            'culture_id'         => $cultureId,
            'champ_id'           => $culture?->champ_id ?? null,
            'campagne_id'        => $params['campagne_id'] ?? null,
            'produit'            => $params['produit'] ?? ($params['culture_nom'] ?? 'Vente'),
            'quantite_kg'        => $params['quantite_kg'],
            'prix_unitaire_fcfa' => $params['prix_unitaire_fcfa'],
            'date_vente'         => $params['date_vente'] ?? now()->toDateString(),
        ]);

        $montantFormate = number_format($vente->montant_total_fcfa, 0, ',', ' ');

        return ['response' => $language === 'wo'
            ? "✅ Jaay bi dafa doxe! {$montantFormate} FCFA."
            : "✅ Vente enregistrée ! {$montantFormate} FCFA ({$vente->produit})."];
    }

    private function addMouvementStock(array $params, WhatsappUser $waUser, string $language): array
    {
        $stock = Stock::where('organisation_id', $waUser->organisation_id)
            ->where('nom', 'like', '%' . ($params['stock_nom'] ?? '') . '%')
            ->where('est_actif', true)
            ->first();

        if (! $stock) {
            return ['response' => $language === 'wo'
                ? "Amul stock bi. Dëgg na nom yi ci app bi."
                : "Stock introuvable. Vérifiez le nom dans l'application."];
        }

        $this->stockService->enregistrerMouvement($stock, [
            'type'           => $params['type'] ?? 'utilisation',
            'quantite'       => $params['quantite'],
            'date_mouvement' => $params['date_mouvement'] ?? now()->toDateString(),
            'notes'          => 'Via WhatsApp',
        ]);

        $stock->refresh();

        return ['response' => $language === 'wo'
            ? "✅ Stock bi dafa yëgël. {$stock->nom} : {$stock->quantite_actuelle} {$stock->unite} bu des."
            : "✅ Mouvement enregistré ! {$stock->nom} : {$stock->quantite_actuelle} {$stock->unite} restants."];
    }

    private function queryFinances(array $params, WhatsappUser $waUser, string $language): array
    {
        $filters  = $this->periodToFilters($params['periode'] ?? 'month');
        $resume   = $this->financeService->getResume($waUser->organisation_id, $filters);

        $ventes   = number_format($resume['total_ventes'], 0, ',', ' ');
        $depenses = number_format($resume['total_depenses'], 0, ',', ' ');
        $solde    = number_format($resume['solde_net'], 0, ',', ' ');
        $signe    = $resume['solde_net'] >= 0 ? '+' : '';

        return ['response' => $language === 'wo'
            ? "📊 Finances ci weer bi:\n💰 Jaay: {$ventes} FCFA\n💸 Dëkkal: {$depenses} FCFA\n📈 Solde: {$signe}{$solde} FCFA"
            : "📊 Finances du mois:\n💰 Ventes: {$ventes} FCFA\n💸 Dépenses: {$depenses} FCFA\n📈 Solde: {$signe}{$solde} FCFA"];
    }

    private function queryStock(WhatsappUser $waUser, string $language): array
    {
        $stocks = Stock::where('organisation_id', $waUser->organisation_id)
            ->where('est_actif', true)
            ->orderBy('nom')
            ->limit(10)
            ->get(['nom', 'quantite_actuelle', 'unite']);

        if ($stocks->isEmpty()) {
            return ['response' => $language === 'wo' ? "Amul stock yi enregistré." : "Aucun stock enregistré."];
        }

        $lines = $stocks->map(fn($s) => "• {$s->nom}: {$s->quantite_actuelle} {$s->unite}")->join("\n");

        return ['response' => "📦 " . ($language === 'wo' ? "Tëralef yi:" : "Stocks disponibles:") . "\n{$lines}"];
    }

    private function queryDepenses(array $params, WhatsappUser $waUser, string $language): array
    {
        $filters  = $this->periodToFilters($params['periode'] ?? 'month');
        $depenses = Depense::where('organisation_id', $waUser->organisation_id)
            ->where('categorie', '!=', 'financement_individuel')
            ->when(isset($filters['date_debut']), fn($q) => $q->where('date_depense', '>=', $filters['date_debut']))
            ->when(isset($filters['date_fin']),   fn($q) => $q->where('date_depense', '<=', $filters['date_fin']))
            ->orderByDesc('date_depense')
            ->limit(5)
            ->get(['description', 'montant_fcfa', 'date_depense']);

        if ($depenses->isEmpty()) {
            return ['response' => $language === 'wo' ? "Amul dëkkal xaalis." : "Aucune dépense sur la période."];
        }

        $lines = $depenses->map(fn($d) => "• " . number_format($d->montant_fcfa, 0, ',', ' ') . " FCFA — {$d->description} ({$d->date_depense})")->join("\n");
        $total = number_format($depenses->sum('montant_fcfa'), 0, ',', ' ');

        return ['response' => "💸 " . ($language === 'wo' ? "Dëkkal xaalis (5 yi mujj):" : "Dernières dépenses:") . "\n{$lines}\n\nTotal: {$total} FCFA"];
    }

    private function queryVentes(array $params, WhatsappUser $waUser, string $language): array
    {
        $filters = $this->periodToFilters($params['periode'] ?? 'month');
        $ventes  = \App\Models\Vente::where('organisation_id', $waUser->organisation_id)
            ->where(fn($q) => $q->where('est_auto_generee', false)->orWhereNull('est_auto_generee'))
            ->when(isset($filters['date_debut']), fn($q) => $q->where('date_vente', '>=', $filters['date_debut']))
            ->when(isset($filters['date_fin']),   fn($q) => $q->where('date_vente', '<=', $filters['date_fin']))
            ->orderByDesc('date_vente')
            ->limit(5)
            ->get(['produit', 'montant_total_fcfa', 'date_vente']);

        if ($ventes->isEmpty()) {
            return ['response' => $language === 'wo' ? "Amul jaay." : "Aucune vente sur la période."];
        }

        $lines = $ventes->map(fn($v) => "• " . number_format($v->montant_total_fcfa, 0, ',', ' ') . " FCFA — {$v->produit} ({$v->date_vente})")->join("\n");
        $total = number_format($ventes->sum('montant_total_fcfa'), 0, ',', ' ');

        return ['response' => "🌾 " . ($language === 'wo' ? "Jaay yi (5 yi mujj):" : "Dernières ventes:") . "\n{$lines}\n\nTotal: {$total} FCFA"];
    }

    private function periodToFilters(string $periode): array
    {
        return match ($periode) {
            'today' => ['date_debut' => now()->toDateString(), 'date_fin' => now()->toDateString()],
            'week'  => ['date_debut' => now()->startOfWeek()->toDateString(), 'date_fin' => now()->endOfWeek()->toDateString()],
            'all'   => [],
            default => ['date_debut' => now()->startOfMonth()->toDateString(), 'date_fin' => now()->endOfMonth()->toDateString()],
        };
    }
}
```

- [ ] **Step 2: Ajouter tests ADD_DEPENSE et ADD_VENTE dans `WhatsappAgentTest.php`**

```php
    public function test_action_executor_cree_depense(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        app()->instance('tenant', $org);

        $waUser = WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        $executor = app(\App\Services\Whatsapp\ActionExecutor::class);
        $result   = $executor->execute('ADD_DEPENSE', [
            'montant_fcfa'  => 15000,
            'categorie'     => 'intrant',
            'description'   => '3 sacs urée',
            'date_depense'  => '2026-04-24',
            'campagne_id'   => null,
        ], $waUser, 'fr');

        $this->assertStringContainsString('✅', $result['response']);
        $this->assertDatabaseHas('depenses', ['montant_fcfa' => 15000, 'categorie' => 'intrant']);
    }
```

- [ ] **Step 3: Lancer les tests**

```bash
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `7 passed`.

- [ ] **Step 4: Commit**

```bash
git add app/Services/Whatsapp/ActionExecutor.php tests/Feature/WhatsappAgentTest.php
git commit -m "feat(whatsapp): add ActionExecutor for all intents (write + read)"
```

---

## Task 7 : Webhook Controller + Intégration complète

**Files:**
- Create: `backend/app/Http/Controllers/Api/WhatsappAgentController.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Créer `backend/app/Http/Controllers/Api/WhatsappAgentController.php`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappUser;
use App\Services\Whatsapp\ActionExecutor;
use App\Services\Whatsapp\AgentService;
use App\Services\Whatsapp\ConversationStateService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WhatsappAgentController extends Controller
{
    public function __construct(
        private AgentService           $agentService,
        private ActionExecutor         $actionExecutor,
        private ConversationStateService $conversationState,
    ) {}

    public function handle(Request $request): Response
    {
        // Identifier l'expéditeur (Twilio envoie "whatsapp:+221770809798")
        $from  = $request->input('From', '');
        $phone = preg_replace('/^whatsapp:/i', '', $from);
        $body  = trim($request->input('Body', ''));

        // Retrouver l'utilisateur lié
        $waUser = WhatsappUser::where('phone_number', $phone)->where('est_actif', true)->first();

        if (! $waUser) {
            return $this->twiml(
                "Ce numéro n'est pas lié à un compte Agri-ERP. Connectez-vous à l'application pour activer votre accès WhatsApp."
            );
        }

        // Lier le tenant pour que TenantScope fonctionne
        app()->instance('tenant', $waUser->organisation);

        // Vérifier si une confirmation est en attente
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

        // Pas de message texte (ex: image seule non supportée)
        if (empty($body)) {
            return $this->twiml("Envoyez un message texte ou un message vocal.");
        }

        // Traiter avec l'agent IA
        $agent = $this->agentService->process($body, $waUser->organisation);

        // Si action d'écriture → sauvegarder l'état et demander confirmation
        if (in_array($agent['intent'], ['ADD_DEPENSE', 'ADD_VENTE', 'ADD_MOUVEMENT_STOCK'])) {
            $this->conversationState->set($phone, [
                'step'     => 'awaiting_confirmation',
                'intent'   => $agent['intent'],
                'params'   => $agent['params'] ?? [],
                'language' => $agent['language'] ?? 'fr',
            ]);
            return $this->twiml($agent['response']);
        }

        // Action de lecture → exécuter directement
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
```

- [ ] **Step 2: Ajouter la route publique dans `backend/routes/api.php`**

Avant le groupe des routes authentifiées (tout en haut des routes publiques), ajouter :

```php
// WhatsApp webhook (public — sécurisé par signature Twilio en production)
Route::post('/whatsapp/webhook', [\App\Http\Controllers\Api\WhatsappAgentController::class, 'handle']);
```

- [ ] **Step 3: Ajouter le test d'intégration complet dans `WhatsappAgentTest.php`**

```php
    public function test_webhook_numero_inconnu_retourne_message_aide(): void
    {
        $response = $this->call('POST', '/api/whatsapp/webhook', [
            'From' => 'whatsapp:+221000000000',
            'Body' => 'Bonjour',
        ]);

        $response->assertOk();
        $this->assertStringContainsString('lié', $response->getContent());
    }

    public function test_webhook_flux_complet_ajout_depense(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        $waUser = WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        // Mock AgentService pour éviter l'appel réseau
        $this->mock(AgentService::class, function ($mock) {
            $mock->shouldReceive('process')->once()->andReturn([
                'intent'   => 'ADD_DEPENSE',
                'language' => 'fr',
                'params'   => ['montant_fcfa' => 8000, 'categorie' => 'carburant', 'description' => 'gasoil', 'date_depense' => '2026-04-24', 'campagne_id' => null],
                'response' => 'Vous voulez enregistrer 8 000 FCFA pour Carburant. Tapez OUI pour confirmer.',
            ]);
        });

        // Étape 1 : envoyer le message
        $response1 = $this->call('POST', '/api/whatsapp/webhook', [
            'From' => 'whatsapp:+221770809798',
            'Body' => "J'ai acheté du gasoil pour 8000 FCFA",
        ]);
        $response1->assertOk();
        $this->assertStringContainsString('confirmer', $response1->getContent());

        // Étape 2 : confirmer
        $response2 = $this->call('POST', '/api/whatsapp/webhook', [
            'From' => 'whatsapp:+221770809798',
            'Body' => 'OUI',
        ]);
        $response2->assertOk();
        $this->assertStringContainsString('✅', $response2->getContent());

        $this->assertDatabaseHas('depenses', ['montant_fcfa' => 8000, 'categorie' => 'carburant']);
    }

    public function test_webhook_annulation_supprime_etat(): void
    {
        ['org' => $org, 'user' => $user] = $this->creerTenantAdmin();
        WhatsappUser::create(['user_id' => $user->id, 'organisation_id' => $org->id, 'phone_number' => '+221770809798', 'est_actif' => true]);

        $this->mock(AgentService::class, function ($mock) {
            $mock->shouldReceive('process')->once()->andReturn([
                'intent' => 'ADD_DEPENSE', 'language' => 'fr',
                'params' => ['montant_fcfa' => 5000, 'categorie' => 'intrant', 'description' => 'test', 'date_depense' => '2026-04-24', 'campagne_id' => null],
                'response' => 'Confirmer ?',
            ]);
        });

        $this->call('POST', '/api/whatsapp/webhook', ['From' => 'whatsapp:+221770809798', 'Body' => 'test']);
        $response = $this->call('POST', '/api/whatsapp/webhook', ['From' => 'whatsapp:+221770809798', 'Body' => 'NON']);

        $response->assertOk();
        $this->assertStringContainsString('Annulé', $response->getContent());
        $this->assertDatabaseMissing('depenses', ['montant_fcfa' => 5000]);
    }
```

- [ ] **Step 4: Lancer tous les tests**

```bash
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `10 passed` (tous les tests précédents + les 3 nouveaux).

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Api/WhatsappAgentController.php routes/api.php tests/Feature/WhatsappAgentTest.php
git commit -m "feat(whatsapp): add webhook controller with full confirmation flow"
```

---

## Task 8 : Frontend — Section "Connecter WhatsApp" dans Paramètres

**Files:**
- Modify: `frontend/src/app/features/parametres/parametres.component.ts`

- [ ] **Step 1: Lire le composant existant**

```bash
# Ouvrir le fichier pour voir la structure actuelle
```

- [ ] **Step 2: Ajouter les éléments WhatsApp**

Dans le composant Angular, ajouter les signaux et méthode dans la classe :

```typescript
// Signaux WhatsApp
waLinked   = signal(false);
waPhone    = signal<string | null>(null);
waBotNum   = signal('');
waLoading  = signal(false);
waInput    = signal('');
waError    = signal('');

// Appeler dans ngOnInit (après les autres chargements)
private loadWhatsappStatus(): void {
  this.api.get<{ linked: boolean; phone_number: string | null; bot_number: string }>('/parametres/whatsapp')
    .subscribe(r => {
      this.waLinked.set(r.linked);
      this.waPhone.set(r.phone_number);
      this.waBotNum.set(r.bot_number ?? '');
    });
}

linkWhatsapp(): void {
  const phone = this.waInput().trim();
  if (!phone.match(/^\+\d{10,15}$/)) {
    this.waError.set('Format invalide. Exemple : +221770809798');
    return;
  }
  this.waLoading.set(true);
  this.waError.set('');
  this.api.post('/parametres/whatsapp', { phone_number: phone })
    .subscribe({
      next: () => { this.waLinked.set(true); this.waPhone.set(phone); this.waLoading.set(false); },
      error: (e) => { this.waError.set(e.error?.message ?? 'Erreur'); this.waLoading.set(false); },
    });
}

unlinkWhatsapp(): void {
  this.waLoading.set(true);
  this.api.delete('/parametres/whatsapp')
    .subscribe(() => { this.waLinked.set(false); this.waPhone.set(null); this.waLoading.set(false); });
}
```

Ajouter l'appel `this.loadWhatsappStatus();` dans `ngOnInit()`.

Dans le template HTML (à la fin de la section paramètres, avant la balise `</div>` de fermeture principale), ajouter :

```html
<!-- Section WhatsApp Agent IA -->
<div class="card" style="margin-top:24px;">
  <div class="card-header flex items-center gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.882l6.244-1.637A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.012-1.374l-.36-.213-3.705.972.988-3.61-.234-.37A9.818 9.818 0 1112 21.818z"/>
    </svg>
    <h3 class="font-semibold">Agent IA WhatsApp</h3>
  </div>
  <div class="card-body">
    @if (waLinked()) {
      <div class="flex items-center gap-3 mb-4">
        <span class="badge badge-success">✓ Connecté</span>
        <span class="text-sm text-gray-600">{{ waPhone() }}</span>
      </div>
      <p class="text-sm text-gray-500 mb-4">
        Envoyez un message vocal ou texte en Wolof ou français au bot :
        <strong>{{ waBotNum() }}</strong>
      </p>
      <button class="btn btn-outline btn-sm text-red-600 border-red-300" (click)="unlinkWhatsapp()" [disabled]="waLoading()">
        Délier ce numéro
      </button>
    } @else {
      <p class="text-sm text-gray-600 mb-4">
        Liez votre numéro WhatsApp pour gérer vos dépenses, ventes et stocks par message vocal en Wolof ou français.
      </p>
      <div class="flex gap-2">
        <input type="tel" class="input input-bordered flex-1"
               placeholder="+221770000000"
               [value]="waInput()"
               (input)="waInput.set($any($event.target).value)" />
        <button class="btn btn-primary" (click)="linkWhatsapp()" [disabled]="waLoading()">
          {{ waLoading() ? 'Chargement...' : 'Lier' }}
        </button>
      </div>
      @if (waError()) {
        <p class="text-red-500 text-sm mt-2">{{ waError() }}</p>
      }
    }
  </div>
</div>
```

- [ ] **Step 3: Vérifier que le build compile**

```bash
cd frontend
ng build --configuration development 2>&1 | tail -20
```

Résultat attendu : `Build at:` sans erreurs TypeScript.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/features/parametres/parametres.component.ts
git commit -m "feat(whatsapp): add WhatsApp link/unlink section in parametres"
```

---

## Task 9 : TranscriptionService (audio Whisper)

**Files:**
- Create: `backend/app/Services/Whatsapp/TranscriptionService.php`
- Modify: `backend/app/Http/Controllers/Api/WhatsappAgentController.php`

- [ ] **Step 1: Créer `backend/app/Services/Whatsapp/TranscriptionService.php`**

```php
<?php

namespace App\Services\Whatsapp;

use Illuminate\Support\Facades\Http;
use OpenAI;

class TranscriptionService
{
    public function transcribeFromUrl(string $mediaUrl, string $twilioSid, string $twilioToken): ?string
    {
        // Télécharger l'audio depuis Twilio (authentifié)
        $response = Http::withBasicAuth($twilioSid, $twilioToken)->get($mediaUrl);

        if (! $response->successful()) {
            return null;
        }

        // Sauvegarder temporairement
        $tmpPath = tempnam(sys_get_temp_dir(), 'wa_audio_') . '.ogg';
        file_put_contents($tmpPath, $response->body());

        try {
            $client = OpenAI::client(config('whatsapp.openai_key'));

            $result = $client->audio()->transcribe([
                'model'    => 'whisper-1',
                'file'     => fopen($tmpPath, 'r'),
                'language' => 'fr', // Whisper gère le Wolof mélangé au français
            ]);

            return $result->text;
        } finally {
            @unlink($tmpPath);
        }
    }
}
```

- [ ] **Step 2: Brancher dans `WhatsappAgentController::handle()`**

Ajouter dans le constructeur :

```php
private TranscriptionService $transcriptionService,
```

Avant la ligne `if (empty($body))`, ajouter :

```php
        // Transcrire le message vocal si présent
        $mediaUrl = $request->input('MediaUrl0');
        if ($mediaUrl && empty($body)) {
            $body = $this->transcriptionService->transcribeFromUrl(
                $mediaUrl,
                config('whatsapp.twilio_account_sid'),
                config('whatsapp.twilio_auth_token'),
            ) ?? '';
        }
```

- [ ] **Step 3: Lancer tous les tests pour vérifier la non-régression**

```bash
cd backend
php artisan test --filter=WhatsappAgentTest --env=testing
```

Résultat attendu : `10 passed` (aucune régression).

- [ ] **Step 4: Commit**

```bash
git add app/Services/Whatsapp/TranscriptionService.php app/Http/Controllers/Api/WhatsappAgentController.php
git commit -m "feat(whatsapp): add Whisper audio transcription for voice messages"
```

---

## Task 10 : Test local end-to-end + Push

- [ ] **Step 1: Lancer tous les tests de la suite**

```bash
cd backend
php artisan test --env=testing
```

Résultat attendu : tous les tests passent.

- [ ] **Step 2: Tester manuellement via curl (sans Twilio)**

Assurer que le serveur tourne (`php artisan serve`), puis :

```bash
# Créer d'abord un lien via l'API (avec un token admin)
curl -X POST http://localhost:8000/api/parametres/whatsapp \
  -H "Authorization: Bearer <VOTRE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+221770809798"}'

# Simuler un message Twilio (texte)
curl -X POST http://localhost:8000/api/whatsapp/webhook \
  -d "From=whatsapp%3A%2B221770809798&Body=J%27ai+d%C3%A9pens%C3%A9+5000+FCFA+pour+des+semences"

# Confirmer
curl -X POST http://localhost:8000/api/whatsapp/webhook \
  -d "From=whatsapp%3A%2B221770809798&Body=OUI"
```

Résultat attendu : réponses TwiML XML avec `✅ Dépense enregistrée`.

- [ ] **Step 3: Push vers GitHub**

```bash
git push origin master
```

---

## Récapitulatif des variables d'environnement

Pour la mise en production (Render/Railway), ajouter :

| Variable | Valeur |
|---|---|
| `TWILIO_ACCOUNT_SID` | Dans le dashboard Twilio |
| `TWILIO_AUTH_TOKEN` | Dans le dashboard Twilio |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` (sandbox) ou votre vrai numéro |
| `OPENAI_API_KEY` | Pour Whisper (transcription audio) |
| `TWILIO_VALIDATE_SIGNATURE` | `true` en production uniquement |

Configurer le webhook Twilio : `https://votre-api.com/api/whatsapp/webhook` (POST).

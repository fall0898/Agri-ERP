# Sprint 2 — Paiements réels (Wave + Orange Money) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les bugs critiques dans le flux de paiement Wave/Orange Money et le rendre fonctionnel end-to-end.

**Architecture:** L'infrastructure existe déjà (drivers, webhooks, contrôleurs, frontend) mais contient des bugs de colonnes DB, d'enum, et de méthode HTTP qui empêchent tout paiement de fonctionner. Ce sprint corrige ces bugs et ajoute les tests.

**Tech Stack:** Laravel 12, Angular 18 Signals, Wave Checkout API, Orange Money WebPay API, PHPUnit feature tests.

---

## Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `backend/database/migrations/XXXX_fix_abonnements_historique.php` | Créer — rend `date_fin` nullable, ajoute `'confirme'` à l'enum statut |
| `backend/app/Http/Controllers/Api/Tenant/AbonnementController.php` | Modifier — corriger noms colonnes dans `initierPaiement()` et `verifierPaiement()` |
| `backend/app/Http/Controllers/Api/WebhookController.php` | Modifier — remplacer `$historique->plan` par `$historique->plan_nouveau` |
| `frontend/src/app/features/abonnement/abonnement.component.ts` | Modifier — polling utilise POST au lieu de GET |
| `backend/tests/Feature/PaiementTest.php` | Créer — tests du flux complet avec HTTP mocké |

---

## Task 1 : Corriger la migration (date_fin nullable + enum confirme)

**Files:**
- Create: `backend/database/migrations/2026_04_24_200000_fix_abonnements_historique_nullable_fin_confirme.php`

- [ ] **Step 1 : Créer la migration corrective**

```php
<?php
// backend/database/migrations/2026_04_24_200000_fix_abonnements_historique_nullable_fin_confirme.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rendre date_fin nullable
        Schema::table('abonnements_historique', function (Blueprint $table) {
            $table->date('date_fin')->nullable()->change();
            $table->date('date_debut')->nullable()->change();
        });

        // Étendre l'enum statut pour inclure 'confirme'
        // MySQL : modifier l'enum directement
        DB::statement("ALTER TABLE abonnements_historique MODIFY COLUMN statut ENUM('en_attente','paye','echoue','rembourse','confirme') NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        Schema::table('abonnements_historique', function (Blueprint $table) {
            $table->date('date_fin')->nullable(false)->change();
            $table->date('date_debut')->nullable(false)->change();
        });
        DB::statement("ALTER TABLE abonnements_historique MODIFY COLUMN statut ENUM('en_attente','paye','echoue','rembourse') NOT NULL");
    }
};
```

- [ ] **Step 2 : Lancer la migration**

```bash
cd backend
php artisan migrate
```

Attendu : `Migrating: 2026_04_24_200000_fix_abonnements_historique...` puis `Migrated`.

- [ ] **Step 3 : Mettre à jour le cast du modèle**

Dans `backend/app/Models/AbonnementHistorique.php`, ajouter `'confirme'` à la liste fillable (déjà OK) et vérifier que `statut` n'a pas de cast enum strict. Le modèle actuel est correct — aucun changement nécessaire.

- [ ] **Step 4 : Commit**

```bash
git add backend/database/migrations/2026_04_24_200000_fix_abonnements_historique_nullable_fin_confirme.php
git commit -m "fix(paiements): make date_fin nullable and add confirme to statut enum"
```

---

## Task 2 : Corriger AbonnementController — noms de colonnes

**Files:**
- Modify: `backend/app/Http/Controllers/Api/Tenant/AbonnementController.php`

Le bug : `initierPaiement()` utilise `'plan'` (colonne inexistante) au lieu de `'plan_nouveau'`, oublie `'plan_precedent'`, `'date_debut'`, `'date_fin'`. `verifierPaiement()` lit `$historique->plan` qui n'existe pas.

- [ ] **Step 1 : Corriger `initierPaiement()`**

Remplacer le bloc `\App\Models\AbonnementHistorique::create([...])` dans `initierPaiement()` par :

```php
$organisation = app('tenant');
$planActuel   = $organisation->plan ?? 'gratuit';

\App\Models\AbonnementHistorique::create([
    'organisation_id'     => $organisation->id,
    'plan_precedent'      => $planActuel,
    'plan_nouveau'        => $validated['plan'],
    'montant_fcfa'        => $montant,
    'processeur_paiement' => $validated['processeur'],
    'reference_paiement'  => $result['reference_id'],
    'statut'              => 'en_attente',
    'date_debut'          => now()->toDateString(),
    'date_fin'            => null,
]);
```

- [ ] **Step 2 : Corriger `verifierPaiement()` — utiliser `plan_nouveau`**

Dans `verifierPaiement()`, remplacer :
```php
$organisation->update([
    'plan'           => $historique->plan,
    'plan_expire_at' => now()->addDays(30),
]);
```
par :
```php
$organisation->update([
    'plan'           => $historique->plan_nouveau,
    'plan_expire_at' => now()->addDays(30),
    'plan_paye_at'   => now(),
]);

$historique->update([
    'statut'   => 'paye',
    'date_fin' => now()->addDays(30)->toDateString(),
]);
```

Et remplacer le check `if ($historique->statut === 'paye')` par `if (in_array($historique->statut, ['paye', 'confirme']))`.

- [ ] **Step 3 : Corriger `changerPlan()` — statut `confirme` → `paye` pour cohérence**

Dans `changerPlan()`, changer `'statut' => 'confirme'` en `'statut' => 'paye'` pour utiliser le statut canonique. Le frontend gère déjà les deux.

- [ ] **Step 4 : Commit**

```bash
git add backend/app/Http/Controllers/Api/Tenant/AbonnementController.php
git commit -m "fix(paiements): correct column names in initierPaiement and verifierPaiement"
```

---

## Task 3 : Corriger WebhookController — plan_nouveau

**Files:**
- Modify: `backend/app/Http/Controllers/Api/WebhookController.php`

- [ ] **Step 1 : Remplacer `$historique->plan` par `$historique->plan_nouveau`**

Dans `traiterWebhook()`, remplacer :
```php
$organisation->update([
    'plan'           => $historique->plan,
    'plan_expire_at' => now()->addYear(),
]);
```
par :
```php
$organisation->update([
    'plan'           => $historique->plan_nouveau,
    'plan_expire_at' => now()->addYear(),
    'plan_paye_at'   => now(),
]);

$historique->update([
    'statut'   => 'paye',
    'date_fin' => now()->addYear()->toDateString(),
]);
```

- [ ] **Step 2 : Commit**

```bash
git add backend/app/Http/Controllers/Api/WebhookController.php
git commit -m "fix(webhooks): use plan_nouveau instead of plan in webhook handler"
```

---

## Task 4 : Corriger le polling frontend (GET → POST)

**Files:**
- Modify: `frontend/src/app/features/abonnement/abonnement.component.ts`

Le bug : la méthode `demarrerPolling()` appelle `this.api.get(...)` mais la route `/api/abonnement/paiement/verifier` n'accepte que POST.

- [ ] **Step 1 : Trouver le polling dans le composant**

Chercher `demarrerPolling` dans le fichier. La méthode fait :
```ts
this.api.get<{ statut: string }>(`/api/abonnement/paiement/verifier?reference_id=${referenceId}`)
```

- [ ] **Step 2 : Remplacer GET par POST**

```ts
this.api.post<{ statut: string }>('/api/abonnement/paiement/verifier', { reference_id: referenceId })
```

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/app/features/abonnement/abonnement.component.ts
git commit -m "fix(abonnement): use POST instead of GET for payment verification polling"
```

---

## Task 5 : Tests du flux de paiement

**Files:**
- Create: `backend/tests/Feature/PaiementTest.php`

- [ ] **Step 1 : Écrire le fichier de test complet**

```php
<?php

namespace Tests\Feature;

use App\Models\AbonnementHistorique;
use App\Models\Organisation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\CreatesAuthenticatedTenant;
use Tests\TestCase;

class PaiementTest extends TestCase
{
    use RefreshDatabase, CreatesAuthenticatedTenant;

    public function test_initier_paiement_wave_cree_historique(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        Http::fake([
            'api.wave.com/*' => Http::response([
                'wave_launch_url' => 'https://wave.com/pay/abc123',
            ], 200),
        ]);

        $response = $this->postJson('/api/abonnement/paiement/initier', [
            'processeur' => 'wave',
            'plan'       => 'pro',
            'telephone'  => '+221770000000',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['payment_url', 'reference_id']);

        $this->assertDatabaseHas('abonnements_historique', [
            'organisation_id'     => $org->id,
            'plan_nouveau'        => 'pro',
            'processeur_paiement' => 'wave',
            'statut'              => 'en_attente',
        ]);
    }

    public function test_initier_paiement_echoue_si_api_wave_erreur(): void
    {
        $this->creerTenantAdmin();

        Http::fake([
            'api.wave.com/*' => Http::response(['error' => 'unauthorized'], 401),
        ]);

        $response = $this->postJson('/api/abonnement/paiement/initier', [
            'processeur' => 'wave',
            'plan'       => 'pro',
            'telephone'  => '+221770000000',
        ]);

        $response->assertStatus(503);
    }

    public function test_verifier_paiement_reussi_upgrade_plan(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        $historique = AbonnementHistorique::create([
            'organisation_id'     => $org->id,
            'plan_precedent'      => 'gratuit',
            'plan_nouveau'        => 'pro',
            'montant_fcfa'        => 10000,
            'processeur_paiement' => 'wave',
            'reference_paiement'  => 'AGRIERP-TEST123',
            'statut'              => 'en_attente',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => null,
        ]);

        Http::fake([
            'api.wave.com/*' => Http::response([
                'data' => [[
                    'payment_status'   => 'succeeded',
                    'amount'           => 10000,
                    'client_reference' => 'AGRIERP-TEST123',
                ]],
            ], 200),
        ]);

        $response = $this->postJson('/api/abonnement/paiement/verifier', [
            'reference_id' => 'AGRIERP-TEST123',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['statut' => 'reussi']);

        $org->refresh();
        $this->assertEquals('pro', $org->plan);
        $this->assertNotNull($org->plan_expire_at);

        $historique->refresh();
        $this->assertEquals('paye', $historique->statut);
    }

    public function test_verifier_paiement_idempotent(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();

        AbonnementHistorique::create([
            'organisation_id'     => $org->id,
            'plan_precedent'      => 'gratuit',
            'plan_nouveau'        => 'pro',
            'montant_fcfa'        => 10000,
            'processeur_paiement' => 'wave',
            'reference_paiement'  => 'AGRIERP-DEJA-PAYE',
            'statut'              => 'paye',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => now()->addDays(30)->toDateString(),
        ]);

        // Ne doit pas appeler Wave API
        Http::fake();

        $response = $this->postJson('/api/abonnement/paiement/verifier', [
            'reference_id' => 'AGRIERP-DEJA-PAYE',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['statut' => 'paye']);

        Http::assertNothingSent();
    }

    public function test_webhook_wave_confirme_paiement(): void
    {
        $org = Organisation::factory()->create(['plan' => 'gratuit']);

        AbonnementHistorique::create([
            'organisation_id'     => $org->id,
            'plan_precedent'      => 'gratuit',
            'plan_nouveau'        => 'pro',
            'montant_fcfa'        => 10000,
            'processeur_paiement' => 'wave',
            'reference_paiement'  => 'AGRIERP-WEBHOOK01',
            'statut'              => 'en_attente',
            'date_debut'          => now()->toDateString(),
            'date_fin'            => null,
        ]);

        $payload   = json_encode(['payment_status' => 'succeeded', 'client_reference' => 'AGRIERP-WEBHOOK01']);
        $secretKey = config('services.wave.secret_key', 'test-secret');
        $signature = hash_hmac('sha256', $payload, $secretKey);

        $response = $this->withHeaders(['X-Wave-Signature' => $signature])
                         ->postJson('/api/webhooks/wave', json_decode($payload, true));

        $response->assertStatus(200);

        $org->refresh();
        $this->assertEquals('pro', $org->plan);
    }

    public function test_webhook_wave_rejette_signature_invalide(): void
    {
        $response = $this->withHeaders(['X-Wave-Signature' => 'invalide'])
                         ->postJson('/api/webhooks/wave', ['payment_status' => 'succeeded']);

        $response->assertStatus(400);
    }

    public function test_changer_plan_gratuit(): void
    {
        $this->creerTenantAdmin();

        $response = $this->postJson('/api/abonnement/changer', ['plan' => 'gratuit']);

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Plan Gratuit activé. Valide 7 jours.']);
    }
}
```

- [ ] **Step 2 : Lancer les tests**

```bash
cd backend
php artisan test --filter=PaiementTest
```

Attendu : 7 tests passent. Si échec sur `test_webhook_wave_confirme_paiement`, c'est que `config('services.wave.secret_key')` est vide en test — ajouter dans `backend/.env.testing` :
```
WAVE_SECRET_KEY=test-secret
```

- [ ] **Step 3 : Commit**

```bash
git add backend/tests/Feature/PaiementTest.php
git commit -m "test(paiements): add payment flow feature tests with HTTP mocking"
```

---

## Task 6 : Push et variables d'environnement Render

- [ ] **Step 1 : Push**

```bash
git push origin master
```

- [ ] **Step 2 : Variables à ajouter sur Render**

Sur Render → Environment, ajouter (laisser vide pour l'instant si pas encore de compte Wave/Orange Money) :

```
WAVE_API_KEY=<clé Wave Business>
WAVE_SECRET_KEY=<secret Wave Business>
WAVE_API_URL=https://api.wave.com/v1

ORANGE_MONEY_API_KEY=<clé Orange Money Business>
ORANGE_MONEY_SECRET_KEY=<secret Orange Money Business>
ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-webpay/dev/v1
ORANGE_MONEY_MERCHANT_KEY=+221770809798
```

Pour obtenir les clés :
- **Wave** : [business.wave.com](https://business.wave.com) → Developer → API Keys
- **Orange Money** : [developer.orange.com](https://developer.orange.com) → Orange Money Business API → Sénégal

---

## Critère de succès

- `php artisan test --filter=PaiementTest` → 7 tests verts
- Un clic "Payer" redirige vers la vraie page Wave/Orange Money
- Après paiement, l'org passe au plan Pro automatiquement via webhook
- Pas de double-traitement possible (idempotence webhook)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Agri-ERP** — SaaS de gestion agricole pour l'Afrique francophone. Architecture multi-tenant (une organisation par client) avec Laravel 12 backend + Angular 18 frontend.

- Backend: `backend/` (Laravel 12, PHP 8.2, MySQL 8, port 8000)
- Frontend: `frontend/` (Angular 18, Tailwind CSS, port 4200)

**Demo accounts:**
- Super-Admin: `superadmin@agri-erp.com` / `password`
- Admin démo: `admin@kadiar-demo.com` / `password` (org: Exploitation Kadiar, plan: pro)
- Lecteur: `lecteur@kadiar-demo.com` / `password`

---

## Commands

### Backend (run from `backend/`)
```bash
# Start dev server (API on port 8000)
php artisan serve

# Run all tests
php artisan test

# Run a single test class
php artisan test --filter=ChampControllerTest

# Fresh migration with seeder
php artisan migrate:fresh --seed

# Clear all caches
php artisan config:clear && php artisan cache:clear && php artisan route:clear

# Start queue worker (for emails/events)
php artisan queue:listen --tries=1

# Laravel Pint (code style)
./vendor/bin/pint
```

### Frontend (run from `frontend/`)
```bash
# Dev server (proxies /api/* to localhost:8000)
ng serve

# Production build
ng build

# Dev build with watch
ng build --watch --configuration development

# Run tests (Karma/Jasmine)
ng test
```

### Full stack (from `backend/`)
```bash
# Start all services concurrently (server + queue + logs + vite)
composer dev
```

---

## Architecture

### Multi-tenancy

Every Eloquent model (except `Organisation`, `User`) has `TenantScope` as a global scope (`backend/app/Scopes/TenantScope.php`). It filters all queries by `organisation_id` from `app('tenant')`. The `ResolveTenant` middleware binds the authenticated user's `Organisation` to the container as `'tenant'`. Super-admins bypass this filter (`tenant === null`).

**Critical rule:** Never query tenant data without the `ResolveTenant` middleware being active. The tenant container binding is what prevents cross-tenant data leaks.

### API Response Patterns

Backend endpoints return inconsistently — match the pattern when consuming them in Angular:

| Endpoint | Response shape |
|---|---|
| `/api/ventes`, `/api/depenses` | `{ data: [...], total: number }` |
| `/api/champs`, `/api/cultures`, `/api/stocks`, `/api/employes`, `/api/taches`, `/api/salaires` | Direct array `[...]` |
| `/api/finance/resume` | Direct object `{ total_ventes, total_depenses, solde_net }` |
| `/api/finance/par-champ`, `/api/finance/par-culture` | Direct array `[...]` |
| `/api/cultures` (paginated via `CheckPlanLimit`) | May return `{ data: { data: [...] } }` |

**Frontend pattern for safe list loading:**
```ts
Array.isArray(res) ? res : res.data?.data ?? res.data ?? []
```

### Backend Route Structure (`backend/routes/api.php`)

- **Public:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/plans`, webhooks
- **Authenticated** (Sanctum + ResolveTenant + CheckAbonnement):
  - Tenant CRUD: `/api/champs`, `/api/cultures`, `/api/stocks`, `/api/depenses`, `/api/ventes`, `/api/employes`, `/api/taches`, `/api/salaires`, `/api/intrants`, `/api/campagnes`
  - Finance: `/api/finance/resume`, `/api/finance/par-champ`, `/api/finance/par-culture`, `/api/finance/export-excel`, `/api/finance/comparaison`, `/api/finance/rentabilite-culture/{id}` — note **singular** `finance` not `finances`. Comparaison and rentabilite-culture are plan-gated (`excel`).
  - Notifications: `/api/notifications`, `/api/notifications/non-lues/count`, `PATCH /api/notifications/{id}/lue`, `PATCH /api/notifications/toutes-lues`
  - Météo: `GET /api/meteo/{champId}` — plan-gated (`meteo`)
  - Utilisateurs tenant (admin-only): `/api/utilisateurs`
  - Paramètres: `GET/PUT /api/parametres`, `PUT /api/parametres/preferences-notification`
  - Abonnement: `/api/abonnement/historique`, `/api/abonnement/paiement/initier`, `/api/abonnement/paiement/verifier`, `/api/abonnement/changer`
  - Dashboard: `GET /api/dashboard` — unified endpoint returning all dashboard data at once (cached 2 min per tenant). Individual sub-routes also exist: `/api/dashboard/kpis`, `/api/dashboard/depenses-recentes`, `/api/dashboard/ventes-recentes`, `/api/dashboard/stocks-alertes`, `/api/dashboard/taches-en-cours`, `/api/dashboard/graphique-finance`, `/api/dashboard/graphique-depenses-categories`
  - Auth (authenticated): `PUT /api/auth/user` (update profile), `PUT /api/auth/password`, `POST /api/auth/password/forgot`, `POST /api/auth/password/reset`
  - Diagnostic IA: `POST /api/diagnostic/analyser` (image + description → maladie + traitement), `GET /api/diagnostic/historique`
  - Sub-resources: `GET /api/champs/{id}/cultures|depenses|ventes|finance|medias`, `GET /api/employes/{id}/taches|paiements|financements`, `GET /api/cultures/{id}/intrants|medias`, `GET /api/stocks/{id}/mouvements`
  - Intrant link removal: `DELETE /api/utilisations-intrants/{id}` (admin-only) — removes a `UtilisationIntrant` junction record
  - Financements individuels: `GET /api/financements` (liste globale), `POST /api/employes/{id}/financements` (créer + génère dépense auto), `POST /api/financements/{id}/rembourser` (rembourser + génère vente auto), `DELETE /api/financements/{id}` — admin-only
  - Admin-only (role `admin` or `super_admin`): all write operations (POST/PUT/DELETE) plus `PATCH /api/taches/{id}/statut` — lecteurs cannot toggle task status
  - Import CSV: `GET /api/import/template/{type}` (all authenticated users), `GET /api/import/status/{id}` (poll async import job), `POST /api/import/{type}` (admin-only + plan-gated `import`). Types: `champs`, `cultures`, `stocks`, `depenses`, `ventes`
  - Super-admin-only: `GET /api/admin/tenants`, `GET /api/admin/tenants/{id}`, `PATCH /api/admin/tenants/{id}/activer`, `GET /api/admin/stats`
  - Super-admin user management: `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/{id}`, `PATCH /api/admin/users/{id}/activer` (toggle `est_actif`), `DELETE /api/admin/users/{id}` — managed by `Admin\UserController`, bypasses tenant scope

### Middleware Chain (Authenticated Routes)

Full order: `Sanctum` → `CheckActiveUser` → `ResolveTenant` → `CheckAbonnement`

- **`CheckActiveUser`** — Returns 401 + revokes tokens if `user.est_actif = false` OR `organisation.est_active = false`. Runs before tenant binding.
- **`CheckAbonnement`** — Subscription enforcement:
  - `gratuit` plan: blocked immediately on expiry (`ESSAI_GRATUIT_EXPIRE`)
  - Paid plan expired < 7 days: full access (grace period)
  - Paid plan expired 7–30 days: read-only, writes return 403 (`ABONNEMENT_EXPIRE_LECTURE_SEULE`)
  - Paid plan expired > 30 days: org marked `est_suspendue=true`, all access blocked (`ABONNEMENT_EXPIRE_SUSPENDU`)
- **`CheckRole`** — Used per-route for admin-only endpoints (not in global chain)
- **`RateLimitByTenant`** — Exists but not applied globally; apply per-route if needed

### Plan Limits (Strategy Pattern)

`backend/app/Services/Abonnement/PlanStrategies/` — `PlanStrategyFactory::make($organisation)` returns the right strategy. The `CheckPlanLimit` middleware gates: `champ`, `user`, `culture`, `excel`, `import`, `meteo`. Plan limits checked at creation, not at read.

**Important:** `PlanStrategyFactory` calls `$organisation->getPlanEffectif()`, not `$organisation->plan` directly. A `gratuit` org in its trial period (`isEnPeriodeEssai()` = true) gets `PlanProStrategy` — so trial orgs have pro-level limits.

| Limit | gratuit | pro | entreprise |
|---|---|---|---|
| Champs | 1 | 2 | unlimited |
| Users | 1 | 2 | unlimited |
| Cultures | 1 | 3 | unlimited |
| Export Excel | ✗ | ✓ | ✓ |
| Import CSV | ✗ | ✓ | ✓ |
| Météo | ✗ | ✓ | ✓ |

`PlanStrategyInterface` also exposes `canSendSmsWhatsapp()`, `canCompareN1()`, `canViewRentabiliteCulture()`, `canAccessAccompagnement()` for future feature gates — not yet wired to routes.

### Key Backend Services

- `VenteService` — creates ventes, computes `montant_total_fcfa = quantite_kg × prix_unitaire_fcfa`
- `SalaireService::payerSalaire()` — paying a salary **automatically creates a `Depense`** (category `salaire`, `est_auto_generee=true`). Auto-generated dépenses cannot be edited or deleted via the dépenses endpoints.
- `FinanceService` — `getResume()` returns `{ total_ventes, total_depenses, solde_net }`. Fields `total_revenus` and `benefice_net` do not exist.
- `StockService` — stock movements use the Strategy Pattern: `AchatStrategy`, `UtilisationStrategy`, `PerteStrategy`, `AjustementStrategy`
- `RecuPdfService` — PDF receipt via DomPDF, route: `GET /api/ventes/{id}/recu-pdf`
- `RapportExcelService` — 3-sheet Excel export via Maatwebsite, route: `GET /api/finance/export-excel`
- `FinancementService` (`backend/app/Services/Financement/`) — `creer()` creates a `FinancementIndividuel` and auto-generates a `Depense` (category `financement_individuel`, `est_auto_generee=true`). `rembourser()` records a `RemboursementFinancement` and auto-generates a `Vente` (`est_auto_generee=true`, produit = "Remboursement financement individuel"). Auto-generated ventes cannot be edited or deleted.
- `DiagnosticController` — uses `anthropic-ai/sdk` directly (not via a service class) to call Claude with a system prompt specialized for West African plant diseases. Returns structured JSON: `maladie_detectee`, `niveau_confiance`, `symptomes[]`, `traitement_immediat[]`, `produits_senegal[]`, `prevention[]`. Stores results in `Diagnostic` model.
- Import Service (`backend/app/Services/Import/Importers/`) — CSV importers per type, semicolon-separated with UTF-8 BOM. CSV template columns defined as constants in `ImportController::TEMPLATES`.

**Additional models (all with `TenantScope` unless noted):**
- `AuditLog` — tracks create/update/delete actions (no `TenantScope`, no timestamps, has `organisation_id`)
- `SyncQueue` — offline sync queue for mobile clients (table: `sync_queue`)
- `UtilisationIntrant` — junction between `Culture` and `Intrant` catalogue entries
- `PaiementSalaire` — records of salary payments tied to `Employe`
- `Media` — file attachments for champs and cultures (image uploads via `intervention/image`)
- `FinancementIndividuel` — individual employee advance (table: `financements_individuels`). Statuts: `en_attente`, `rembourse`. Linked to auto-generated `Depense` via `depense_id`
- `RemboursementFinancement` — repayment record (table: `remboursements_financement`). Linked to auto-generated `Vente` via `vente_id`

### Angular Frontend Structure

```
frontend/src/app/
├── app.config.ts          # Application config (router, HttpClient, service worker)
├── app.routes.ts          # All routes (lazy-loaded components)
├── core/
│   ├── models/index.ts    # All TypeScript interfaces (single source of truth)
│   ├── services/
│   │   ├── api.service.ts           # Thin HTTP wrapper (get/post/put/patch/delete/getBlob)
│   │   ├── auth.service.ts          # Signals-based session: user(), token(), isAdmin(), isSuperAdmin(), organisation()
│   │   └── notification.service.ts  # Polls unread count, exposes badge signal
│   ├── interceptors/
│   │   ├── token.interceptor.ts  # Adds Bearer token + Accept: application/json to /api/* requests
│   │   └── error.interceptor.ts  # Global HTTP error handling
│   ├── guards/
│   │   ├── auth.guard.ts         # Redirects to /connexion if not authenticated
│   │   └── admin.guard.ts        # Restricts to admin/super_admin roles
│   └── pipes/
│       ├── currency-fcfa.pipe.ts # Formats numbers as "15 000 FCFA"
│       └── date-fr.pipe.ts       # Formats ISO dates as French locale
├── features/              # One standalone component per feature
│   ├── hub/               # Post-login entry page at /accueil (no sidebar), routes to app or admin
│   ├── dashboard/         # Charts via ng2-charts (ChartOptions<'doughnut'> type needed for cutout)
│   ├── champs/            # Field: superficie_ha (not superficie)
│   ├── cultures/          # Fields: superficie_cultivee_ha, saison (normale|contre_saison), annee, statut (en_cours|recolte|termine|abandonne)
│   ├── stocks/            # Direct stock model: nom, categorie, quantite_actuelle, unite, seuil_alerte
│   ├── depenses/          # Field: montant_fcfa, categorie (enum string, static list)
│   ├── ventes/            # Fields: quantite_kg, prix_unitaire_fcfa, montant_total_fcfa
│   ├── employes/          # 3-tab UI: Employés / Salaires / Financements. Field: salaire_mensuel_fcfa
│   ├── salaires/          # Separate salary payment UI (distinct from employes/)
│   ├── taches/            # Statut toggle via PATCH /api/taches/{id}/statut (admin-only)
│   ├── finances/          # Period filter → date_debut/date_fin params. API prefix is /api/finance/ (singular)
│   ├── diagnostic/        # AI phytosanitary diagnosis — image upload + symptom text → Claude analysis
│   ├── import/            # CSV import wizard (plan-gated). Route: /import
│   ├── notifications/     # Notification list with mark-as-read
│   ├── utilisateurs/      # Tenant user management (admin-only)
│   ├── parametres/        # Org settings + notification preferences
│   ├── rapports/          # Redirects to /finances (no standalone view)
│   ├── onboarding/        # First-run onboarding flow
│   ├── landing/           # Public landing page
│   ├── abonnement/        # Orange Money + Wave payment flow (2-step modal)
│   ├── admin/             # Super-admin: tenant list, stats, activate/deactivate
│   └── calendrier/        # Agricultural calendar view
├── shared/
│   ├── components/            # Reusable UI components shared across features
│   └── media-gallery/         # media-gallery.component.ts — displays champ/culture photo galleries
└── layouts/
    ├── auth-layout.component.ts   # Sidebar + topbar shell for authenticated pages
    ├── public-layout.component.ts # Landing/auth pages
    └── components/
        ├── sidebar.component.ts   # navItems array — add new routes here
        └── topbar.component.ts
```

### Angular Patterns

All components are **standalone** with Angular Signals (`signal()`, `computed()`). No NgModules, no NgRx. Reactive Forms are used for all forms (not `ngModel` — FormsModule is not imported in most components).

**Auth state:**
```ts
auth = inject(AuthService);
auth.isAdmin()        // computed signal: role admin or super_admin
auth.isSuperAdmin()   // computed signal: role super_admin only  
auth.organisation()   // computed signal: current org object
```

**Form field names must exactly match backend `$request->validate()` rules.** Mismatches silently return 422 "données invalides". Always verify against the controller before creating a form.

**Dépense categories** — no `/api/categories-depenses` endpoint exists. Use this static list:
```ts
['intrant','salaire','materiel','carburant','main_oeuvre','traitement_phytosanitaire',
 'transport','irrigation','entretien_materiel','alimentation_betail','frais_recolte',
 'financement_individuel','autre']
```
`financement_individuel` is reserved for auto-generated dépenses from `FinancementService` — do not let users create dépenses with this category manually.

### CORS & Proxy

Angular dev server proxies `/api/*` to `http://localhost:8000`. Backend CORS allows `http://localhost:4200`. No proxy config needed in `angular.json` — it's handled by the backend CORS config.

### Frontend → Backend alignment notes

- `/api/cultures` response wraps pagination inside `res.data?.data` when `CheckPlanLimit` is active — handle both cases
- `PATCH /api/taches/{id}/statut` is the correct URL for status toggle (not `PATCH /api/taches/{id}`)
- `POST /api/stocks/{id}/mouvements` — mouvements are per-stock, not a global endpoint
- Mouvement fields: `type` (not `type_mouvement`), `date_mouvement` required
- Finance endpoint prefix is `/api/finance/` (singular) — not `/api/finances/`
- `GET /api/stocks/alertes` — dedicated endpoint for stocks below `seuil_alerte` (not a filtered `/api/stocks` call)
- Campagnes: a `CampagneAgricole` model exists with `PATCH /api/campagnes/{id}/courante` to set the active season
- Culture medias: `POST /api/cultures/{id}/medias`, `DELETE /api/medias/{id}`
- Champ medias: `POST /api/champs/{id}/medias` (admin-only)
- Vente sale auto-links to champ: when a culture is selected, look up `culture.champ_id` and auto-fill `champ_id`
- `Vente` has `est_auto_generee`, `source_type`, `source_id` — auto-generated ventes (salary repayments) return 403 on edit/delete
- `Depense` already had `est_auto_generee`, `source_type`, `source_id` — same protection applies
- CSV import delimiter is semicolon (`;`), files include UTF-8 BOM — match this when generating test CSVs
- `RateLimitByTenant` middleware exists but is not applied globally — apply per-route if needed

---

## Testing

Feature tests use the `CreatesAuthenticatedTenant` trait (`tests/CreatesAuthenticatedTenant.php`):

```php
use Tests\CreatesAuthenticatedTenant;

class MyTest extends TestCase
{
    use CreatesAuthenticatedTenant;

    public function test_something(): void
    {
        ['org' => $org] = $this->creerTenantAdmin();  // admin role
        // or:
        ['org' => $org] = $this->creerTenantLecteur(); // lecteur role
        
        $this->postJson('/api/champs', [...])
             ->assertStatus(201);
    }
}
```

Both helpers: create an `Organisation` factory, create a `User` factory bound to it, call `Sanctum::actingAs()`, and bind the org as `app('tenant')`. The tenant binding is required — without it, `TenantScope` will fail on all queries.

---

## Development Setup

1. XAMPP with MySQL running on default port 3306
2. Database: `kadiaragro` (utf8mb4) — Note: database name retains "kadiaragro" prefix for backward compatibility
3. Backend `.env`: `DB_DATABASE=kadiaragro`, `APP_URL=http://localhost:8000`, `FRONTEND_URL=http://localhost:4200`, `ANTHROPIC_API_KEY=<key>` (required for AI diagnostic), `WAVE_API_KEY` + `WAVE_SECRET_KEY` + `ORANGE_MONEY_API_KEY` + `ORANGE_MONEY_SECRET_KEY` + `ORANGE_MONEY_MERCHANT_KEY` (required for payment flows)
4. Run `php artisan migrate --seed` to seed demo data
5. Run `ng serve` from `frontend/` — proxies API calls automatically

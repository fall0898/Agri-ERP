# KadiarAgro — Plan d'amélioration global

**Date :** 2026-04-11  
**Contexte :** Solo développeur, phase de développement, cible tous les profils (petits agriculteurs, coopératives, exploitations moyennes).  
**Approche retenue :** Phased Sprints (4 sprints indépendants, chacun déployable séparément).

---

## Analyse de l'existant

### Points forts
- Architecture multi-tenant propre (TenantScope, ResolveTenant middleware)
- Angular 18 Signals sans NgRx — léger et moderne
- Strategy Pattern pour les plans d'abonnement et les mouvements de stock
- Design system cohérent (Tailwind + composants custom dans `styles.css`)
- PWA déjà intégré (`@angular/pwa`, Service Worker)
- Diagnostic IA (Claude) fonctionnel
- Audit logs, SyncQueue, système de notifications

### Dette technique identifiée
| Problème | Impact | Priorité |
|---|---|---|
| Zéro tests (seulement `ExampleTest.php`) | Risque de régression en prod | Haute |
| Composants Angular énormes (dashboard 599 lignes, ventes 432, dépenses 317) | Maintenabilité | Moyenne |
| API responses incohérentes (array/objet/paginé selon endpoint) | Complexité frontend | Moyenne |
| Paiements factices (webhooks retournent `{ status: ok }`) | Impossible de monétiser | Critique |
| Imports CSV synchrones | Timeout sur gros fichiers | Haute |
| Aucune navigation mobile (sidebar cachée sur mobile) | Inutilisable sur téléphone | Critique |
| Dashboard : 7 appels API séparés | Performance perçue | Basse |
| SyncQueue backend sans logique offline frontend | Feature incomplète | Basse |

---

## Sprint 1 — Mobile-first (Frontend uniquement)

### Objectif
Rendre KadiarAgro pleinement utilisable sur smartphone. Le marché africain est à 85%+ mobile.

### Décisions de design validées
- **Navigation mobile :** Barre d'onglets fixe en bas, 4 onglets : Accueil / Cultures / Finances / Plus
- **Listes de données :** Cartes empilées (toutes les infos visibles d'un coup, boutons modifier/supprimer sur chaque carte)
- **Dashboard mobile :** KPIs en grille 2×2 + mini graphique barres + alertes stocks (chargement lazy pour graphique et alertes)

### Changements techniques

**`auth-layout.component.ts`**
- Ajouter une bottom navbar (`lg:hidden`) avec les 4 onglets
- Le sidebar desktop reste intact (`hidden lg:flex`)
- La topbar mobile affiche uniquement : logo + badge notifications

**Composants de liste** (`ventes`, `dépenses`, `stocks`, `champs`, `cultures`, `employes`, `taches`, `intrants`)
- Tableau HTML conservé pour desktop (`hidden md:table` ou `md:block`)
- Rendu cartes ajouté pour mobile (`md:hidden`) — même données, même actions
- Bouton "Ajouter" toujours visible en haut à droite sur les deux vues

**Dashboard** (`dashboard.component.ts`)
- Sur mobile : KPIs 2×2 en premier, graphique finance en lazy (IntersectionObserver), alertes stocks en lazy
- Réduire de 7 à 4 appels API : fusionner `stocksAlertes` dans `kpis`, lazy pour `graphiqueFinance` et `graphiqueDepensesCategories`
- Le graphique doughnut existant reste, le graphique barres finance reste — juste chargés après le fold

**Aucune modification backend** — purement CSS/Angular.

### Critère de succès
L'intégralité des fonctionnalités est accessible et utilisable sur un écran 375px de large (iPhone SE).

---

## Sprint 2 — Paiements réels (Orange Money + Wave)

### Objectif
Connecter vraiment les providers de paiement africains pour permettre la monétisation.

### Architecture — PaymentService

Nouveau service `backend/app/Services/Payment/` avec :
- `PaymentDriverInterface` — méthodes : `initier(montant, telephone, description): PaymentSession`, `verifier(referenceId): PaymentStatus`
- `OrangeMoneyDriver implements PaymentDriverInterface`
- `WaveDriver implements PaymentDriverInterface`
- `PaymentService` — injecte le bon driver selon le provider choisi

### Flux de paiement complet

1. **Frontend** → `POST /api/abonnement/paiement/initier` avec `{ provider: 'wave'|'orange_money', plan, telephone }`
2. **Backend** → appelle l'API du provider, crée un enregistrement `AbonnementHistorique` avec `statut: 'en_attente'`, retourne `{ payment_url, reference_id }`
3. **Frontend** → redirige vers `payment_url` via `window.location.href` (page hosted du provider). Pas de modal — les providers bloquent les iframes pour des raisons de sécurité.
4. **Provider** → appelle le webhook `POST /api/webhooks/wave` ou `/api/webhooks/orange-money`
5. **Backend webhook** → valide signature HMAC du provider, met à jour `AbonnementHistorique.statut` à `'reussi'`, prolonge `organisation.plan_expire_at`
6. **Frontend** (retour depuis payment_url) → poll `GET /api/abonnement/paiement/verifier?reference_id=xxx` toutes les 3 secondes, max 60 secondes
7. Si confirmé → toast succès + `AuthService.refreshUser()` pour recharger le plan

### Sécurité webhooks
- Validation signature HMAC avec clé secrète en `.env` (`WAVE_SECRET_KEY`, `ORANGE_MONEY_SECRET_KEY`)
- Idempotence : vérifier que la référence n'a pas déjà été traitée avant de modifier le plan
- Log de tous les webhooks reçus dans `AuditLog`

### Variables d'environnement à ajouter
```
WAVE_API_KEY=
WAVE_SECRET_KEY=
WAVE_API_URL=https://api.wave.com/v1

ORANGE_MONEY_API_KEY=
ORANGE_MONEY_SECRET_KEY=
ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-webpay/dev/v1
# Note : l'URL varie selon le pays (SN, CI, ML...) — consulter la doc Orange Money Business API
```

### Critère de succès
Un utilisateur peut passer du plan gratuit au plan pro en payant via Wave ou Orange Money, et son `plan_expire_at` est mis à jour automatiquement après le webhook.

---

## Sprint 3 — Tests + API Resources

### Objectif
Stabiliser l'API et protéger les fonctionnalités critiques contre les régressions.

### Tests PHPUnit — scope

Fichiers à créer dans `backend/tests/Feature/` :

| Fichier test | Ce qu'il couvre |
|---|---|
| `ChampControllerTest` | CRUD, isolation tenant, limite plan gratuit (max 1 champ) |
| `VenteControllerTest` | Création, calcul `montant_total_fcfa = qte × prix`, protection auto-générées (403) |
| `DepenseControllerTest` | CRUD, protection `est_auto_generee`, catégories valides |
| `FinanceControllerTest` | Résumé (total_ventes/total_depenses/solde_net), par-champ, par-culture, filtres date |
| `AbonnementControllerTest` | Changement de plan, expiration, période d'essai |
| `TenantIsolationTest` | Test transversal : chaque modèle retourne uniquement les données du tenant authentifié |
| `DiagnosticControllerTest` | Upload image + description → réponse structurée Claude (mock Anthropic en test) |

Objectif : **60+ assertions** sur les chemins critiques. Pas de coverage à 100%.

Factories à compléter : `ChampFactory`, `CultureFactory`, `VenteFactory`, `DepenseFactory`, `EmployeFactory`.

### API Resources Laravel

Créer `backend/app/Http/Resources/` :
- `ChampResource`, `CultureResource`, `VenteResource`, `DepenseResource`, `StockResource`, `EmployeResource`, `TacheResource`
- Tous les endpoints de liste retournent `{ data: [...] }` — supprime l'incohérence actuelle
- `VenteCollection` et `DepenseCollection` conservent `{ data: [...], total: number }` (déjà le bon format)
- Frontend : simplifier le pattern de chargement — `res.data ?? []` suffit partout

### Critère de succès
`php artisan test` passe avec 60+ tests verts. Aucun endpoint critique sans test.

---

## Sprint 4 — Performance + Refactoring

### Objectif
Optimiser les points de friction les plus visibles, et réduire la dette technique accumulée.

### Dashboard — endpoint unifié

Nouveau `GET /api/dashboard` qui retourne en une requête :
```json
{
  "kpis": { "total_ventes": ..., "total_depenses": ..., "solde_net": ..., "nb_champs": ..., "nb_cultures_actives": ..., "nb_employes": ..., "nb_alertes_stock": ... },
  "ventes_recentes": [...],
  "depenses_recentes": [...],
  "stocks_alertes": [...],
  "taches_en_cours": [...],
  "graphique_finance": [...],
  "graphique_depenses_categories": [...]
}
```
Cache 2 minutes par `organisation_id`. Les 7 endpoints séparés restent disponibles (rétrocompatibilité) mais le frontend utilise le nouvel endpoint unifié.

### Imports CSV — queued jobs

`POST /api/import/{type}` dispatche un `ImportJob` en queue :
- Retourne immédiatement `{ job_id, status: "en_cours" }` (HTTP 202)
- Nouveau endpoint `GET /api/import/{job_id}/status` → `{ status: "en_cours"|"termine"|"erreur", lignes_importees, erreurs[] }`
- Frontend : affiche une progress bar et poll toutes les 2 secondes jusqu'à completion
- Model `Import` déjà existant — ajouter les colonnes `job_id`, `lignes_importees`, `erreurs`

### Découpage composants Angular

`dashboard.component.ts` (599 lignes) → 4 fichiers :
- `dashboard.component.ts` — orchestrateur léger (~100 lignes)
- `dashboard-kpis.component.ts` — grille KPIs
- `dashboard-chart.component.ts` — graphiques Chart.js
- `dashboard-alerts.component.ts` — alertes stocks + tâches

Même découpage pour `ventes.component.ts` (432 lignes) → `ventes-list.component.ts` + `vente-form.component.ts`  
Et `depenses.component.ts` (317 lignes) → `depenses-list.component.ts` + `depense-form.component.ts`

### Diagnostic IA — cultures dynamiques

Dans `diagnostic.component.ts`, remplacer la liste hardcodée de 6 cultures par un appel `GET /api/cultures` filtré sur les cultures actives du tenant (`statut: 'en_cours'`). Fallback sur la liste statique si l'API échoue.

### SyncQueue — logique offline basique

Utiliser le Service Worker déjà installé (`@angular/pwa`) pour :
- Détecter le statut réseau via `navigator.onLine` + événements `online`/`offline`
- Quand offline : stocker les requêtes `POST /api/ventes` et `POST /api/depenses` dans IndexedDB (clé : timestamp + type)
- Afficher un badge "hors ligne — X opérations en attente" dans la topbar mobile
- Au retour en ligne : rejouer les requêtes stockées dans l'ordre, puis vider IndexedDB
- Le modèle `SyncQueue` backend (table `sync_queue`) reçoit les opérations rejouées — pas de changement backend nécessaire

### Critère de succès
Dashboard charge en **1 seul appel réseau** (au lieu de 7). Imports de 500+ lignes ne timeoutent plus. Aucun fichier composant ne dépasse 250 lignes.

---

## Ordre d'exécution recommandé

```
Sprint 1 (Mobile) → Sprint 2 (Paiements) → Sprint 3 (Tests) → Sprint 4 (Perf)
```

Chaque sprint peut être mis en production indépendamment. Sprint 1 et 2 sont les plus visibles pour les utilisateurs finaux. Sprint 3 protège Sprint 4 contre les régressions.

---

## Ce qui n'est PAS dans ce plan

- Internationalisation (i18n) — français uniquement, par conception
- Versioning d'API — pas nécessaire pour une app mono-frontend
- Migration vers Angular 19 — pas de breaking changes bloquants identifiés
- Refonte du design system — l'existant est cohérent et fonctionnel

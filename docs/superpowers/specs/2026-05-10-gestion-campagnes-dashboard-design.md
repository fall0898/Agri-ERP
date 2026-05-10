# Spec — Gestion des campagnes agricoles & Dashboard par saison

**Date :** 2026-05-10
**Statut :** Approuvé

---

## Contexte

L'application gère plusieurs saisons agricoles via le modèle `CampagneAgricole`. Les colonnes `campagne_id` existent sur `Depense`, `Vente`, `Culture` mais ne sont pas encore exploitées comme filtre global. Le dashboard et toutes les pages listent actuellement toutes les données confondues, sans distinction de campagne.

L'utilisateur veut pouvoir clôturer une saison terminée, démarrer une nouvelle, et retrouver sur chaque page uniquement les données de la campagne sélectionnée.

---

## Décisions de design

| Sujet | Décision |
|---|---|
| Vue par défaut | Campagne courante (`est_courante = true`) |
| Navigation entre campagnes | Sélecteur dans le topbar — global, s'applique à tout le site |
| Clôture | Simple toggle : marquer l'ancienne `est_courante = false`, activer la nouvelle |
| Portée du filtre | Toutes les pages (dépenses, ventes, cultures, tâches, stocks, dashboard, finances) |
| Gestion (créer/clôturer) | Nouvel onglet "Campagnes" dans /paramètres |

---

## Architecture Frontend

### `CampagneService` (nouveau — `core/services/campagne.service.ts`)

Seule source de vérité pour la campagne sélectionnée dans l'application.

```ts
campagnes      = signal<CampagneAgricole[]>([])
campagneActive = signal<CampagneAgricole | null>(null)
estFiltre      = computed(() => campagneActive() !== null)

// Méthodes publiques
charger(): void           // GET /api/campagnes → init campagneActive avec est_courante=true
basculer(c): void         // change campagneActive + persiste localStorage 'agri_campagne_id'
reinitialiser(): void     // campagneActive = null (mode "toutes campagnes")
```

Au login (`AuthService.loadUser()`), `CampagneService.charger()` est appelé. L'ID persisté en localStorage est restauré s'il correspond à une campagne existante ; sinon la campagne courante est utilisée.

### Topbar (`layouts/components/topbar.component.ts`)

- Inject `CampagneService`
- Afficher une **pill** au centre du topbar : `● Saison 2024/2025 ▼`
  - Fond sombre (`#2d3f52`), pastille verte si campagne active, grise si campagne passée
- Au clic : ouvrir un dropdown avec :
  - Campagne active en premier (cochée, fond vert pâle)
  - Campagnes passées triées par `date_debut DESC`
  - Lien "Gérer les campagnes dans Paramètres →"
- La sélection appelle `campagneService.basculer(campagne)`

### Indicateur de filtre sur les pages

Chaque page filtrée affiche un badge sous son titre quand `campagneService.estFiltre()` est `true` :

```html
<!-- Badge jaune ambre, avec ✕ pour reinitialiser() -->
Filtré sur <strong>Saison 2024/2025</strong>  ✕
```

### Lecture du filtre dans les pages

Chaque composant page injecte `CampagneService` et construit ses paramètres de requête :

```ts
private get queryParams() {
  const c = this.campagneService.campagneActive();
  return c ? { campagne_id: c.id } : {};
}
// Puis : this.api.get('/api/depenses', this.queryParams)
```

Pages filtrées par campagne : `dashboard`, `depenses`, `ventes`, `cultures`, `finances`.
Pages **non filtrées** (pas de `campagne_id` en base) : `taches`, `stocks`, `salaires`, `employes` — affichent toujours toutes les données.

---

## Architecture Backend

### Filtres à ajouter

Chaque contrôleur suivant reçoit un `campagne_id` optionnel en query param et filtre si présent :

```php
$campagneId = $request->query('campagne_id');
// Ajouter à chaque index() :
->when($campagneId, fn($q) => $q->where('campagne_id', $campagneId))
```

| Contrôleur | Colonne |
|---|---|
| `DepenseController::index` | `campagne_id` |
| `VenteController::index` | `campagne_id` |
| `CultureController::index` | `campagne_id` |
| ~~`TacheController`~~ | pas de `campagne_id` — non filtré |
| ~~`StockController`~~ | pas de `campagne_id` — non filtré |
| `DashboardController::tout` | passer `campagne_id` aux appels `FinanceService` et sous-requêtes |

`FinanceService::getResume()` accepte déjà `filters['campagne_id']` — brancher depuis le dashboard.

### `CampagneController` — ajouts

```php
// Clôturer la campagne active (déjà partiellement couvert par setCourante)
// Aucun endpoint supplémentaire nécessaire — le flux est :
// 1. POST /api/campagnes  (créer la nouvelle)
// 2. PATCH /api/campagnes/{new_id}/courante  (la rendre courante, désactive l'ancienne)
```

---

## Interface Paramètres — Onglet "Campagnes"

Nouvel onglet dans `parametres.component.ts` (après "Notifications", avant "WhatsApp").

### Contenu de l'onglet

**Bloc "Campagne active"**
- Carte avec nom, dates, badge "En cours"
- Bouton "⏹ Clôturer" → confirmation simple → ouvre modal "Créer la nouvelle campagne"

**Carte "+ Créer une nouvelle campagne"**
- Modal avec champs : `nom` (requis), `date_debut` (requis), `date_fin` (requis)
- Submit → `POST /api/campagnes` puis `PATCH /api/campagnes/{id}/courante`
- Après succès : `CampagneService.charger()` pour recharger la liste + basculer sur la nouvelle

**Bloc "Historique des campagnes"**
- Liste des campagnes passées triées par date décroissante
- Chaque ligne : nom, dates, **solde net** (appel `GET /api/finance/resume?campagne_id=X`)
- Clic sur une ligne → `campagneService.basculer(c)` + navigation vers `/tableau-de-bord`

---

## Flux "Démarrer une nouvelle saison"

1. Admin va dans **Paramètres → Campagnes**
2. Clique **"Clôturer"** sur la campagne active → confirmation (dialog simple : "Êtes-vous sûr ?")
3. Modal s'ouvre : **Créer la nouvelle campagne** (nom + dates)
4. Submit : `POST /api/campagnes` → `PATCH /api/campagnes/{new_id}/courante`
5. `CampagneService` recharge → topbar affiche la nouvelle campagne
6. Toutes les pages basculen automatiquement sur la nouvelle saison (signal réactif)

---

## Ce qui ne change pas

- Les cultures, dépenses, ventes existantes **ne sont pas modifiées** — elles restent liées à leur `campagne_id` d'origine
- Le bouton "✕" sur le badge de filtre permet de revenir à une vue "toutes campagnes confondues"
- Les campagnes passées restent consultables via le sélecteur topbar

---

## Modèle de données (existant, aucune migration nécessaire)

```
campagnes_agricoles : id, organisation_id, nom, date_debut, date_fin, est_courante, notes
depenses            : ..., campagne_id (nullable FK)
ventes              : ..., campagne_id (nullable FK)
cultures            : ..., campagne_id (nullable FK)
```

Toutes les colonnes `campagne_id` existent déjà en base. Aucune migration requise.

---

## Hors scope

- Clôture automatique des cultures `en_cours` → à envisager dans une future itération
- Comparaison côte-à-côte de deux campagnes sur le dashboard → future itération
- Verrouillage des données d'une campagne clôturée (empêcher modification) → future itération

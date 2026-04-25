# Agent Maraîcher WhatsApp — Design Spec

## Objectif

Créer un agent IA accessible directement par les maraîchers sénégalais via WhatsApp, lié aux données de leur exploitation dans Agri-ERP. L'agent couvre deux fonctions principales : le calendrier cultural intelligent (stades phénologiques, fertilisation, irrigation, rotation, alertes ravageurs, suivi traitements) et le conseil phytosanitaire en wolof/français avec photo.

## Cible

Maraîchers (oignon, tomate, chou) enregistrés dans une organisation Agri-ERP, principalement dans les zones des Niayes, Vallée du fleuve Sénégal et Louga. Niveau d'alphabétisation variable — l'interface supporte texte, photo et messages vocaux.

---

## Architecture globale

```
Agriculteur (WhatsApp)
        ↕
Meta WhatsApp Business Cloud API
        ↕
Laravel Backend (Agri-ERP)
  ├── WhatsappController       ← reçoit/envoie messages (webhook + Graph API)
  ├── AgriAdvisorService       ← orchestration Claude avec contexte farm
  ├── CalendrierCulturalService ← stades phénologiques + niveaux 1-4, 6-7
  ├── MeteoService             ← Open-Meteo API (coordonnées par zone)
  ├── WhatsappService          ← appels Graph API Meta
  └── DiagnosticService        ← existant, étendu pour WhatsApp
        ↕
Laravel Scheduler (quotidien 7h00)
  └── EnvoyerAlertesProactivesJob
        ↕
Base de données Agri-ERP
  ├── users (+ champ telephone)
  ├── champs (+ champ zone_meteo)
  ├── cultures (existant — date_semis utilisé pour calcul stades)
  ├── whatsapp_sessions
  ├── alertes_culturales
  └── traitements_appliques
```

**APIs externes :**
- Meta WhatsApp Business Cloud API (gratuite jusqu'à 1 000 conversations/mois)
- Open-Meteo API (gratuite, sans clé, bonne couverture Sénégal)
- OpenAI Whisper API (transcription messages vocaux)

---

## Lien agriculteur ↔ Agri-ERP

### Identification par numéro de téléphone

Le numéro WhatsApp de l'expéditeur (format E.164 : `+221771234567`) est normalisé et comparé au champ `telephone` de la table `users`.

**Migration :** Ajout colonne `telephone` (string, nullable, unique) sur `users`.

L'admin de l'organisation renseigne le numéro WhatsApp de chaque utilisateur depuis la page Utilisateurs existante dans Agri-ERP.

Si le numéro n'est pas reconnu :
> *"Ce numéro n'est pas lié à un compte Agri-ERP. Contactez votre conseiller agricole."*

### Sessions conversationnelles — table `whatsapp_sessions`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint PK | |
| `telephone` | string | numéro normalisé E.164 |
| `user_id` | FK users | |
| `langue` | enum(fr, wo) | préférence langue |
| `contexte` | json | dernier intent, culture_id discutée |
| `updated_at` | timestamp | expiration session après 24h sans activité |

**Choix de langue au premier contact :**
> *"Bonjour ! / Asalaa Maalekum ! Réponds 1 pour Français ou 2 pour Wolof."*
La préférence est sauvegardée — jamais reposée.

---

## Calendrier cultural IA — 6 niveaux

### Cultures couvertes en v1
Oignon, tomate, chou — les 3 cultures maraîchères dominantes au Sénégal.

### Zones météo et coordonnées GPS

| Zone | Latitude | Longitude |
|------|----------|-----------|
| Dakar/Niayes | 14.72 | -17.47 |
| Saint-Louis | 16.03 | -16.50 |
| Louga | 15.62 | -16.22 |
| Thiès | 14.79 | -16.92 |
| Kaolack | 14.15 | -16.07 |
| Ziguinchor | 12.57 | -16.27 |
| Tambacounda | 13.77 | -13.67 |

**Migration :** Ajout colonne `zone_meteo` (enum, nullable) sur `champs`. L'admin sélectionne la zone dans le formulaire champ existant.

`MeteoService` appelle Open-Meteo avec ces coordonnées et récupère pour les 7 prochains jours : `temperature_2m_max`, `temperature_2m_min`, `relative_humidity_2m_mean`, `precipitation_sum`, `et0_fao_evapotranspiration`.

### Niveau 1 — Stades phénologiques et alertes

Calculés depuis `culture.date_semis`. Délais en jours depuis semis/repiquage.

**Oignon :**

| Stade | Délai | Alerte |
|-------|-------|--------|
| Levée | J+8 | Surveiller fonte de semis, arrosage léger fréquent |
| 4 feuilles | J+25 | Premier sarclage + azote N1 |
| 6-8 feuilles | J+45 | Risque thrips si T°nuit < 18°C → faible ; si T° > 25°C → traitement ciblé |
| Bulbaison | J+70 | Stopper fongicides, apport potasse |
| Maturation | J+100 | Réduire arrosage, surveiller maladies de conservation |
| Récolte | J+120 | Alerte récolte + conseil conservation post-récolte |

**Tomate :**

| Stade | Délai | Alerte |
|-------|-------|--------|
| Reprise végétative | J+15 | Tuteurage, apport phosphore |
| Floraison | J+30 | Risque mildiou si humidité > 80% + pluie prévue |
| Nouaison | J+45 | Apport calcium, alerte acariens si T° > 32°C |
| Véraison | J+60 | Réduire azote, apport potasse |
| Récolte | J+80 | Conseil récolte matinale + conservation |

**Chou :**

| Stade | Délai | Alerte |
|-------|-------|--------|
| Pommaison | J+21 | Risque chenilles (Plutella xylostella), traitement Bt bio possible |
| Récolte | J+55 | Récolte matinale, conservation au frais |

### Niveau 2 — Plan de fertilisation complet

Calculé en fonction de la superficie (`champ.superficie_ha`) et de la culture. Rappel automatique à chaque fenêtre de fertilisation.

**Exemple oignon (par hectare) :**
- Semaine 3 (J+21) : 30 kg/ha urée
- Semaine 6 (J+42) : 50 kg/ha NPK 15-15-15
- Semaine 10 (J+70, bulbaison) : 25 kg/ha sulfate de potasse

Les doses sont multipliées par `champ.superficie_ha` et exprimées en sacs entiers (arrondi au sac supérieur).

### Niveau 3 — Gestion de l'irrigation

Basée sur l'évapotranspiration de référence (ET0) fournie par Open-Meteo et le coefficient cultural (Kc) par stade.

Kc indicatifs oignon : levée 0.5 → développement 0.75 → bulbaison 1.05 → maturation 0.75

`ETc = ET0 × Kc` → besoin hydrique journalier en mm → converti en durée d'arrosage selon système (aspersion / goutte-à-goutte / gravitaire) renseigné par l'agriculteur lors de l'onboarding.

Alerte si pluie prévue > ETc : *"Pas d'arrosage nécessaire cette semaine — pluie de 12mm prévue."*

### Niveau 4 — Rotation des cultures inter-saisons

Déclenchée à J+récolte. Le bot recommande la culture suivante pour régénérer le sol :

| Après | Recommandation |
|-------|----------------|
| Oignon | Niébé 45 jours (fixation azote) |
| Tomate | Repos 30 jours + compostage |
| Chou | Oignon ou ail (rupture cycle Plutella) |

### Niveau 6 — Alertes ravageurs saisonniers prédictifs

Basé sur calendrier saisonnier Sénégal + météo en temps réel :

| Ravageur | Période | Conditions déclenchantes |
|----------|---------|--------------------------|
| Thrips oignon | Nov–Fév | T°nuit < 18°C + humidité < 40% |
| Mildiou tomate | Juil–Oct | Humidité > 80% + pluie 48h |
| Mineuse tomate | Mars–Mai | T°max > 32°C |
| Plutella chou | Toute saison | Présence signalée dans la zone |
| Mouche des légumes | Déc–Avr | T°max > 28°C + stade floraison |

### Niveau 7 — Suivi traitements et rotation des molécules

**Table `traitements_appliques` :**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint PK | |
| `culture_id` | FK cultures | |
| `user_id` | FK users | |
| `produit` | string | nom commercial ou matière active |
| `dose` | string | ex: 2ml/L |
| `date_application` | date | |
| `source` | enum(whatsapp, manuel) | |
| `created_at` | timestamp | |

**Règle anti-résistance :** 3 applications consécutives de la même matière active → alerte automatique recommandant une molécule alternative de la liste homologuée Sénégal.

**Produits homologués Sénégal (liste dans le prompt Claude) :** Mancozèbe 80%, Iprodione 50%, Deltamethrine 2.5%, Lambda-cyhalothrine 5%, Thiamethoxam 25%, Imidaclopride 70%, savon insecticide, Bacillus thuringiensis (Bt).

---

## Conseil phytosanitaire en wolof (Feature B)

Extension du `DiagnosticController` existant pour WhatsApp.

### Flux réactif (photo envoyée)

```
Image reçue via WhatsApp
  → Téléchargement depuis Meta API (URL temporaire)
  → Chargement contexte : culture, stade, zone, météo récente, traitements passés
  → Appel DiagnosticService (Claude) avec :
      - Image encodée base64
      - Prompt système : expert phytosanitaire Afrique de l'Ouest,
        répondre en [langue], citer uniquement produits disponibles au Sénégal,
        donner dose précise, fréquence, délai avant récolte (DAR)
  → Réponse structurée :
      - Maladie/ravageur détecté
      - Niveau de confiance
      - Traitement immédiat (produit local + dose)
      - Prévention
  → Enregistrement dans diagnostics (existant)
```

### Flux proactif (intégré au Niveau 6)

Le scheduler génère des alertes préventives avant l'apparition des ravageurs, basées sur stade + conditions météo favorables. Ces alertes précèdent de 3-5 jours les conditions d'attaque.

---

## Interface WhatsApp — flux complets

### Types de messages supportés

| Type | Traitement |
|------|-----------|
| Texte | Intent detection via Claude |
| Image | Diagnostic phytosanitaire |
| Audio (vocal) | Transcription Whisper → traité comme texte |
| Vidéo / Document | *"Merci, envoie un message texte ou une photo."* |

### Onboarding (premier contact)

1. Message reçu → lookup user par telephone
2. Non trouvé → message non enregistré
3. Trouvé, première fois → choix de langue (1=FR / 2=WO)
4. Langue enregistrée → question système d'arrosage :
   *"Quel système d'arrosage utilises-tu ? 1️⃣ Aspersion  2️⃣ Goutte-à-goutte  3️⃣ Gravitaire"*
   → Sauvegardé dans `whatsapp_sessions.contexte`
5. Message de bienvenue + menu

### Menu principal (commande : "menu" ou "aide")

```
🌱 Assistant Maraîcher KadiarAgro

1️⃣ Photo de plante malade
2️⃣ Programme de ma culture
3️⃣ Signaler un traitement
4️⃣ Poser une question
```

### Flux signalement traitement

```
Message : "Dama def Cypermethrin 2ml ci bidon bi tey"
  → Claude extrait : produit, dose, date
  → INSERT traitements_appliques
  → Vérification : 3ème application même molécule ?
      OUI → alerte rotation
      NON → confirmation enregistrement
```

### Routes Laravel (nouvelles)

```
GET  /api/whatsapp/webhook   ← vérification Meta (challenge)
POST /api/whatsapp/webhook   ← réception messages entrants
```

Ces routes sont **publiques** (pas de middleware Sanctum) mais sécurisées par vérification du token Meta (`WHATSAPP_VERIFY_TOKEN`) et signature HMAC du payload.

### Variables d'environnement à ajouter

```
WHATSAPP_ACCESS_TOKEN=       # Meta Graph API token
WHATSAPP_PHONE_NUMBER_ID=    # ID du numéro WhatsApp Business
WHATSAPP_VERIFY_TOKEN=       # token de vérification webhook
OPENAI_API_KEY=              # pour Whisper (transcription vocale)
```

---

## Scheduler — EnvoyerAlertesProactivesJob

Tourne quotidiennement à 7h00 via Laravel Scheduler.

**Algorithme :**
```
Pour chaque Culture (statut=en_cours, user.telephone non null) :
  1. Calculer stade actuel (date_semis + délais)
  2. Si stade = nouveau ET alerte de ce type non envoyée pour cette culture :
     a. Récupérer météo 7 jours (MeteoService)
     b. Évaluer conditions (règles Niveau 1, 3, 6)
     c. Si alerte justifiée :
        - Claude génère message en langue préférée du user
        - WhatsappService envoie
        - INSERT alertes_culturales (culture_id, type, sent_at, message)
```

**Table `alertes_culturales` :**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint PK | |
| `culture_id` | FK cultures | |
| `user_id` | FK users | |
| `type` | string | ex: stade_4_feuilles, mildiou_preventif |
| `message` | text | message envoyé |
| `sent_at` | timestamp | |

Déduplication : `unique(culture_id, type)` — une seule alerte par type par culture.

---

## Vue admin Angular — page `/whatsapp`

Accessible admin uniquement. Composant standalone.

**Contenu :**
- Liste des utilisateurs de l'org avec statut WhatsApp (téléphone configuré ✅ / manquant ⚠️)
- Historique des conversations par utilisateur (messages reçus/envoyés, horodatés)
- Alertes proactives envoyées (type, culture, date)
- Toggle activer/désactiver alertes proactives par utilisateur (`users.alertes_whatsapp_actives` boolean)
- Bouton "Tester la connexion WhatsApp" (envoie un message test au numéro configuré)

---

## Périmètre exclu de ce sprint (backlog)

- **Niveau 5 — Planification anti-suroffre** (nécessite source de données prix marchés — sprint futur)
- Gestion post-récolte (stockage oignon, sacs PICS) — sprint futur
- Prix marchés en temps réel — sprint futur
- Support audio en sortie (réponses vocales) — sprint futur
- Autres cultures (arachide, mil, riz) — sprint futur

---

## Critères de succès

- Un agriculteur envoie une photo de plante malade → reçoit un diagnostic en wolof avec produit disponible au Sénégal en < 30 secondes
- Le scheduler envoie une alerte de fertilisation au bon stade sans doublon
- L'admin Agri-ERP voit l'historique des conversations dans `/whatsapp`
- Un message vocal en wolof est compris et traité correctement
- 3 applications consécutives d'une même molécule → alerte rotation automatique

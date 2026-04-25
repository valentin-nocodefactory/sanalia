# Architecture SEO Définitive — Sanalia

> V. finale — Double arbre Particulier / Professionnel + Géo programmatique 100 villes

---

## 1. Vision & Principes

**Objectif** : devenir le site de référence anti-nuisibles en France, capable de ranker sur chaque combinaison `[service] × [ville]` et de convertir aussi bien les particuliers que les professionnels avec un argumentaire dédié aux souffrances de chaque cible.

**Modèle** : Orkin.com adapté France, avantage concurrentiel sur le contenu réglementaire (HACCP, Certibiocide, loi ELAN) inexistant chez les concurrents.

**Principes fondateurs** :

- **Deux arbres de navigation distincts** : le switch Particulier/Pro redirige vers une vraie page dédiée, pas un simple changement d'UI. Chaque arbre a son propre argumentaire ciblé sur les douleurs de son audience.
- Chaque page a **1 intent dominant unique** → zéro cannibalisation.
- L'architecture sépare le **NUISIBLE** (ce que c'est), le **SERVICE** (comment on le traite), la **GÉOGRAPHIE** (où on intervient), et le **SECTEUR PRO** (pour qui).
- Les pages géographiques sont **programmatiques** et réplicables à 100+ villes sans duplicate content.

---

## 🔴 RÈGLE D'OR ABSOLUE — URL PATTERN PAR NUISIBLE

> **NON-NÉGOCIABLE. À LIRE AVANT TOUTE CRÉATION DE PAGE.**

**Chaque nuisible = 2 pages maximum avec un pattern URL strict :**

```
┌─────────────────────────────────────────┬────────────────────────────────────────────────┐
│ /nuisibles/[espèce]/                    │ /[service]/[espèce]/                            │
│ 🔵 Informationnel                        │ 🟠 Commercial / Transactionnel                  │
├─────────────────────────────────────────┼────────────────────────────────────────────────┤
│ Intent : "Qu'est-ce qu'un X ?"          │ Intent : "Comment un pro élimine un X ?"        │
│ Contenu :                                │ Contenu :                                       │
│  ✅ Biologie, cycle de vie                │  ✅ Méthodes pro d'intervention                 │
│  ✅ Espèces présentes en France          │  ✅ Produits utilisés                          │
│  ✅ Dangers sanitaires                   │  ✅ Nombre de passages, durée                  │
│  ✅ Signes de présence                   │  ✅ Prix indicatifs                            │
│  ✅ Photos d'identification              │  ✅ Garanties                                  │
│  ✅ Prévention générale                  │  ✅ Préparation logement                       │
│  ✅ FAQ biologique                       │  ✅ CTA devis fort                             │
│                                          │                                                 │
│ INTERDIT :                               │ INTERDIT :                                      │
│  ❌ Grille prix                          │  ❌ Biologie de l'espèce                       │
│  ❌ Déroulé d'intervention pro           │  ❌ Photos d'identification                    │
│  ❌ CTA service agressif                 │  ❌ Cycle de vie                               │
│  ❌ Durées de traitement                 │  ❌ Maladies transmises détaillées             │
│  ❌ Comparatif de méthodes pro           │  ❌ Questions de prévention DIY                │
└─────────────────────────────────────────┴────────────────────────────────────────────────┘
```

**Mapping obligatoire par type de nuisible :**

| Type | Service pattern | Exemples |
|------|-----------------|----------|
| Rongeur (rat, souris, taupe, surmulot) | `/deratisation/[espèce]/` | `/deratisation/rats/`, `/deratisation/souris/`, `/deratisation/taupes/` |
| Insecte (cafard, punaise, guêpe, fourmi, moustique, puce, chenille, mite) | `/desinsectisation/[espèce]/` | `/desinsectisation/cafards/`, `/desinsectisation/punaises-de-lit/`, `/desinsectisation/chenilles-processionnaires/` |
| Oiseau (pigeon) | `/depigeonnage/` (pas de suffixe espèce pour l'instant) | `/depigeonnage/` |
| Cas particulier : termites | `/traitement-termites/` (pilier à part, diagnostic obligatoire) | `/traitement-termites/` |
| Microbien (bactéries, virus) | `/desinfection/` | `/desinfection/` |

**Maillage directionnel obligatoire :**
- `/nuisibles/[espèce]/` → CTA visible haut + milieu + bas : **"J'ai ce problème → Voir notre traitement"** → lien vers `/[service]/[espèce]/`
- `/[service]/[espèce]/` → lien contextuel discret bas de page : "En savoir plus sur l'espèce →" `/nuisibles/[espèce]/`

**Titles radicalement différents (obligatoire) :**
- `/nuisibles/rats/` → `"Rats — Guide d'identification, dangers & solutions | Sanalia"`
- `/deratisation/rats/` → `"Dératisation Rats — Traitement pro & devis gratuit | Sanalia"`

**Avant création d'une page, TEST OBLIGATOIRE :**
1. Ouvrir la SERP Google du KW cible en incognito
2. Si SERP dominée par Wikipedia/Ameli/gouv.fr → page `/nuisibles/`
3. Si SERP dominée par entreprises concurrentes → page `/[service]/`
4. Si SERP mélangée → **NE PAS créer de nouvelle page**, enrichir l'existant

**Toute page qui enfreint cette règle sera fusionnée avec redirect 301.**

---

## RÈGLE CARDINALE : 1 intention de recherche = 1 seule page

> Cette règle est la colonne vertébrale de toute l'architecture. Chaque décision de création, de rédaction et de maillage doit la respecter. Sa violation est la première cause d'échec SEO.

### Le problème : la cannibalisation

Quand deux pages du site répondent à la même intention de recherche, Google ne sait pas laquelle classer. Résultat : aucune des deux ne ranke correctement. Le trafic est divisé, l'autorité est diluée, et les deux pages se tirent vers le bas.

### La règle

**Avant de créer ou rédiger toute page, se poser la question : "Existe-t-il déjà une page sur le site qui répond à cette intention de recherche ?" Si oui, enrichir la page existante au lieu d'en créer une nouvelle.**

### Comment l'appliquer concrètement

**Étape 1 — Identifier l'intention dominante.** Chaque page cible UNE intention dominante parmi :
- 🔵 **Informationnel** : l'utilisateur veut comprendre (ex : "qu'est-ce qu'un cafard ?")
- 🟠 **Commercial** : l'utilisateur compare et évalue (ex : "prix dératisation", "meilleur dératiseur")
- 🔴 **Transactionnel** : l'utilisateur veut agir maintenant (ex : "devis dératisation", "destruction nid guêpes")
- 📍 **Local** : l'utilisateur cherche un pro près de lui (ex : "dératisation lyon")

**Étape 2 — Vérifier la SERP Google.** Taper les mots-clés des deux pages candidates. Si Google affiche les mêmes résultats pour les deux → ce sont la même intention → il faut une seule page.

**Étape 3 — Si les intentions se chevauchent, trancher.**

| Situation | Action |
|-----------|--------|
| Deux pages ciblent le même mot-clé | Fusionner sous la page avec le plus gros volume. Redirect 301 l'autre. |
| Deux pages couvrent le même sujet avec un angle différent | OK si les SERPs Google sont différentes. Sinon, fusionner. |
| Une page service et une page blog couvrent le même terrain | Délimiter strictement : le service = l'intervention pro. Le blog = le DIY ou l'info pure. |
| Une page particulier et une page pro couvrent le même service | OK : les audiences sont différentes, les intents aussi (urgence vs conformité). Pas de cannibalisation. |

### Paires à risque dans cette architecture

Ces paires partagent un sujet proche. La colonne "Différenciation" est **obligatoire** — si elle n'est pas respectée dans la rédaction, il y aura cannibalisation.

| Page A | Page B | Même intention ? | Différenciation obligatoire |
|--------|--------|-----------------|---------------------------|
| /nuisibles/cafards/ | /desinsectisation/cafards/ | NON | A = "qu'est-ce qu'un cafard" (🔵). B = "comment on l'élimine en intervention pro" (🟠). |
| /nuisibles/punaises-de-lit/ | /desinsectisation/punaises-de-lit/ | NON | A = identification, biologie, prévention (🔵). B = méthodes de traitement pro (🟠). |
| /nuisibles/rats/ | /deratisation/ | NON | A = l'animal (🔵). B = le service (🟠). |
| /nuisibles/rats/ | /deratisation/rats/ | NON | A = biologie générale. B = traitement spécifique de l'espèce. |
| /desinsectisation/punaises-de-lit/ | /conseils/se-debarrasser-punaises/ | NON | A = service professionnel (🟠). B = DIY/autonomie (🔵). |
| /nuisibles/punaises-de-lit/ | /conseils/se-debarrasser-punaises/ | RISQUE | A = guide ultime (identification + aperçu solutions). B = uniquement DIY. Le blog ne doit PAS refaire l'identification. |
| /conseils/formation-haccp/ | /conseils/certification-haccp/ | RISQUE | A = processus d'apprentissage. B = document obtenu. Vérifier la SERP. |
| /conseils/prix/deratisation/ | /deratisation/ | NON | A = article prix détaillé (🟠 prix). B = page service globale. Ne pas mettre de grille tarifaire complète dans B. |
| /deratisation/ | /professionnel/deratisation/ | NON | Audiences et douleurs opposées. Pas de cannibalisation si les argumentaires sont bien distincts. |
| /deratisation/lyon/ | /professionnel/deratisation/lyon/ | NON | Idem au niveau local : urgence/prix vs contrat/conformité. |
| /professionnel/restauration/controle-ddpp/ | /conseils/inspection-sanitaire/ | RISQUE | A = focus organisme DDPP et procédure administrative. B = guide pratique préparation. Vérifier SERP, fusionner si identiques. |

### Règle pour les rédacteurs

Chaque brief de rédaction DOIT contenir :
1. La liste des questions auxquelles la page répond (son territoire)
2. La liste des questions auxquelles elle NE DOIT PAS répondre (territoire d'une autre page)
3. Un lien vers la page qui couvre le sujet connexe (pour le maillage, pas pour le contenu)

Exemple pour `/desinsectisation/cafards/` :
- ✅ Répond à : déroulement intervention, produits utilisés, nb passages, garantie, préparation logement
- ❌ Ne répond PAS à : qu'est-ce qu'un cafard, quelles espèces, pourquoi j'en ai (→ c'est `/nuisibles/cafards/`)
- ❌ Ne répond PAS à : astuces DIY, acide borique, terre de diatomée (→ c'est `/conseils/eliminer-cafards/`)
- 🔗 Lien vers : /nuisibles/cafards/ ("en savoir plus sur les cafards") et /conseils/eliminer-cafards/ ("essayer par vous-même d'abord")

---

## 2. Double Arbre — Logique de Navigation

### Le principe

Le site comporte **deux univers** avec chacun sa propre homepage, ses propres pages services, ses propres pages géo et son propre tunnel de conversion. Un toggle persistant en header permet de basculer d'un univers à l'autre.

Le toggle **redirige vers la page équivalente** dans l'autre arbre quand elle existe, ou vers la homepage de l'autre arbre quand il n'y a pas d'équivalent.

```
ARBRE PARTICULIER (défaut)          ARBRE PROFESSIONNEL
/                                   /professionnel/
/deratisation/                      /professionnel/deratisation/
/deratisation/lyon/                 /professionnel/deratisation/lyon/
/desinsectisation/                  /professionnel/desinsectisation/
/desinsectisation/punaises-de-lit/  /professionnel/desinsectisation/punaises-de-lit/
/devis/                             /professionnel/devis/

PAGES PARTAGÉES (accessibles depuis les deux arbres)
/nuisibles/                         ← Encyclopédie = contenu info neutre
/conseils/                          ← Blog = contenu info neutre
/faq/                               ← FAQ
/a-propos/                          ← Institutionnel
```

### Pourquoi deux arbres séparés

Les **souffrances** des deux cibles sont fondamentalement différentes. Le même service (dératisation) doit être vendu avec un argumentaire opposé :

| | Particulier | Professionnel |
|--|-------------|---------------|
| **Douleur principale** | "C'est urgent, j'ai peur, je veux que ça disparaisse" | "Je risque une amende/fermeture, je dois être en conformité" |
| **Déclencheur** | Observation directe (j'ai vu un rat / des piqûres) | Contrôle sanitaire imminent, signalement client, audit |
| **Critère de choix** | Prix, rapidité, avis clients | Conformité, certifications, traçabilité, contrat |
| **CTA** | "Intervention urgente" / "Devis gratuit" | "Demander un audit" / "Contrat sur-mesure" |
| **Réassurance** | Garantie résultat, sans danger enfants/animaux | Certibiocide, rapport HACCP, couverture assurance |
| **Contenu prix** | Grille simple, prix au m² | ROI (coût contrat vs coût d'une fermeture admin.) |
| **Contenu géo** | Délai intervention, quartiers, avis | Références clients locaux, secteurs couverts, SLA |

### Comportement du toggle

- **Depuis une page Particulier** → clic sur "Professionnel" → redirige vers la page équivalente `/professionnel/...` si elle existe, sinon vers `/professionnel/`
- **Depuis une page Professionnel** → clic sur "Particulier" → redirige vers la page équivalente `/...` si elle existe, sinon vers `/`
- **Depuis une page partagée** (/nuisibles/, /conseils/) → clic redirige vers la homepage de l'arbre choisi
- Le choix est mémorisé (cookie) pour les visites suivantes

### Mapping des pages entre arbres

| Page Particulier | Page Pro équivalente | Contenu différent |
|--|--|--|
| `/` | `/professionnel/` | Hero, argumentaire, CTA, témoignages |
| `/deratisation/` | `/professionnel/deratisation/` | Angle urgence vs angle conformité |
| `/desinsectisation/` | `/professionnel/desinsectisation/` | Idem |
| `/desinfection/` | `/professionnel/desinfection/` | Idem |
| `/deratisation/lyon/` | `/professionnel/deratisation/lyon/` | Angle prix/rapidité vs angle contrat/références |
| `/desinsectisation/punaises-de-lit/` | `/professionnel/desinsectisation/punaises-de-lit/` | DIY vs protocole hôtel/entreprise |
| `/devis/` | `/professionnel/devis/` | Formulaire simple vs formulaire SIRET/secteur |
| — (pas d'équivalent) | `/professionnel/restauration/` | Pro-only : page secteur |
| — | `/professionnel/coproprietes/` | Pro-only |
| — | `/professionnel/contrat-maintenance/` | Pro-only |
| `/nuisibles/rats/` | ← Partagée | Même page, accessible des 2 arbres |
| `/conseils/prix/deratisation/` | ← Partagée | Même page |

---

## 3. Structure URL Complète

```
ACCUEIL
/                                         ← Home Particulier
/professionnel/                           ← Home Professionnel

ENCYCLOPÉDIE NUISIBLES (partagée)
/nuisibles/                               ← Hub index espèces
/nuisibles/rats/
/nuisibles/souris/
/nuisibles/cafards/
/nuisibles/punaises-de-lit/
/nuisibles/guepes-frelons/
/nuisibles/fourmis/
/nuisibles/moustiques/
/nuisibles/pigeons/
/nuisibles/chenilles-processionnaires/
/nuisibles/puces/
/nuisibles/taupes/
/nuisibles/termites/
/nuisibles/mites-alimentaires/
/nuisibles/[+15 espèces programmatiques]

SERVICES PARTICULIER
/deratisation/                            ← Pilier dératisation particulier
/deratisation/rats/                       ← Spécialité espèce
/deratisation/souris/
/desinsectisation/                        ← Pilier désinsectisation particulier
/desinsectisation/cafards/
/desinsectisation/punaises-de-lit/
/desinsectisation/guepes/
/desinfection/                            ← Pilier désinfection particulier
/depigeonnage/
/traitement-termites/

SERVICES PROFESSIONNEL
/professionnel/deratisation/              ← Pilier dératisation pro
/professionnel/deratisation/rats/
/professionnel/deratisation/souris/
/professionnel/desinsectisation/          ← Pilier désinsectisation pro
/professionnel/desinsectisation/cafards/
/professionnel/desinsectisation/punaises-de-lit/
/professionnel/desinsectisation/guepes/
/professionnel/desinfection/
/professionnel/desinfection/locaux-professionnels/
/professionnel/depigeonnage/

GÉOGRAPHIE PARTICULIER
/deratisation/paris/
/deratisation/lyon/
/deratisation/marseille/
/deratisation/[100 villes]/
/desinsectisation/paris/
/desinsectisation/lyon/
/desinsectisation/[100 villes]/
/punaises-de-lit/paris/                   ← URL raccourcie (volume justifie)
/punaises-de-lit/lyon/
/punaises-de-lit/[100 villes]/

GÉOGRAPHIE PROFESSIONNEL
/professionnel/deratisation/paris/
/professionnel/deratisation/lyon/
/professionnel/deratisation/[100 villes]/
/professionnel/desinsectisation/paris/
/professionnel/desinsectisation/lyon/
/professionnel/desinsectisation/[100 villes]/

SECTEURS B2B (pro-only)
/professionnel/restauration/
/professionnel/restauration/haccp-nuisibles/
/professionnel/restauration/controle-ddpp/
/professionnel/restauration/obligations/
/professionnel/coproprietes/
/professionnel/coproprietes/loi-elan/
/professionnel/coproprietes/deratisation-immeuble/
/professionnel/agroalimentaire/
/professionnel/sante/
/professionnel/logistique/
/professionnel/contrat-maintenance/
/professionnel/reglementation/
/professionnel/reglementation/norme-haccp/
/professionnel/reglementation/certibiocide/
/professionnel/reglementation/plan-maitrise-nuisibles/

BLOG & CONSEILS (partagé)
/conseils/
/conseils/prix/deratisation/
/conseils/prix/punaises-de-lit/
/conseils/prix/nid-de-guepes/
/conseils/eliminer-cafards/
/conseils/se-debarrasser-punaises/
/conseils/se-debarrasser-rats/
/conseils/blattes-germaniques/
/conseils/frelon-asiatique/
/conseils/frelons-guide/
/conseils/piqure-punaise-de-lit/
/conseils/infestation-cafards/
/conseils/mites-alimentaires/
/conseils/formation-haccp/
/conseils/certification-haccp/
/conseils/inspection-sanitaire/
/conseils/nuisibles-[saison]/
/faq/

URGENCE & CONVERSION
/devis/                                   ← Conversion particulier
/professionnel/devis/                     ← Conversion pro
/urgence/deratisation/                    ← SEA noindex
/urgence/punaises-de-lit/
/urgence/nid-de-guepes/
/urgence/[ville]/
/merci/

INSTITUTIONNEL (partagé)
/a-propos/
/nos-techniciens/
/garantie/
/avis-clients/
/partenaires/
```

---

## 4. Navigation par Arbre

### Menu Particulier

```
Accueil
Nuisibles           → Mega menu toutes espèces
Nos services         → Dératisation · Désinsectisation · Désinfection · Dépigeonnage
Votre ville          → Sélecteur ville + top villes
Conseils             → Prix · Guides · Prévention · Saisonnier
Urgence / Devis      → CTA rouge
                    [Toggle: Vous êtes professionnel ? →]
```

### Menu Professionnel

```
Accueil Pro
Votre secteur        → Restauration · Copro · Agro · Santé · Logistique
Services pro         → Dératisation pro · Désinsectisation pro · Désinfection · Contrat
Réglementation       → HACCP · Certibiocide · DDPP · Loi ELAN · PMN
Votre ville          → Sélecteur ville + top villes
Devis Pro            → CTA avec SIRET
                    [Toggle: Vous êtes particulier ? →]
```

---

## 5. Homepages

### / — Homepage Particulier

- **H1** : Dératisation & Désinsectisation — Intervention Rapide 7j/7
- **Hero** : numéro d'urgence, formulaire multi-step rapide (quel nuisible ? où ? quand ?), photos avant/après
- **Argumentaire souffrances particulier** :
  - "Vous avez vu un rat / des piqûres / des cafards ?" → urgence émotionnelle
  - "Intervention sous 2h, 7j/7"
  - "Résultat garanti ou on repasse gratuitement"
  - "Sans danger pour vos enfants et animaux"
  - Avis clients particuliers (5 étoiles Google)
- **Blocs** : top nuisibles (vignettes visuelles) → /nuisibles/ · Services → /deratisation/ etc. · Villes → sélecteur · Prix → /conseils/prix/ · Avis
- **Schema** : LocalBusiness + FAQPage

### /professionnel/ — Homepage Professionnel

- **H1** : Anti-Nuisibles Professionnels — Conformité, Contrat & Intervention Certifiée
- **Hero** : formulaire B2B (secteur, SIRET, nombre de sites, surface), logo certifications
- **Argumentaire souffrances professionnel** :
  - "Un contrôle DDPP est prévu ? Passez-le sereinement"
  - "Conformité HACCP garantie — rapport inclus à chaque passage"
  - "Contrat annuel à partir de X€/mois — évitez les amendes et fermetures"
  - "Techniciens Certibiocide — interventions discrètes en heures creuses"
  - Références clients pro (logos restaurants, hôtels, syndics)
- **Blocs** : Secteurs (Restauration, Copropriétés, Agro, Santé) · Services pro · Réglementation · Références · Certifications
- **Schema** : Organization + Service

---

## 6. Encyclopédie Nuisibles (Partagée)

> Pages accessibles depuis les deux arbres. Contenu informatif neutre.
> URL : `/nuisibles/[espece]/`
> Chaque page comporte **deux encarts CTA distincts** : "Vous êtes particulier → /devis/" et "Vous êtes professionnel → /professionnel/devis/"

### /nuisibles/ — Hub

- **H1** : Guide des Nuisibles en France — Identification & Solutions
- **Format** : grille visuelle type Orkin pest library
- **Maillage** : vers chaque page espèce

### /nuisibles/rats/

- **H1** : Rats — Identification, Dangers, Signes de Présence & Solutions
- **KW** : rats — Vol. 4 400 — KD 1 — TP 5 100
- **Intent** : 🔵 Informationnel
- **Questions** : Espèces France (surmulot, rat noir), différences rat/souris, dangers sanitaires, signes de présence, prévention
- **Schema** : HowTo + FAQPage
- **Maillage** :
  - → /deratisation/ (service particulier)
  - → /professionnel/deratisation/ (service pro)
  - → /deratisation/[ville]/ (géo)
- **Double CTA** : "Intervention urgente → /devis/" | "Contrat pro → /professionnel/devis/"

### /nuisibles/souris/

- **H1** : Souris — Reconnaître, Comprendre & Éliminer
- **KW** : souris maison — Vol. ~4 500
- **Intent** : 🔵 Informationnel
- **Questions** : Reconnaître souris vs rat, dangers, signes, solutions, prévention
- **Duplicate** : espèce distincte du rat (taille, comportement, dégâts différents)

### /nuisibles/cafards/

- **H1** : Cafards & Blattes — Espèces, Causes & Élimination
- **KW** : cafards — Vol. 8 500 — KD 2 — TP 16 000
- **Intent** : 🔵 Informationnel
- **Questions** : Reconnaître un cafard, espèces (germanique, orientale, américaine), causes, solutions, quand appeler un pro
- **Note** : "cafards" + "blattes" = 1 seule page (même SERP)

### /nuisibles/punaises-de-lit/

- **H1** : Punaises de Lit — Identification, Piqûres, Traitement & Prévention
- **KW** : punaises de lit — Vol. 27 000 — KD 50 — TP 160 000
- **Intent** : 🔵 Informationnel
- **Questions** : Reconnaître (photos), signes infestation, cycle de vie, aperçu méthodes, prévention
- **Format** : guide ultime 3 000+ mots

### /nuisibles/guepes-frelons/

- **H1** : Guêpes & Frelons — Espèces, Dangers, Nids & Destruction
- **KW** : nid de guêpes — Vol. 3 500 — KD 0 — TP 15 000
- **Intent** : 🔵 Info + 🟠 Commercial

### /nuisibles/chenilles-processionnaires/

- **H1** : Chenilles Processionnaires — Dangers, Réglementation & Traitement
- **KW** : chenilles processionnaires — Vol. 14 000 — KD faible
- **Note** : exclusif France, 0 chez Orkin = opportunité unique

### Autres espèces

`/nuisibles/fourmis/` (3 500) · `/nuisibles/moustiques/` (7 000) · `/nuisibles/pigeons/` (2 800) · `/nuisibles/puces/` (4 000) · `/nuisibles/taupes/` (2 200) · `/nuisibles/termites/` (5 500) · `/nuisibles/mites-alimentaires/` (14 000) · +15 espèces programmatiques.

---

## 7. Services Particulier

> Angle : LE SERVICE pour un particulier (urgence, prix, simplicité, sécurité famille).
> URL : `/[service]/` et `/[service]/[specialite]/`
> Argumentaire centré sur : rapidité, prix, garantie, sans danger enfants/animaux.

### /deratisation/

- **H1** : Dératisation — Intervention Rapide, Résultat Garanti
- **KW** : dératisation — Vol. 3 500 — KD 2 — TP 1 700
- **Intent** : 🟠 Commercial
- **Argumentaire particulier** :
  - "Vous avez entendu des bruits dans les murs ? Vu des crottes ?"
  - Intervention sous 2h, 7j/7
  - Méthodes sécurisées (enfants, animaux de compagnie)
  - Garantie : si le problème persiste, on repasse gratuitement
  - Prix transparent, devis gratuit immédiat
- **Questions** : Qu'est-ce que la dératisation, méthodes, déroulement, nb passages, prix, garantie
- **Maillage** : ← /nuisibles/rats/ · → /deratisation/[ville]/ · → /devis/
- **Toggle** : bandeau "Vous êtes un professionnel ? → /professionnel/deratisation/"

#### /deratisation/rats/ · /deratisation/souris/

Sous-pages spécialité espèce, angle particulier (simplicité, prix).

### /desinsectisation/

- **H1** : Désinsectisation — Élimination Tous Insectes, Intervention Pro
- **KW** : désinsectisation — Vol. 2 100 — KD 0
- **Intent** : 🟠 Commercial
- **Argumentaire particulier** : urgence, efficacité, sécurité, prix

#### /desinsectisation/cafards/

- **H1** : Traitement Cafards — Élimination Définitive, Résultat Garanti
- **KW** : désinsectisation cafard — Vol. 350 — KD 0
- **Argumentaire** : "cafards dans votre cuisine ?", intervention discrète, produits sécurisés, résultat garanti
- **Duplicate** : angle SERVICE (intervention) ≠ /nuisibles/cafards/ (identification)

#### /desinsectisation/punaises-de-lit/

- **H1** : Traitement Punaises de Lit — Méthodes Pro & Garantie Résultat
- **KW** : traitement punaise de lit — Vol. 6 800 — KD 47 — TP 19 000
- **Argumentaire** : "piqûres au réveil ?", méthodes (chimique, thermique), sans danger, combien de passages, prix, garantie
- **Duplicate** : angle MÉTHODES DE TRAITEMENT ≠ /nuisibles/punaises-de-lit/ (identification)

#### /desinsectisation/guepes/

- **H1** : Destruction Nid de Guêpes & Frelons — Intervention Sécurisée
- **KW** : destruction nid de guêpes — Vol. 1 600 — KD 3
- **Intent** : 🔴 Transactionnel

### /desinfection/ · /depigeonnage/ · /traitement-termites/

Mêmes principes : argumentaire centré sur les douleurs particulier.

---

## 8. Services Professionnel

> Angle : LE SERVICE pour un professionnel (conformité, contrat, traçabilité, discrétion).
> URL : `/professionnel/[service]/`
> Argumentaire centré sur : obligations légales, risque d'amende, ROI contrat, certifications, rapport d'intervention.

### /professionnel/deratisation/

- **H1** : Dératisation Professionnelle — Conformité, Contrat & Traçabilité
- **KW** : dératisation entreprise — Vol. ~1 200
- **Intent** : 🟠 Commercial B2B
- **Argumentaire professionnel** :
  - "Vous devez justifier d'un contrat de dératisation lors du prochain contrôle DDPP ?"
  - Intervention en heures creuses, zéro perturbation de l'activité
  - Rapport d'intervention horodaté à chaque passage (preuve HACCP)
  - Techniciens Certibiocide, assurance RC Pro
  - Contrat annuel avec fréquence adaptée à votre secteur
  - "Une fermeture administrative coûte 10× plus cher qu'un contrat annuel"
- **Questions** : Obligations légales pro, contrat annuel (contenu, fréquence), rapport HACCP, prix pro, couverture multi-sites
- **Maillage** : ← /nuisibles/rats/ · → /professionnel/deratisation/[ville]/ · → /professionnel/devis/
- **Toggle** : bandeau "Vous êtes un particulier ? → /deratisation/"

#### /professionnel/deratisation/rats/ · /professionnel/deratisation/souris/

Sous-pages spécialité espèce, angle pro (protocole, traçabilité).

### /professionnel/desinsectisation/

- **H1** : Désinsectisation Professionnelle — Protocole Certifié & Contrat
- **KW** : entreprise de désinsectisation — Vol. 700 — KD 2
- **Argumentaire** : conformité, discrétion, rapport, contrat

#### /professionnel/desinsectisation/cafards/

- **H1** : Désinsectisation Cafards Professionnel — HACCP & Protocole Restaurant
- **Argumentaire** : risques HACCP, fermeture administrative, protocole cuisine pro, rapport d'intervention

#### /professionnel/desinsectisation/punaises-de-lit/

- **H1** : Traitement Punaises de Lit Professionnel — Hôtel, Location, Entreprise
- **KW** : punaise de lit entreprise — Vol. 150 — KD 20 — TP 1 900
- **Argumentaire** : protocole hôtelier (gestion crise, discrétion client), responsabilité juridique, contrat préventif, traitement entre deux réservations

#### /professionnel/desinsectisation/guepes/

Idem angle pro.

### /professionnel/desinfection/

- **H1** : Désinfection Professionnelle — Locaux, Normes & Protocole
- **Argumentaire** : normes sanitaires, HACCP, désinfection post-infestation

#### /professionnel/desinfection/locaux-professionnels/

- **H1** : Désinfection Locaux Professionnels — Protocole & Conformité
- **KW** : désinfection locaux professionnels — Vol. ~1 800

### /professionnel/depigeonnage/

Angle pro : dégâts sur bâtiment, façades, conformité copropriété.

---

## 9. Secteurs B2B (Pro-only)

> Pages sans équivalent particulier. Accessibles uniquement depuis l'arbre pro.
> URL : `/professionnel/[secteur]/`

### /professionnel/restauration/

- **H1** : Anti-Nuisibles Restauration & CHR — HACCP, DDPP & Contrat
- **KW** : dératisation restaurant — Vol. 90 — KD 0
- **Intent** : 🟠 Commercial B2B
- **Argumentaire** :
  - "Votre prochain contrôle DDPP approche ?"
  - Obligations HACCP spécifiques restauration
  - Contrat annuel adapté CHR
  - Rapport d'intervention comme preuve de conformité
  - Conséquences d'un contrôle raté (fermeture, amende)
- **Sous-pages** :
  - `/professionnel/restauration/haccp-nuisibles/` — HACCP × nuisibles : guide conformité (KW : haccp restaurant — Vol. 100, TP 19 000)
  - `/professionnel/restauration/controle-ddpp/` — Préparer l'inspection (Vol. 200, KD 0)
  - `/professionnel/restauration/obligations/` — Textes de loi applicables
  - `/professionnel/restauration/hygiene/` — Guide hygiène restaurant (Vol. 100)

### /professionnel/coproprietes/

- **H1** : Anti-Nuisibles Copropriétés — Obligations Syndic, Loi ELAN & Contrat
- **KW** : dératisation copropriété — Vol. 60 — KD 0
- **Argumentaire** : obligations légales syndic, loi ELAN, qui paie, contrat adapté
- **Sous-pages** :
  - `/professionnel/coproprietes/loi-elan/` — Loi ELAN & nuisibles
  - `/professionnel/coproprietes/deratisation-immeuble/` — Intervention technique immeuble (Vol. 150, KD 0)

### /professionnel/agroalimentaire/

- **H1** : Anti-Nuisibles Industrie Agroalimentaire — IFS, BRC & IPM
- **KW** : nuisibles agroalimentaire — Vol. ~900
- **Argumentaire** : normes IFS/BRC, lutte intégrée, audit, insectes produits stockés

### /professionnel/sante/

- **H1** : Anti-Nuisibles Établissements de Santé — Hôpitaux, EHPAD, Cliniques
- **KW** : ~700
- **Argumentaire** : patients vulnérables, protocole spécifique, discrétion, normes ARS

### /professionnel/logistique/

- **H1** : Anti-Nuisibles Entrepôts & Logistique — Protection des Stocks
- **KW** : ~500

### /professionnel/contrat-maintenance/

- **H1** : Contrat Maintenance Anti-Nuisibles — Formules, Fréquences & ROI
- **KW** : contrat dératisation — Vol. 50 — KD 0
- **Argumentaire** : ROI (coût contrat vs coût fermeture), formules par secteur, fréquence, rapport inclus, couverture multi-sites

### /professionnel/reglementation/

Hub réglementaire regroupant :
- `/professionnel/reglementation/norme-haccp/` — Les 7 principes (Vol. 600, KD 5, TP 19 000)
- `/professionnel/reglementation/certibiocide/` — Certification (Vol. 1 300, KD 5)
- `/professionnel/reglementation/plan-maitrise-nuisibles/` — PMN modèle & guide (lead magnet PDF)

---

## 10. Pages Géographiques — Programmatiques

> URL : `/[service]/[ville]/` (particulier) et `/professionnel/[service]/[ville]/` (pro)
> Volume cible : ~350+ pages particulier + ~200+ pages pro

### Pattern URL

```
PARTICULIER                              PROFESSIONNEL
/deratisation/paris/                     /professionnel/deratisation/paris/
/deratisation/lyon/                      /professionnel/deratisation/lyon/
/desinsectisation/paris/                 /professionnel/desinsectisation/paris/
/punaises-de-lit/paris/                  /professionnel/punaises-de-lit/paris/
```

Le toggle sur `/deratisation/lyon/` redirige vers `/professionnel/deratisation/lyon/` et inversement.

### Template Particulier — `/[service]/[ville]/`

**H1** : `[Service] [Ville] — Intervention Rapide, Devis Gratuit`

**Zone unique 30%** :
- Intro locale : contexte de la ville face au nuisible, quartiers touchés, spécificités (berges, marchés, vieux centre...)
- Bloc "Quartiers & arrondissements couverts" : liste locale
- Avis clients locaux (minimum 2)
- Statistiques locales (nb interventions, temps de trajet)

**Argumentaire particulier** :
- Intervention sous `{delai}` à `{ville}`
- `{nb_techniciens}` techniciens basés dans votre secteur
- Prix à `{ville}` : à partir de X€
- Garantie résultat
- Sans danger pour vos enfants et animaux

**Zone paramétrée 40%** (variables dynamiques) :
```
{ville}, {departement}, {region}, {code_postal}, {population},
{type_habitat}, {climat}, {nuisible_dominant}, {delai_intervention},
{nb_techniciens}, {telephone_local}, {villes_proches}, {specificite_locale}
```

**Zone partagée 30%** : méthodologie, certifications, garantie, CTA.

### Template Professionnel — `/professionnel/[service]/[ville]/`

**H1** : `[Service] Professionnel [Ville] — Contrat, Conformité & Intervention Certifiée`

**Zone unique 30%** :
- Intro locale pro : secteurs d'activité dominants dans la ville, nombre de restaurants/hôtels/copropriétés
- Bloc "Références clients à `{ville}`" : logos ou témoignages pros locaux
- Bloc "Réglementation locale" : spécificités départementales éventuelles

**Argumentaire professionnel** :
- `{nb_techniciens}` techniciens Certibiocide couvrant `{ville}` et `{villes_proches}`
- Intervention en heures creuses, zéro perturbation activité
- Rapport HACCP horodaté à chaque passage
- Contrat annuel adapté à votre secteur (`{secteurs_locaux}`)
- "X entreprises de `{ville}` nous font déjà confiance"

**Zone paramétrée 40%** : mêmes variables + `{secteurs_locaux}`, `{nb_entreprises_clientes}`, `{references_locales}`

**Zone partagée 30%** : méthodologie pro, certifications, contrat, formulaire devis B2B.

### Différenciation duplicate entre les deux templates d'une même ville

`/deratisation/lyon/` et `/professionnel/deratisation/lyon/` couvrent le même service dans la même ville mais NE SONT PAS dupliqués car :
- H1 différent (urgence vs conformité)
- Argumentaire opposé (prix/rapidité vs contrat/rapport)
- Témoignages différents (particuliers vs pros)
- CTA différent (/devis/ vs /professionnel/devis/)
- Questions couvertes différentes (cf. tableau section 2)

### Top 20 villes prioritaires

Paris, Lyon, Marseille, Toulouse, Bordeaux, Lille, Nice, Nantes, Strasbourg, Montpellier, Rennes, Toulon, Grenoble, Dijon, Angers, Nîmes, Le Mans, Clermont-Ferrand, Aix-en-Provence, Brest.

Pages par ville : 3 services × 2 arbres = 6 pages/ville → 120 pages pour le top 20.

Extension : top 100 villes → ~600 pages géo.

### Anti-duplicate entre villes

- Minimum 30% contenu unique par ville (intro, quartiers, avis, stats locales)
- Variables dynamiques dans les zones paramétrées → chaque phrase est techniquement unique
- Ne JAMAIS copier-coller un paragraphe d'intro entre 2 villes
- Canonical self-referencing sur chaque page
- Liens inter-villes limités à "Villes proches" en footer

### Hiérarchie géographique (phase 2+)

```
/deratisation/                          ← Nationale (pilier)
├── /deratisation/ile-de-france/        ← Régionale (hub)
│   ├── /deratisation/paris/            ← Ville
│   │   ├── /deratisation/paris-18/     ← Arrondissement
│   │   └── /deratisation/paris-19/
│   ├── /deratisation/boulogne/
│   └── ...
├── /deratisation/auvergne-rhone-alpes/
│   ├── /deratisation/lyon/
│   └── ...
```

---

## 11. Blog & Conseils (Partagé)

> Pages accessibles depuis les deux arbres. Double CTA (particulier + pro).
> URL : `/conseils/[slug]/`
> Rôle : capter le trafic longue traîne, pomper l'autorité vers les pages services et nuisibles.

### Catégorie Prix

| URL | H1 | KW | Vol. | KD |
|-----|----|----|------|-----|
| /conseils/prix/deratisation/ | Prix Dératisation 2026 — Tarifs & Devis | prix dératisation | 600 | 1 |
| /conseils/prix/punaises-de-lit/ | Prix Traitement Punaises de Lit | traitement punaise de lit prix | 450 | 0 |
| /conseils/prix/nid-de-guepes/ | Prix Destruction Nid de Guêpes | prix nid de guêpes | 1 500 | — |

### Catégorie Guides DIY

| URL | H1 | KW | Vol. | KD |
|-----|----|----|------|-----|
| /conseils/eliminer-cafards/ | Éliminer les Cafards Définitivement | éliminer cafards définitivement | 1 200 | 0 |
| /conseils/se-debarrasser-punaises/ | Se Débarrasser des Punaises de Lit Soi-Même | se débarrasser des punaises de lit | 1 300 | 58 |
| /conseils/se-debarrasser-rats/ | Se Débarrasser des Rats — DIY & Prévention | se débarrasser des rats | 400 | 0 |
| /conseils/blattes-germaniques/ | Blattes Germaniques — La Plus Résistante | blattes germaniques | 1 500 | 0 |
| /conseils/frelon-asiatique/ | Frelon Asiatique — Reconnaître & Réagir | frelon asiatique | 142 000 | 4 |
| /conseils/frelons-guide/ | Frelons — Espèces, Piqûres & Réagir | frelons | 15 000 | 3 |
| /conseils/piqure-punaise-de-lit/ | Piqûre de Punaise — Reconnaître & Soigner | piqure punaise de lit | 800 | 0 |
| /conseils/infestation-cafards/ | Infestation Cafards — Que Faire en Urgence | infestation cafards | 150 | 0 |
| /conseils/mites-alimentaires/ | Mites Alimentaires — Identification & Solutions | mites alimentaires | 14 000 | 0 |

### Catégorie Réglementation

| URL | H1 | KW | Vol. | KD |
|-----|----|----|------|-----|
| /conseils/formation-haccp/ | Formation HACCP — Obligations, Prix & Organismes | formation haccp | 5 200 | 8 |
| /conseils/certification-haccp/ | Certification HACCP — Obtention & Renouvellement | certification haccp | 400 | 3 |
| /conseils/inspection-sanitaire/ | Inspection Sanitaire — 10 Étapes de Préparation | inspection sanitaire | 150 | 1 |

### /faq/

- FAQ globale avec Schema FAQPage
- Organisée par thème (nuisibles, services, prix, réglementation)
- Objectif : featured snippets

---

## 12. Conversion & Urgence

### /devis/ — Particulier

- **Formulaire multi-step** : nuisible → lieu (code postal) → urgence → coordonnées
- **Réassurance** : gratuit, sans engagement, réponse 2h, garanti

### /professionnel/devis/ — Professionnel

- **Formulaire enrichi** : secteur d'activité, SIRET, nb de sites, surface totale, type de contrat souhaité, nuisible(s) concerné(s)
- **Réassurance** : audit offert, rapport HACCP, couverture multi-sites, interlocuteur unique

### /urgence/ — SEA (noindex)

Landing pages optimisées Quality Score, pas indexées :
- `/urgence/deratisation/`
- `/urgence/punaises-de-lit/`
- `/urgence/nid-de-guepes/`
- `/urgence/[ville]/`

### /merci/

Page confirmation + tracking GA4 + Google Ads conversion + Meta pixel.

---

## 13. Institutionnel & E-E-A-T

| URL | Contenu | Schema |
|-----|---------|--------|
| /a-propos/ | Réseau, certifications, histoire, chiffres | Organization |
| /nos-techniciens/ | Profils individuels avec photo et certif (modèle Orkin Man) | Person |
| /garantie/ | Garantie satisfaction (mentionnée sur toutes les pages) | — |
| /avis-clients/ | Témoignages + intégration Google Reviews | AggregateRating |
| /partenaires/ | Recrutement sous-traitants locaux | — |

Les techniciens sont mentionnés comme **auteurs** des pages /conseils/ (signal E-E-A-T).

---

## 14. Maillage Interne

### Flux d'autorité

```
/conseils/ (blog)         /nuisibles/ (encyclopédie)
      ↓ ⬆ LIEN                  ↓ ⬆ LIEN
      ↓                          ↓
/[service]/ (particulier)    /professionnel/[service]/ (pro)
      ↓                          ↓
/[service]/[ville]/          /professionnel/[service]/[ville]/
      ↓                          ↓
/devis/                      /professionnel/devis/
```

### Règles

1. **Chaque page nuisible → services des deux arbres** : `/nuisibles/rats/` lie vers `/deratisation/` ET `/professionnel/deratisation/`
2. **Chaque page service → ses pages géo** : `/deratisation/` liste les villes
3. **Chaque page géo → son service parent** : `/deratisation/lyon/` → `/deratisation/`
4. **Chaque page géo → le nuisible** : `/deratisation/lyon/` → `/nuisibles/rats/`
5. **Chaque article blog → page mère pertinente** : `/conseils/eliminer-cafards/` → `/nuisibles/cafards/`
6. **Chaque page pro secteur → service pro + nuisible** : `/professionnel/restauration/` → `/professionnel/deratisation/` + `/nuisibles/cafards/`
7. **Toutes pages particulier → /devis/** et **toutes pages pro → /professionnel/devis/**
8. **Anchor text = mot-clé cible** de la page de destination
9. **Lien toggle entre arbres** sur chaque page service/géo : lien visible vers l'équivalent dans l'autre arbre

---

## 15. Alertes Duplicate Content

### Inter-sections (même arbre)

| Page A | Page B | Différenciation |
|--------|--------|-----------------|
| /nuisibles/cafards/ | /desinsectisation/cafards/ | IDENTIFICATION ≠ SERVICE (intervention) |
| /nuisibles/punaises-de-lit/ | /desinsectisation/punaises-de-lit/ | IDENTIFICATION ≠ MÉTHODES TRAITEMENT |
| /nuisibles/rats/ | /deratisation/ | L'ANIMAL ≠ LE SERVICE |
| /desinsectisation/punaises-de-lit/ | /conseils/se-debarrasser-punaises/ | SERVICE PRO ≠ DIY |
| /conseils/formation-haccp/ | /conseils/certification-haccp/ | PROCESSUS ≠ DOCUMENT |

### Inter-arbres (particulier vs pro)

| Particulier | Pro | Pourquoi pas duplicate |
|---|---|---|
| /deratisation/ | /professionnel/deratisation/ | Argumentaire, CTA, témoignages, questions couvertes = tout est différent |
| /deratisation/lyon/ | /professionnel/deratisation/lyon/ | Intro, avis, données locales, angle = différents |
| /desinsectisation/punaises-de-lit/ | /professionnel/desinsectisation/punaises-de-lit/ | Urgence/prix vs protocole hôtel/conformité |

### Inter-villes (pages géo)

- Minimum 30% contenu unique par ville
- Variables dynamiques dans les zones paramétrées
- Canonical self-referencing
- Pas de copier-coller inter-villes

---

## 16. Récapitulatif

| Section | Pages Part. | Pages Pro | Partagées | Total |
|---------|------------|-----------|-----------|-------|
| Homepages | 1 | 1 | — | 2 |
| Nuisibles | — | — | ~20 | 20 |
| Services | ~15 | ~15 | — | 30 |
| Géo (top 20 villes) | ~60 | ~60 | — | 120 |
| Géo (top 100 villes) | ~300 | ~300 | — | 600 |
| Secteurs B2B | — | ~15 | — | 15 |
| Conseils/Blog | — | — | ~25 | 25 |
| Urgence SEA | — | — | ~10 | 10 |
| Institutionnel | — | — | ~5 | 5 |
| Conversion | 1 | 1 | 1 (merci) | 3 |
| **TOTAL (top 20 villes)** | **~77** | **~92** | **~61** | **~230** |
| **TOTAL (top 100 villes)** | **~317** | **~332** | **~61** | **~710** |

**Volume KW cumulé estimé** : ~120 000+ requêtes/mois (hors volumes géo programmatiques).

# Schéma Notion — Pipeline `publish-article-sanalia`

> Référence des champs requis dans la base Notion qui pilote le workflow de publication automatique des articles de blog Sanalia.

## Identifiants

| Élément | Valeur |
|---|---|
| Notion data source ID | `4fc6d199-2674-494a-8959-ba1008034526` |
| ChatSEO site ID | `360b07f1-8f98-4035-8e5e-6d55d7a1285a` |
| GitHub repo | `valentin-nocodefactory/sanalia` |
| Cloudflare Pages project | `sanalia` |
| Domaine prod | `https://www.sanalia.fr` |

## Champs requis dans la base Notion

| Nom (libellé exact) | Type | Valeurs / Format | Rôle |
|---|---|---|---|
| **Titre** | title | texte libre | H1 de l'article + base du slug si `URL cible` vide |
| **Statut** | select | `Next up` · `In progress` · `À valider` · `Validé` · `Publié` · `Error` ⚠️ (pas "Erreur" — c'est la valeur exacte de l'option select) | Pilote le workflow (cf. machine d'état ci-dessous) |
| **Mot-clé principal** | text | ex: `se débarrasser des rats appartement` | Cible SEO + anti-cannibalisation grep |
| **Angle / Notes** | text long | brief éditorial | Passé tel quel à ChatSEO |
| **Catégorie** | select | `rats-souris` · `punaises-de-lit` · `cafards-insectes` · `guepes-frelons` · `prevention` | Cluster éditorial visible (RSS, filtre hub) |
| **Intent** | select | `informational` · `transactional` · `urgency` · `prevention` · `regulatory` (lowercase EN) | Mappe sur `data-variant` des 3 CTAs inline |
| **Temps de lecture (min)** | number | entier 3-15 | Affiché dans `.blog-hero-meta` |
| **Date de parution** | date | `YYYY-MM-DD` | Filtre quotidien (`<=today`) + `datePublished` JSON-LD |
| **URL cible** | URL | `https://www.sanalia.fr/blog/<slug>/` | Canonical + dérive le slug (entre `/blog/` et `/` final). Si vide → fallback kebab du Titre. |
| **PR GitHub** | URL | rempli par le skill | Lien vers la PR draft |
| **URL preview Cloudflare** | URL | rempli par le skill | Lien `<branch-alias>.sanalia.pages.dev` |
| **URL prod** | URL | rempli après merge | URL canonique en production |
| **Erreur** | text long | rempli par le skill si abort | Diagnostic court (< 500 chars) |

## Machine d'état du Statut

```
Next up        ← tu remplis le brief, tu fixes Date de parution
   │
   │  cron 7h détecte 'Next up' du jour
   ▼
In progress    ← skill lock (anti-double-run)
   │
   │  ChatSEO + Recraft + assemble HTML + push branche + PR draft + URL preview
   ▼
À valider      ← skill met PR GitHub + URL preview Cloudflare + envoie Slack
   │
   │  TU REVIEWS la preview Cloudflare ; si OK :
   │
   ▼
Validé         ← tu changes manuellement (déclencheur humain du merge)
   │
   │  cron 15 min (7h-22h) détecte 'Validé' → gh pr merge --squash
   ▼
Publié         ← Cloudflare auto-déploie main ; skill met URL prod + Slack notif

(Error)        ← si abort à n'importe quel stade ; champ Erreur rempli ; tu corriges + repasses à Next up
```

## Mappings appliqués par le skill

### Intent → `data-variant` des CTAs inline (à 25 / 50 / 80 %)

| Intent Notion | `data-variant` | Libellé CTA |
|---|---|---|
| `informational` | `devis` | « Obtenir un devis gratuit » |
| `prevention` | `devis` | « Obtenir un devis gratuit » |
| `urgency` | `urgence` | « Intervention sous 4h — Appeler maintenant » |
| `transactional` | `urgence` | « Intervention sous 4h — Appeler maintenant » |
| `regulatory` | `guide` | « Télécharger le guide PDF » |

### Nuisible parent → tag pastel + picto + breadcrumb

⚠️ **`Nuisible parent` n'est PAS un champ Notion** — il n'existe pas dans le
schéma de cette base (colonne absente, confirmé par une requête SQL qui
échoue avec `no such column`). Le skill ne le lit ni ne l'écrit jamais sur
Notion. C'est l'orchestrateur (Claude) qui le **déduit automatiquement** à
l'Étape 1 à partir de `Titre` / `Mot-clé principal` / `Angle / Notes`, en
matchant le nuisible mentionné contre les clés ci-dessous. Si aucun nuisible
précis ne ressort (article transverse), `parentNuisible` reste `null` — cas
normal, pas une erreur.

| Slug | Classe tag | Picto (`/assets/nuisibles/`) | Nom affiché |
|---|---|---|---|
| `rats` | `tag-rats` | `brown-rat--realistic-body-shape--long-tail--pointe.png` | Rats |
| `souris` | `tag-souris` | `house-mouse--mus-musculus--realistic-body-shape--l.png` | Souris |
| `punaises-de-lit` | `tag-punaises` | `bed-bug--cimex-lectularius--realistic-body-shape--.png` | Punaises de lit |
| `cafards` | `tag-cafards` | `cockroach--realistic-body-shape--flat-oval-body--l.png` | Cafards |
| `guepes` | `tag-guepes` | `european-wasp--vespula-vulgaris--realistic-body-sh.png` | Guêpes |
| `fourmis` | `tag-fourmis` | `black-garden-ant--lasius-niger--realistic-body-sha.png` | Fourmis |
| `moustiques` | `tag-moustiques` | `common-mosquito--culex-pipiens--realistic-body-sha.png` | Moustiques |
| `pigeons` | `tag-pigeons` | `feral-pigeon--columba-livia--realistic-body-shape-.png` | Pigeons |
| *(vide)* | `tag-prevention` | 🛡️ (emoji) | — (breadcrumb 3 niveaux) |

## Notes opérationnelles

- **`Nuisible parent`** : pas un champ Notion à créer — voir section ci-dessus,
  déduit par l'IA à chaque run.
- **`Statut`** : les valeurs réelles de l'option select sont `Next up` ·
  `In progress` · `À valider` · `Validé` · `Publié` · `Error` (en anglais,
  PAS `Erreur` — un write avec `Erreur` échoue avec `validation_error`).
- **`Date de parution`** : en pratique quasi jamais renseignée sur cette
  base. Le skill ne doit pas traiter ça comme "pipeline vide" — cf. Étape 1
  du SKILL.md pour le fallback (tri par `createdTime`).
- **`Intent`** : doit contenir les 5 valeurs en lowercase EN
  (`informational` · `transactional` · `urgency` · `prevention` ·
  `regulatory`). À vérifier si le skill signale une valeur invalide.

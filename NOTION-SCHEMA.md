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
| **Statut** | select | `Next up` · `In progress` · `À valider` · `Validé` · `Publié` · `Erreur` | Pilote le workflow (cf. machine d'état ci-dessous) |
| **Mot-clé principal** | text | ex: `se débarrasser des rats appartement` | Cible SEO + anti-cannibalisation grep |
| **Angle / Notes** | text long | brief éditorial | Passé tel quel à ChatSEO |
| **Catégorie** | select | `rats-souris` · `punaises-de-lit` · `cafards-insectes` · `guepes-frelons` · `prevention` | Cluster éditorial visible (RSS, filtre hub) |
| **Nuisible parent** ⚠️ À AJOUTER | select | `rats` · `souris` · `punaises-de-lit` · `cafards` · `fourmis` · `guepes` · `moustiques` · `pigeons` · `taupes` · `puces` · *(vide pour transverse)* | Slug fiche `/nuisibles/<slug>/` — pilote breadcrumb position 3, tag pastel `.tag-<nuisible>`, picto, 1 des 3 cartes related |
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

(Erreur)       ← si abort à n'importe quel stade ; champ Erreur rempli ; tu corriges + repasses à Next up
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

## Action manuelle à faire **une seule fois** dans Notion

1. Ouvrir la base de données dont l'ID est `4fc6d199-2674-494a-8959-ba1008034526`.
2. **Ajouter le champ** `Nuisible parent` (type select) si absent, et y créer les options listées ci-dessus.
3. **Vérifier le champ `Statut`** : doit contenir exactement les 6 valeurs `Next up` · `In progress` · `À valider` · `Validé` · `Publié` · `Erreur` (accents inclus). Ajouter celles qui manquent.
4. **Vérifier le champ `Intent`** : doit contenir exactement les 5 valeurs en lowercase EN (`informational` · `transactional` · `urgency` · `prevention` · `regulatory`). Ajouter celles qui manquent.
5. **Renseigner `Nuisible parent`** sur tous les articles existants en `Next up` avant le 1er run du cron, sinon le skill retournera `Erreur` faute de breadcrumb valide.

> ⚠️ Tant que le champ `Nuisible parent` n'existe pas en Notion, la 1ère routine échouera à l'étape de fetch. Le skill abort avec `Erreur` et alerte Slack.

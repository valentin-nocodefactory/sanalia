---
name: publish-article-sanalia
description: >
  Publie un article du blog Sanalia depuis Notion en mode preview. Récupère
  l'article au statut "Next up" du jour, fait rédiger par ChatSEO en JSON
  structuré, génère les visuels via Recraft, assemble le HTML dans le template
  Sanalia, push sur une branche claude/draft/<slug>, ouvre une PR draft et
  envoie le lien preview Cloudflare sur Slack. Met à jour Notion en "À valider".
  Invoqué quotidiennement par la routine cron sanalia-publish-daily.
user-invokable: true
argument-hint: "(aucun argument — lit Notion)"
license: MIT
---

# publish-article-sanalia

Skill orchestrateur du pipeline de publication automatique d'articles de blog
Sanalia. Lit Notion, fait rédiger par ChatSEO, génère les visuels Recraft,
assemble le HTML dans le template canonique du repo, push une branche draft,
ouvre une PR et alerte Slack.

## Pré-requis

- Working directory : racine du repo Sanalia
- `SLACK_WEBHOOK_URL` disponible dans l'environnement
- `gh` CLI authentifié sur `valentin-nocodefactory/sanalia`
- MCP Notion connecté avec accès à la data source `4fc6d199-2674-494a-8959-ba1008034526`
- MCP ChatSEO connecté avec accès au site `360b07f1-8f98-4035-8e5e-6d55d7a1285a`
- MCP Recraft connecté
- Python 3 + PyYAML installé (`pip3 install pyyaml`)

## Constantes

Toutes les constantes (IDs, paths, mappings) sont dans
`.claude/skills/publish-article-sanalia/CONFIG.yaml`. Lire ce fichier **avant**
toute action.

Outils Python du skill (chemins relatifs depuis la racine repo) :
- `.claude/skills/publish-article-sanalia/scripts/slugify.py`
- `.claude/skills/publish-article-sanalia/scripts/anti_cannib_check.py`
- `.claude/skills/publish-article-sanalia/scripts/assemble_html.py`
- `.claude/skills/publish-article-sanalia/scripts/update_indexes.py`
- `.claude/skills/publish-article-sanalia/scripts/notify_slack.py`

Template : `.claude/skills/publish-article-sanalia/templates/article-skeleton.html`

## Workflow — 9 étapes

### Étape 0 — Init & sanity checks

1. Vérifier qu'on est dans le repo Sanalia (`git rev-parse --show-toplevel` →
   doit contenir `Sanalia Deratisation`).
2. `git status` : working tree doit être clean. Sinon, abort avec message
   explicite "Working tree sale, refus de polluer un draft".
3. `git fetch origin && git checkout main && git pull origin main`. Toute la
   suite part de `main` à jour.
4. Charger CONFIG.yaml.

### Étape 1 — Récupérer l'article "Next up" du jour depuis Notion

Via MCP Notion (tools `mcp__*__notion-*`), query la data source
`4fc6d199-2674-494a-8959-ba1008034526` :
- Filtre : `Statut = "Next up"` ET `Date de parution <= today`
- Tri : `Date de parution` ASC
- Limite : 1

**Si vide** : envoyer une alerte Slack pour prévenir que le pipeline est vide
(le user doit ajouter un brief dans Notion), puis exit 0.

```bash
python3 .claude/skills/publish-article-sanalia/scripts/notify_slack.py \
  --template empty_pipeline \
  --vars "$(python3 -c 'import json,datetime; print(json.dumps({"today": datetime.date.today().isoformat(), "notion_url": "https://www.notion.so/7cf0a638f2a34caeabc023ed7d4e8481"}))')"
```

Puis log "Aucun article Next up aujourd'hui, alerte Slack envoyée" et exit 0.

**Si trouvé** : extraire les champs (cf. NOTION-SCHEMA.md) :
- `Titre`, `Mot-clé principal`, `Angle / Notes`, `Catégorie`,
  `Nuisible parent`, `Intent`, `Temps de lecture (min)`, `Date de parution`,
  `URL cible`, `notion_page_id`, `notion_page_url`

**Validations** :
- `Nuisible parent` doit être présent et exister dans
  `CONFIG.parent_nuisible_map`. Sinon → étape Erreur avec
  "Nuisible parent absent ou invalide".
- `Intent` doit être l'une des 5 valeurs (informational, transactional,
  urgency, prevention, regulatory). Sinon → étape Erreur.

### Étape 2 — Lock anti-double-run

Immédiatement passer le statut Notion en `In progress`
(`mcp__*__notion-update-page`). Si ce write échoue → étape Erreur (sans toucher
au statut, vu qu'on a pas pu le changer).

Stocker `notion_page_id` et `notion_page_url` pour la suite.

### Étape 3 — Slug & anti-cannibalisation

1. Calculer le slug :
   ```
   python3 .claude/skills/publish-article-sanalia/scripts/slugify.py "<Titre>"
   ```
   Si `URL cible` est non vide, extraire le slug depuis l'URL (entre `/blog/`
   et `/` final) à la place. C'est le `slug_from_url` du script (mode importé).

2. Anti-cannibalisation :
   ```
   python3 .claude/skills/publish-article-sanalia/scripts/anti_cannib_check.py \
     "<Mot-clé principal>" "<slug>" "$(pwd)"
   ```
   Si exit code ≠ 0 → étape Erreur avec le `reason` retourné par le script.

### Étape 4 — Générer le contenu via ChatSEO

ChatSEO est un agent SEO autonome qui fait sa propre recherche SERP, identifie
les bonnes structures pour le mot-clé, et écrit l'article. **Ne lui dicte pas
le format** — laisse-le faire son métier. Le pipeline post-traite ensuite
le HTML reçu (classes Sanalia, CTAs, internal-link-cards, etc.).

Appel MCP ChatSEO `send_message` avec `siteId =
360b07f1-8f98-4035-8e5e-6d55d7a1285a` et ce prompt **minimaliste** :

```
Rédige un article SEO optimisé pour ranker sur "<Mot-clé principal>" sur le
blog Sanalia (entreprise de dératisation / désinsectisation à Lyon et Paris).

Intent de recherche : <Intent>
Angle éditorial : <Angle / Notes>
Ton : rassurant, factuel, jamais anxiogène — lecteur stressé par un problème
de nuisibles.

Réponds uniquement avec un objet JSON :

{
  "title": "H1 complet",
  "metaTitle": "<= 60 caractères",
  "metaDescription": "120-155 caractères",
  "heroSubtitle": "1-2 phrases d'accroche sous le H1",
  "articleHtml": "Le corps de l'article en HTML sémantique propre. H2 numérotés avec id='ancre-kebab'. Pas de <h1>. Pas de section FAQ ici. Utilise les éléments HTML qui te semblent les plus pertinents pour le sujet (tableaux, listes, encadrés, paragraphes, figures, etc.).",
  "faq": [{"q": "...", "a": "..."}]
}

Pas de markdown autour, juste le JSON.
```

C'est tout. ChatSEO :
- choisit la longueur et la structure adaptées au mot-clé,
- sourcera ce qu'il faut sourcer,
- variera tableau/listes/encadrés selon ce qui marche pour ranker.

#### Post-réception : calcul des champs dérivés (côté orchestrateur)

ChatSEO retourne 6 champs. Le skill ajoute les champs nécessaires à
`assemble_html.py` en les déduisant :

| Champ | Calcul |
|---|---|
| `parentNuisible` | Champ Notion `Nuisible parent` (ou fallback dérivé de `Catégorie`) |
| `intentType` | Champ Notion `Intent` (lowercase EN) |
| `breadcrumbLabel` | Tronque `title` à 50 chars (couper sur le dernier mot complet) |
| `publishedAt` | `Date de parution` Notion (ou aujourd'hui si vide) |
| `modifiedAt` | Aujourd'hui (ISO) |
| `wordCount` | `len(re.sub(r"<[^>]+>", " ", articleHtml).split())` — décompte des mots après strip HTML |
| `readingTimeMin` | `max(1, round(wordCount / 220))` — environ 220 mots/minute |
| `heroImage` | `{filename: "hero.webp", alt: "<title>", caption: "<title>", prompt: "Editorial illustration of <topic-EN>, soft natural light, no people, warm cream + sage green palette, no text"}` (prompt EN dérivé du mot-clé via Claude) |
| `ctaInserts` | 3 positions sur les H2 (extraits via regex), aux indices `round(0.25*N)`, `round(0.5*N)`, `round(0.8*N)` (0-indexed, N = nb H2). Variant mappé via `CONFIG.intent_to_cta_variant`. Pour `urgency`/`transactional` : 2 sur 3 en `urgence`, 1 en `devis`. Pour `regulatory` : tous en `guide`. Sinon : tous en `devis`. |
| `related` | Si tu connais un article connexe pertinent du `/blog/`, propose-le. Sinon `{url: "/blog/", title: "Voir tous les articles du blog Sanalia", category: "Blog", readingTime: "Hub articles"}`. |

Sauvegarder le JSON enrichi dans `/tmp/chatseo-output-<slug>.json`.

#### Validations

- `wordCount` ≥ 800 sinon retry 1× avec "Article trop court : vise N mots."
- 5 ≤ nb de `<h2 ` dans `articleHtml` ≤ 12, sinon retry.
- 6 ≤ `len(faq)` ≤ 8, sinon retry.
- Parsing JSON échoue → retry 1× avec "Réponds UNIQUEMENT en JSON valide."
- Si tout retry échoue → étape Erreur.

### Étape 4bis — Injecter les internal-link-cards (orchestrateur Claude)

Le transformer Python `transform_semantic_to_sanalia()` (intégré à
`assemble_html.py`) applique automatiquement :
- `<table>` (avec thead) → `.comparison-table` wrappé dans `.comparison-table-wrap`
- `<ol>` strong-led → `.steps-list`
- `<aside>` → `.callout callout-{did-you-know|warning|danger|tip}` selon contenu

**Ce que le transformer NE FAIT PAS — à toi de l'ajouter dans `articleHtml`
avant l'appel à `assemble_html.py`** : 2 cartes `.internal-link-card` de
maillage interne. Place chaque carte à un endroit logique : la 1ère vers le
milieu de l'article (transition vers la fiche complète du nuisible) et la
2ème en fin (transition vers le service correspondant).

Pattern HTML à insérer dans `articleHtml` (à un emplacement pertinent, entre
deux blocs sémantiques) :

```html
<a href="/nuisibles/<parent_nuisible_url_slug>/" class="internal-link-card">
  <div class="internal-link-card-icon"><EMOJI></div>
  <div class="internal-link-card-body">
    <div class="internal-link-card-label">FICHE COMPLÈTE</div>
    <div class="internal-link-card-title">Tout savoir sur les <NUISIBLE> : biologie, comportement, risques</div>
    <div class="internal-link-card-desc">Schémas interactifs, simulateur de prolifération, carte des zones à risque.</div>
  </div>
  <div class="internal-link-card-arrow">→</div>
</a>
```

Et juste avant la dernière `<h2>` de `articleHtml` :

```html
<a href="/<service>/<parent_nuisible_url_slug>/" class="internal-link-card">
  <div class="internal-link-card-icon">📍</div>
  <div class="internal-link-card-body">
    <div class="internal-link-card-label">INTERVENTION LOCALE</div>
    <div class="internal-link-card-title"><Action> à Lyon et Paris</div>
    <div class="internal-link-card-desc">Technicien Certibiocide, intervention sous 24 h, garantie résultat.</div>
  </div>
  <div class="internal-link-card-arrow">→</div>
</a>
```

Mapping emoji ↔ nuisible : 🐀 rats · 🐭 souris · 🐝 guêpes · 🪳 cafards ·
🐜 fourmis · 🦟 moustiques · 🛏️ punaises-de-lit · 🕊️ pigeons · 📍 localisation.

Mapping service : rats/souris → `/deratisation/<slug>/` ; tous les insectes
et hyménoptères → `/desinsectisation/<slug>/`. Le slug doit être le `url_slug`
du `parent_nuisible_map` dans CONFIG.yaml (ex : `guepes` → `guepes-frelons`).

Si tu connais un article connexe pertinent du blog Sanalia, tu peux ajouter
une 3ème card avec `INTERVENTION LOCALE → ARTICLE LIÉ` (label) — mais reste à
2 cards si rien de pertinent ne te vient.

> Note : `assemble_html.py` détecte automatiquement le mode (HTML si
> `articleHtml` présent, JSON legacy si `sections` présent à la place) et
> applique `transform_semantic_to_sanalia()` sur `articleHtml` avant
> assemblage. Si tu fournis du HTML déjà classé Sanalia (ex : ré-traitement
> d'un article), passe `skipTransform: true` dans le JSON pour bypasser.

Récupérer la réponse. Parser le JSON :
- Si parsing échoue → retry 1× avec ajout en tête du prompt "PREVIOUS RESPONSE
  WAS NOT VALID JSON, RESTART AND PRODUCE ONLY JSON.".
- Si toujours invalide → étape Erreur "ChatSEO JSON invalide après retry".

Validation du JSON :
- `wordCount` ≥ 800. Sinon retry 1× avec "PREVIOUS WORDCOUNT WAS TOO LOW. AIM
  FOR <target>+ WORDS.".
- 5 ≤ `len(sections)` ≤ 10.
- 6 ≤ `len(faq)` ≤ 8.
- `len(ctaInserts) == 3`.
- 1 ≤ images totales (hero + sections avec image) ≤ 5.

Sauvegarder le JSON dans `/tmp/chatseo-output-<slug>.json`.

### Étape 5 — Générer les images via Recraft

Pour chaque brief image (hero + images de sections) :

1. Construire le prompt final : `<prompt JSON> + <CONFIG.recraft.prompt_suffix>`
2. Appel MCP Recraft `generate_image` :
   - `prompt` = prompt final
   - `model` = `recraftv3` (cf. CONFIG.recraft.hero_model / inline_model)
   - `style` = `editorial_illustration`
   - `image_size` = `1820x1024` pour hero, `1456x816` pour images de section
   - `n` = 1
3. Récupérer l'URL de l'image et la télécharger :
   ```
   mkdir -p assets/blog/<slug>/
   curl -L "<recraft_url>" -o "assets/blog/<slug>/<filename>"
   ```
4. Vérifier `stat -f%z` du fichier > 10000 octets. Sinon retry 1×.
5. Si la 1ère tentative échoue → retry avec prompt simplifié (retirer 30% des
   adjectifs). Si 2ème échec : pour la hero c'est bloquant (abort), pour une
   image de section on continue sans (mais on log un warning).

Garde-fou : au moins la hero doit avoir réussi. Sinon → étape Erreur.

### Étape 6 — Assembler le HTML

```
python3 .claude/skills/publish-article-sanalia/scripts/assemble_html.py \
  --json /tmp/chatseo-output-<slug>.json \
  --slug <slug> \
  --config .claude/skills/publish-article-sanalia/CONFIG.yaml \
  --output blog/<slug>/index.html
```

Le script va échouer si un slot reste non remplacé (sanity check intégré). Si
échec → étape Erreur avec le détail des slots manquants.

### Étape 7 — Mettre à jour les index

```
python3 .claude/skills/publish-article-sanalia/scripts/update_indexes.py \
  --slug <slug> \
  --title "<title>" \
  --title-short "<titre court pour fiche nuisible>" \
  --description "<metaDescription>" \
  --published <publishedAt> \
  --category <Catégorie slug : rats-souris | punaises-de-lit | cafards-insectes | guepes-frelons | prevention> \
  --reading-time <readingTimeMin> \
  --parent-nuisible-slug <url_slug de la fiche nuisible, ex: guepes-frelons> \
  --intent <intentType> \
  --hero-filename <nom du fichier hero, ex: hero.svg> \
  --repo-root "$(pwd)"
```

Effets :
- `sitemap-blog.xml` : ajout `<url>` priority 0.7, monthly
- `sitemap-index.xml` : bump `<lastmod>` de l'entrée sitemap-blog
- `blog/feed.xml` : ajout `<item>` en tête + refresh `<lastBuildDate>`
- `blog/index.html` : insertion d'une carte `<article class="card-article">` après le marqueur `<!-- Articles secondaires -->`
- `nuisibles/<parent_nuisible_slug>/index.html` : remplacement de l'item position 01 de la section "À lire aussi" (si placeholder pointant vers `/blog/`), ou insertion en tête sinon

Le `--parent-nuisible-slug` est l'`url_slug` du mapping `parent_nuisible_map` dans CONFIG.yaml (peut différer de la clé Notion : ex `guepes` → `guepes-frelons`).

### Étape 8 — Build, commit, push, PR

```bash
# Inline les composants header/footer/etc.
./build.sh

# Créer la branche depuis main
BRANCH="claude/draft/<slug>"
git checkout -b "$BRANCH"

# Stage uniquement les fichiers touchés
git add "blog/<slug>/index.html"
git add "assets/blog/<slug>/"
git add sitemap-blog.xml sitemap-index.xml blog/feed.xml blog/index.html

# Commit
git commit -m "$(cat <<'EOF'
feat(blog): draft <title>

Article généré automatiquement par publish-article-sanalia.
- Mot-clé cible : <Mot-clé principal>
- Catégorie : <Catégorie>
- Intent : <Intent>
- Notion : <notion_page_url>

À valider sur la preview Cloudflare avant merge.
EOF
)"

# Push
git push -u origin "$BRANCH"

# PR draft
PR_URL=$(gh pr create \
  --draft \
  --base main \
  --head "$BRANCH" \
  --title "Draft: <title>" \
  --body "$(cat <<'EOF'
Article généré automatiquement par **publish-article-sanalia-daily**.

## Checklist de validation
- [ ] Contenu factuel et cohérent avec l'angle Notion
- [ ] 3 CTAs inline présents et adaptés à l'intent
- [ ] Visuels pertinents (1 hero + 2-4 illustrations)
- [ ] FAQ alignée HTML ↔ JSON-LD
- [ ] Breadcrumb position 3 → /nuisibles/<parent>/ correct
- [ ] Pas d'hallucination dans les chiffres/sources
- [ ] Preview Cloudflare OK
- [ ] Aucune cannibalisation avec une page existante

📌 Notion : <notion_page_url>
🎯 Mot-clé cible : <Mot-clé principal>
📂 Catégorie : <Catégorie>
🏷️ Nuisible parent : <Nuisible parent>

Quand tu valides, change le statut Notion en **Validé** — la routine
`sanalia-merge-validated` mergera la PR dans les 15 minutes.
EOF
)")

# Revenir sur main (laisse la branche distante intacte)
git checkout main
```

### Étape 9 — Récupérer l'URL preview Cloudflare + update Notion + Slack

1. Récupérer l'URL preview canonique. Tentative en 2 temps :
   - Construire l'URL par défaut :
     `https://claude-draft-<slug-sans-slashes>.sanalia.pages.dev`
     (les `/` du nom de branche sont remplacés par `-`)
   - Poll 6× toutes les 10s pour récupérer l'URL canonique depuis le commentaire
     du bot Cloudflare sur la PR :
     ```
     gh pr view <BRANCH> --json comments \
       -q '.comments[] | select(.author.login | contains("cloudflare")) | .body' \
       | grep -oE 'https://[a-z0-9-]+\.sanalia\.pages\.dev' | head -1
     ```
   - Si récupérée → utiliser cette URL. Sinon → utiliser l'URL par défaut
     construite ci-dessus.

2. Update Notion via MCP `notion-update-page` :
   - `Statut` → `À valider`
   - `PR GitHub` → `<PR_URL>`
   - `URL preview Cloudflare` → `<PREVIEW_URL>`

3. Slack :
   ```
   python3 .claude/skills/publish-article-sanalia/scripts/notify_slack.py \
     --template draft \
     --vars '{"title":"<title>","keyword":"<kw>","preview_url":"<preview>","pr_url":"<pr>","notion_url":"<notion>"}'
   ```

4. Log final : `✅ Article prêt à valider : <PREVIEW_URL>`.

## Gestion d'erreur (étape Erreur)

À chaque échec :

1. Logger la cause en clair (étape, message, stack si possible).
2. Update Notion : `Statut` → `Erreur`, `Erreur` → `[étape X] <message>` (max
   500 chars).
3. Slack `notify_slack.py --template error --vars '{...}'`.
4. **Ne PAS commit** si l'article est incomplet.
5. Si la branche a déjà été poussée mais qu'on échoue après : laisser la
   branche distante en place (un humain pourra la sauver), et logger un
   warning explicite.
6. Exit code 1.

## Invariants — à ne JAMAIS violer

- Ne JAMAIS push sur `main` directement
- Ne JAMAIS merger la PR (c'est le job de `merge-article-sanalia`)
- Ne JAMAIS publier si `wordCount` < 800
- Ne JAMAIS publier si zéro image (au moins la hero obligatoire)
- Ne JAMAIS écraser un article existant (anti_cannib_check le détecte)
- Ne JAMAIS modifier d'autres fichiers que ceux explicitement listés en
  étape 8
- Ne JAMAIS log le `SLACK_WEBHOOK_URL` ni d'autres secrets
- Ne JAMAIS bypass l'anti-cannibalisation
- Ne JAMAIS prendre l'initiative d'ajouter une page nuisible : si
  `parentNuisible` est absent ou inconnu → étape Erreur

## Logs attendus en sortie

Format clair pour les routines :
```
[publish-article-sanalia] ▶ Démarrage
[publish-article-sanalia] ✓ Étape 1 — Article Notion récupéré : "<title>"
[publish-article-sanalia] ✓ Étape 2 — Statut → In progress
[publish-article-sanalia] ✓ Étape 3 — Slug "<slug>", anti-cannib OK
[publish-article-sanalia] ✓ Étape 4 — ChatSEO JSON OK (N sections, N FAQ, wordCount N)
[publish-article-sanalia] ✓ Étape 5 — N images générées et téléchargées
[publish-article-sanalia] ✓ Étape 6 — HTML assemblé : blog/<slug>/index.html
[publish-article-sanalia] ✓ Étape 7 — Index mis à jour (sitemap, feed, hub)
[publish-article-sanalia] ✓ Étape 8 — Branche claude/draft/<slug> poussée + PR draft #N
[publish-article-sanalia] ✓ Étape 9 — Notion → À valider + Slack envoyé
[publish-article-sanalia] ✅ Article prêt : <PREVIEW_URL>
```

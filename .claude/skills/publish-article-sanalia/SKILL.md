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

### Étape 4 — Générer le contenu via ChatSEO (HTML sémantique pur)

**Séparation des responsabilités** :
- **ChatSEO = expert SEO / sémantique / contenu** → produit un article HTML
  sémantique propre, sans aucune classe CSS Sanalia. C'est son métier.
- **Le skill = expert dev / design system** → applique les classes Sanalia
  via `transform_semantic_to_sanalia()` dans `assemble_html.py`, puis injecte
  les internal-link-cards de maillage interne au bon endroit.

Appel MCP ChatSEO `send_message` avec `siteId =
360b07f1-8f98-4035-8e5e-6d55d7a1285a` et ce prompt **court** :

```
Rédige un article SEO complet pour ranker sur "<Mot-clé principal>" sur le blog
Sanalia (entreprise de dératisation / désinsectisation à Lyon et Paris).

CONTEXTE :
- Catégorie : <Catégorie>
- Nuisible parent : <Nuisible parent>
- Intent : <Intent>
- Angle éditorial : <Angle / Notes>
- Longueur visée : <Temps de lecture × 250> mots environ
- Lecteur cible : particuliers stressés cherchant à résoudre un problème de
  nuisibles. Ton rassurant, factuel, jamais anxiogène.

CONTRAINTES SEO :
- Mot-clé principal dans le H1, le metaTitle (< 60 chars), le metaDescription
  (120-155 chars) et 2-3 H2.
- 5-8 sections H2 numérotées avec ancres kebab-case (id="ancre-kebab").
- 6-8 questions FAQ alignées avec le contenu de l'article.
- Sources officielles citées : ameli.fr, gouv.fr, ARS, DGCCRF, INRS, CS3D,
  ANSES, Santé Publique France, INSERM, Institut Pasteur — selon pertinence.
- Pas de promesses excessives, pas d'allégations médicales non sourcées.

QUALITÉ ÉDITORIALE — varie les éléments HTML pour rendre l'article riche :
- Tableaux comparatifs <table> (avec <thead> + <tbody>) quand tu compares
  espèces, méthodes, doses, options.
- Listes d'étapes <ol><li><strong>Titre étape</strong> Description.</li></ol>
  pour les procédures pas-à-pas (gestes premiers secours, protocole, etc.).
- Encadrés <aside> pour les anecdotes ("Le saviez-vous ?"), précautions
  ("Attention"), urgences ("Danger : appel 15"), astuces ("Conseil pratique").
  Commence chaque <aside> par un <strong> qui annonce la nature de l'encadré.
- Listes <ul> et <ol> classiques pour les énumérations simples.
- <figure>/<figcaption> pour les visuels avec légende.

PRODUIS du HTML sémantique propre. NE METS PAS de classes CSS personnalisées —
le pipeline de post-traitement applique automatiquement les classes du design
system Sanalia (.comparison-table, .steps-list, .callout-*, etc.).

RETOURNE UN JSON valide au schéma suivant — RIEN d'autre, pas de markdown
autour, pas de commentaire :

{
  "title": "string (H1 complet, max 80 chars)",
  "metaTitle": "string (<= 60 chars)",
  "metaDescription": "string (120-155 chars)",
  "heroSubtitle": "string (1-2 phrases rassurantes sous le H1)",
  "breadcrumbLabel": "string (label court breadcrumb position 4, max 50 chars)",
  "parentNuisible": "<Nuisible parent>",
  "intentType": "<Intent>",
  "wordCount": <entier total approximatif>,
  "readingTimeMin": <Temps de lecture (min)>,
  "publishedAt": "<Date de parution YYYY-MM-DD>",
  "modifiedAt": "<aujourd'hui YYYY-MM-DD>",
  "heroImage": {
    "filename": "hero.webp",
    "alt": "string FR (alt descriptif, contient le mot-clé)",
    "caption": "string FR (légende courte)",
    "prompt": "string EN (prompt Recraft pour la hero, editorial, palette sage green + warm cream)"
  },
  "introHtml": "<p>Intro paragraphe 1...</p><p>Intro paragraphe 2...</p>",
  "articleHtml": "<h2 id=\"section-1\">1. Titre</h2><p>...</p><table><thead>...</thead><tbody>...</tbody></table><h2 id=\"section-2\">2. Titre</h2>...",
  "ctaInserts": [
    {"afterSectionIndex": <N>, "variant": "devis|urgence|guide"},
    {"afterSectionIndex": <N>, "variant": "..."},
    {"afterSectionIndex": <N>, "variant": "..."}
  ],
  "faq": [
    {"q": "Question ?", "a": "Réponse 2-4 phrases factuelles."}
  ],
  "related": {
    "url": "/blog/<autre-slug>/",
    "title": "Titre article connexe",
    "category": "Catégorie",
    "readingTime": "9 min"
  }
}

RÈGLES :
- afterSectionIndex 0-indexed sur la liste des H2 dans `articleHtml`.
  Les 3 CTAs aux positions ~25 %, ~50 %, ~80 % du nombre total de sections.
- Variant CTA : informational/prevention → "devis" ; urgency/transactional →
  "urgence" (≥ 2 sur 3) ; regulatory → "guide".
- TOUS les H2 dans `articleHtml` doivent avoir un attribut `id="<ancre-kebab>"`.
- PAS de `<h1>` ni de section "FAQ" dans `articleHtml` (ajoutés en post-process).
- Accents français corrects (é è à ç ù ê ô î…). Pas d'emoji dans le contenu.

Retourne UNIQUEMENT le JSON, rien d'autre.
```

Récupérer la réponse, parser le JSON. En cas d'échec parsing → retry 1× avec
"PREVIOUS RESPONSE WAS NOT VALID JSON, RESTART AND PRODUCE ONLY JSON.".

Validation post-parsing (côté Claude orchestrateur, après que le transformer
Python ait appliqué les classes — cf. étape 4bis) :
- `wordCount` ≥ 800 (retry ChatSEO si moins)
- 5 ≤ nombre de H2 ≤ 10
- 6 ≤ `len(faq)` ≤ 8
- `len(ctaInserts) == 3`
- Au moins 1 `<table>` avec `<thead>`, 1 `<ol>` d'étapes, 2 `<aside>` dans
  `articleHtml`. Si insuffisant, retry 1× avec consigne "Enrichis le contenu :
  ajoute au moins 1 tableau comparatif et 2 encadrés <aside> distincts."

Sauvegarder le JSON dans `/tmp/chatseo-output-<slug>.json`.

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

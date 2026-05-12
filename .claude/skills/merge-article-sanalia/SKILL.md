---
name: merge-article-sanalia
description: >
  Détecte les articles Sanalia au statut Notion "Validé" qui ont une PR draft
  ouverte, les marque "Ready for review" et les mergue en squash sur main.
  Cloudflare Pages auto-déploie la prod. Met ensuite Notion à "Publié" et
  alerte Slack. Invoqué toutes les 15 minutes (7h-22h) par la routine cron
  sanalia-merge-validated.
user-invokable: true
argument-hint: "(aucun argument)"
license: MIT
---

# merge-article-sanalia

Skill compagnon de `publish-article-sanalia`. Boucle la dernière étape du
pipeline : prendre les articles validés humainement dans Notion et merger les
PRs correspondantes pour les publier en prod.

## Pré-requis

- Working directory : racine du repo Sanalia
- `SLACK_WEBHOOK_URL` disponible dans l'environnement
- `gh` CLI authentifié sur `valentin-nocodefactory/sanalia`
- MCP Notion connecté avec accès à la data source `4fc6d199-2674-494a-8959-ba1008034526`

## Constantes

Réutiliser CONFIG.yaml de `publish-article-sanalia` :
`.claude/skills/publish-article-sanalia/CONFIG.yaml`

Script de notification partagé :
`.claude/skills/publish-article-sanalia/scripts/notify_slack.py`

## Workflow — 6 étapes

### Étape 0 — Init

1. `git rev-parse --show-toplevel` → vérifier qu'on est dans le repo Sanalia.
2. `git fetch origin && git checkout main && git pull origin main` (pour avoir
   un état à jour avant les merges).

### Étape 1 — Query Notion : tous les articles "Validé" avec PR

Via MCP Notion, query la data source `4fc6d199-2674-494a-8959-ba1008034526` :
- Filtre : `Statut = "Validé"` ET `PR GitHub` est NOT empty.
- Limite : 10 (en pratique 1-2 par run, mais évite de spammer si retard).

**Si vide** : log "Aucun article Validé à merger" et exit 0.

### Étape 2 — Pour chaque article validé, valider la PR

Pour chaque ligne :

1. Extraire `notion_page_id`, `notion_page_url`, `Titre`, `PR GitHub` (URL),
   `URL cible` (pour récupérer le slug).
2. Extraire le numéro de PR depuis l'URL (`/pull/<N>$` ou `/pull/<N>$`).
3. Vérifier l'état de la PR :
   ```
   gh pr view <N> --json state,isDraft,mergeable,statusCheckRollup,reviewDecision
   ```
   - Si `state != "OPEN"` (ex : déjà mergée ou fermée) → étape 5
     (resync Notion à `Publié` ou ignorer si fermée).
   - Si `mergeable != "MERGEABLE"` → étape Erreur, on saute cet article et on
     update Notion avec un statut d'erreur explicite ("PR avec conflits, à
     résoudre manuellement").
   - Si checks failed (`statusCheckRollup` contient FAIL) → idem, abort cet
     article uniquement.

### Étape 3 — Marquer "Ready for review" et merger

```bash
# Sortir du mode draft
gh pr ready <N>

# Merge squash + delete branch
gh pr merge <N> --squash --delete-branch --subject "feat(blog): <Titre>"
```

Récupérer le SHA du commit de merge sur main :
```
gh pr view <N> --json mergeCommit -q .mergeCommit.oid
```

### Étape 4 — Construire l'URL prod

```
PROD_URL="https://www.sanalia.fr/blog/<slug>/"
```

Le slug se déduit de `URL cible` (extraire entre `/blog/` et `/` final). Si
`URL cible` est vide pour une raison absurde, lire le nom du dossier de
l'article qui vient d'être mergé :
```
gh pr view <N> --json files -q '.files[].path' \
  | grep '^blog/.*/index.html$' | head -1 | cut -d/ -f2
```

### Étape 5 — Update Notion → Publié + URL prod

Via MCP Notion `notion-update-page` :
- `Statut` → `Publié`
- `URL prod` → `<PROD_URL>`

### Étape 6 — Slack notif

```
python3 .claude/skills/publish-article-sanalia/scripts/notify_slack.py \
  --template published \
  --vars '{"title":"<Titre>","prod_url":"<PROD_URL>","notion_url":"<notion_url>"}'
```

Log : `✅ Article publié en prod : <PROD_URL>`

## Cas d'erreur par article

Si une PR n'est pas mergeable :
- Update Notion : `Statut` → `Erreur` (PAS `Validé` pour éviter qu'on rejoue
  la boucle indéfiniment)
- `Erreur` → `PR #<N> non mergeable : <raison>`
- Slack `notify_slack.py --template error`
- Continuer avec les autres articles validés (un article cassé ne doit pas
  bloquer le reste de la liste).

## Invariants

- Ne JAMAIS forcer le merge (`--admin`, `-f`, etc.).
- Ne JAMAIS merger une PR qui n'a pas été créée par
  `publish-article-sanalia-daily` (vérifier que la branche source matche
  `claude/draft/*`).
- Ne JAMAIS toucher aux PRs sans tag Notion "Validé".
- Ne JAMAIS supprimer une branche locale (juste la distante via
  `--delete-branch`).

## Logs attendus

```
[merge-article-sanalia] ▶ Démarrage
[merge-article-sanalia] ✓ Étape 1 — N articles Validé trouvés
[merge-article-sanalia] ▶ Article 1/N : "<Titre>" (PR #<N>)
[merge-article-sanalia] ✓ PR mergeable
[merge-article-sanalia] ✓ Merge OK, commit <SHA>
[merge-article-sanalia] ✓ Notion → Publié, Slack envoyé
[merge-article-sanalia] ✅ N articles publiés
```

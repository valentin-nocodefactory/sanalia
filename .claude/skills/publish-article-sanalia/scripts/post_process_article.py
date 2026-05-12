#!/usr/bin/env python3
"""Post-process un article blog déjà assemblé : applique transform_semantic_to_sanalia
sur le corps `<article class="blog-content blog-body">...</article>` peu importe
comment l'article a été généré.

Idempotent : si les classes Sanalia sont déjà appliquées, ne fait rien.

Utile parce que :
- Quand l'orchestrateur modifie articleHtml après assemble_html.py (par ex.
  pour ajouter des internal-link-cards), les éléments sémantiques natifs
  (<table>, <aside>, <ol>) peuvent perdre leur transformation.
- Cas observé en cron : <table> avec <thead> mais sans .comparison-table
  appliqué → rendu vanilla browser, moche.

Ce script peut être appelé après assemble_html.py et/ou après toute édition
manuelle du fichier final.

Usage :
  python3 post_process_article.py <article-html-path>

Exit 0 = OK (avec ou sans modifications).
Exit 1 = erreur (fichier inexistant, parsing impossible).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Importer les helpers du transformer principal
sys.path.insert(0, str(Path(__file__).parent))
from assemble_html import transform_semantic_to_sanalia  # noqa: E402


ARTICLE_BODY_RE = re.compile(
    r'(<article class="blog-content blog-body"[^>]*>)(.*?)(</article>)',
    re.S,
)


def post_process(path: Path) -> bool:
    """Retourne True si le fichier a été modifié, False sinon."""
    if not path.exists():
        print(f"✗ Fichier introuvable : {path}", file=sys.stderr)
        return False

    html = path.read_text()
    m = ARTICLE_BODY_RE.search(html)
    if not m:
        print(f"✗ <article class='blog-content blog-body'> introuvable dans {path}",
              file=sys.stderr)
        return False

    open_tag, body, close_tag = m.group(1), m.group(2), m.group(3)

    # Stats avant
    before_tables = body.count("comparison-table-wrap")
    before_callouts = body.count("callout-")
    before_steps = body.count("steps-list")

    transformed = transform_semantic_to_sanalia(body)

    # Stats après
    after_tables = transformed.count("comparison-table-wrap")
    after_callouts = transformed.count("callout-")
    after_steps = transformed.count("steps-list")

    delta_tables = after_tables - before_tables
    delta_callouts = after_callouts - before_callouts
    delta_steps = after_steps - before_steps

    if transformed == body:
        print(f"  ↻ Aucune transformation nécessaire ({before_tables} tables, "
              f"{before_callouts} callouts, {before_steps} steps déjà stylés)")
        return False

    new_html = html[: m.start(2)] + transformed + html[m.end(2):]
    path.write_text(new_html)
    print(f"  ✓ Transformations appliquées : +{delta_tables} tables, "
          f"+{delta_callouts} callouts, +{delta_steps} steps")
    return True


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <article-html-path>", file=sys.stderr)
        sys.exit(2)

    path = Path(sys.argv[1])
    print(f"▶ Post-process : {path}")
    ok = post_process(path)
    sys.exit(0 if path.exists() else 1)


if __name__ == "__main__":
    main()

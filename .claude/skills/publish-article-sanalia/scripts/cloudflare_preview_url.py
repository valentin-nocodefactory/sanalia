#!/usr/bin/env python3
"""Calcule l'URL preview Cloudflare Pages d'une branche.

Cloudflare Pages dérive un alias de sous-domaine à partir du nom de branche
puis publie le preview sur `https://<alias>.<projet>.pages.dev`. La règle
de dérivation est :

1. Lowercase
2. Tout caractère non `[a-z0-9]` est remplacé par `-`
3. Plusieurs `-` consécutifs collapsés en un seul
4. Strip leading/trailing `-`
5. Si > 28 caractères → tronqué à 28
6. Re-strip trailing `-` après troncature

Sans cette troncature, la routine de publication construit une URL preview
inexistante pour toute branche dont l'alias dépasse 28 chars, et l'envoie
sur Notion / Slack. Ce module est la source de vérité unique pour ce calcul.
"""
from __future__ import annotations

import re
import sys

CLOUDFLARE_MAX_ALIAS_LEN = 28
DEFAULT_PROJECT = "sanalia"
DEFAULT_ROOT = "pages.dev"


def branch_to_cloudflare_alias(branch: str) -> str:
    """Branch name → Cloudflare Pages subdomain alias.

    Exemples :
      claude/draft/terre-de-diatomee-punaise-de-lit (45 chars)
        → claude-draft-terre-de-diatom (28, tronqué)
      claude/draft/rats-appartement (29 chars une fois normalisé)
        → claude-draft-rats-appartemen (28, tronqué)
      claude/draft/foo
        → claude-draft-foo (16, intact)
      main
        → main
    """
    alias = branch.lower()
    alias = re.sub(r"[^a-z0-9]+", "-", alias)
    alias = alias.strip("-")
    if len(alias) > CLOUDFLARE_MAX_ALIAS_LEN:
        alias = alias[:CLOUDFLARE_MAX_ALIAS_LEN].rstrip("-")
    return alias


def preview_url(
    branch: str,
    project: str = DEFAULT_PROJECT,
    root: str = DEFAULT_ROOT,
) -> str:
    alias = branch_to_cloudflare_alias(branch)
    return f"https://{alias}.{project}.{root}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage: cloudflare_preview_url.py <branch-name> [project=sanalia]",
            file=sys.stderr,
        )
        sys.exit(2)
    branch = sys.argv[1]
    project = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PROJECT
    print(preview_url(branch, project))

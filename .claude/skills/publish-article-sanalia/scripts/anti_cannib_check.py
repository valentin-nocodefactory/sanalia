#!/usr/bin/env python3
"""Vérification anti-cannibalisation SEO avant publication d'un article Sanalia.

Inputs : mot-clé principal + slug visé.
Outputs : OK / ABORT avec diagnostic.

Règles (cf. CLAUDE.md "RÈGLE D'OR ANTI-CANNIBALISATION") :
1. Si une page existante a déjà ce slug → ABORT (collision dossier).
2. Si le mot-clé principal (normalisé) apparaît dans un <title>
   de page indexable existante → ABORT (cible déjà couverte).
3. Si le mot-clé apparaît mot pour mot dans le <h1> d'une page → ABORT.
4. Sinon → OK.

Usage : python3 anti_cannib_check.py "<mot-clé>" "<slug>" "<repo-root>"
"""
from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from pathlib import Path


def normalize(text: str) -> str:
    """Lowercase + retire accents + collapse whitespace."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    # Retire ponctuation
    text = re.sub(r"[^\w\s-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def find_indexable_pages(repo_root: Path) -> list[Path]:
    """Liste toutes les pages index.html publiques (hors backup/private)."""
    pages = []
    for p in repo_root.rglob("index.html"):
        rel = p.relative_to(repo_root)
        rel_str = str(rel)
        # Exclusions
        if rel_str.startswith((".claude/", "components/", "node_modules/")):
            continue
        if "backup" in rel_str or "merci/" in rel_str:
            continue
        # Vérifie absence de noindex
        try:
            head = p.read_text(errors="ignore")[:8000]
        except Exception:
            continue
        if 'name="robots"' in head and "noindex" in head:
            continue
        pages.append(p)
    return pages


def extract_titles_and_h1(page: Path) -> tuple[str, str]:
    """Retourne (title, h1) d'une page HTML."""
    try:
        text = page.read_text(errors="ignore")
    except Exception:
        return "", ""
    t_match = re.search(r"<title>([^<]+)</title>", text)
    h_match = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.S)
    title = t_match.group(1) if t_match else ""
    h1 = re.sub(r"<[^>]+>", "", h_match.group(1)) if h_match else ""
    return title.strip(), h1.strip()


def check(keyword: str, slug: str, repo_root: str) -> dict:
    """Renvoie {'ok': bool, 'reason': str, 'collisions': [...]}"""
    root = Path(repo_root).resolve()
    target_path = root / "blog" / slug / "index.html"

    # 1. Slug collision direct
    if target_path.exists():
        return {
            "ok": False,
            "reason": f"Le slug '{slug}' existe déjà à {target_path.relative_to(root)}",
            "collisions": [str(target_path.relative_to(root))],
        }

    # 2. Recherche fuzzy du KW dans titres/H1
    norm_kw = normalize(keyword)
    # Tokens significatifs (>= 4 chars pour ignorer mots vides)
    kw_tokens = [t for t in norm_kw.split() if len(t) >= 4]
    if len(kw_tokens) < 2:
        # Mot-clé trop court / mono-token, on ne peut pas matcher de manière fiable
        return {"ok": True, "reason": "Mot-clé trop court pour fuzzy match, skip", "collisions": []}

    pages = find_indexable_pages(root)
    collisions = []
    for page in pages:
        title, h1 = extract_titles_and_h1(page)
        norm_title = normalize(title)
        norm_h1 = normalize(h1)

        # Match strict : toutes les significatifs présents dans title ou h1
        title_match = all(tok in norm_title for tok in kw_tokens)
        h1_match = all(tok in norm_h1 for tok in kw_tokens)

        if title_match or h1_match:
            collisions.append({
                "path": str(page.relative_to(root)),
                "title": title,
                "h1": h1,
                "matched_in": "title" if title_match else "h1",
            })

    if collisions:
        return {
            "ok": False,
            "reason": f"Mot-clé '{keyword}' déjà ciblé par {len(collisions)} page(s) existante(s) (cannibalisation SEO)",
            "collisions": collisions,
        }

    return {"ok": True, "reason": "Aucune collision détectée", "collisions": []}


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: anti_cannib_check.py '<keyword>' '<slug>' '<repo-root>'", file=sys.stderr)
        sys.exit(2)
    result = check(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["ok"] else 1)

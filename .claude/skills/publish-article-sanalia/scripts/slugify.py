#!/usr/bin/env python3
"""Helper de slugification pour les articles Sanalia.

Convertit un titre français en slug kebab-case : minuscules, sans accents,
espaces → tirets, ponctuation supprimée, stopwords retirés pour rester
descriptif et < 80 chars.
"""
from __future__ import annotations

import re
import sys
import unicodedata
from urllib.parse import urlparse

# Stopwords français retirés du slug — liste conservatrice qui préserve les
# mots utiles SEO comme "comment", "se", "debarrasser", "prevenir".
# (cf. slugs existants : comment-se-debarrasser-rats-appartement)
STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "du", "de", "et", "ou",
    "a", "au", "aux", "en", "dans", "sur", "par", "avec",
    "ce", "cette", "ces",
    "que", "qui", "dont",
    "est", "sont",
}

MAX_LEN = 80


def remove_accents(text: str) -> str:
    """Décompose les caractères Unicode et retire les diacritiques."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def slugify(text: str, max_len: int = MAX_LEN) -> str:
    """Convertit un texte en slug kebab-case descriptif."""
    text = remove_accents(text).lower()
    # Garde seulement lettres, chiffres et espaces / tirets
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    tokens = [t for t in text.split() if t and t not in STOPWORDS]
    slug = "-".join(tokens)
    slug = re.sub(r"-+", "-", slug).strip("-")
    if len(slug) > max_len:
        # Tronque sur la dernière séparation propre
        slug = slug[:max_len].rsplit("-", 1)[0]
    return slug


def slug_from_url(url: str) -> str | None:
    """Extrait le slug entre /blog/ et / final d'une URL canonique Sanalia."""
    try:
        path = urlparse(url).path  # ex: /blog/mon-slug/
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2 and parts[0] == "blog":
            return parts[-1]
    except Exception:
        return None
    return None


def slug_from_notion_record(record: dict) -> str:
    """Détermine le slug final depuis un record Notion.

    Priorité : URL cible > kebab du Titre.
    """
    url = (record.get("URL cible") or "").strip()
    if url:
        s = slug_from_url(url)
        if s:
            return s
    title = (record.get("Titre") or "").strip()
    if not title:
        raise ValueError("Notion record sans Titre ni URL cible — impossible de slugifier")
    return slugify(title)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: slugify.py '<titre>'", file=sys.stderr)
        sys.exit(2)
    print(slugify(" ".join(sys.argv[1:])))

#!/usr/bin/env python3
"""Extrait le SVG d'un fichier WebFetch (output-file path) et le sauve au chemin
cible. Gère les markdown fences ``` éventuelles ajoutées par WebFetch.

Usage :
  python3 save_svg_from_webfetch.py <webfetch-output-file> <target-svg-path>

Le fichier output WebFetch contient typiquement :
  ```xml
  <svg xmlns="...">
  ...
  </svg>
  ```

Le script :
  1. Lit le fichier source
  2. Strip les lignes de fence markdown (```...``` au début/fin)
  3. Trouve le premier <svg> et le dernier </svg>
  4. Sauve le contenu propre dans le chemin cible

Exit 0 si SVG ≥ 1 ko ET commence par "<svg". Sinon exit 1.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

MIN_SVG_SIZE = 1000  # octets


def extract_svg(text: str) -> str | None:
    """Extrait le <svg>...</svg> d'un texte qui peut contenir des fences markdown."""
    # Strip markdown fences si présentes
    # Cas 1 : ```xml\n<svg...>\n...\n</svg>\n```
    # Cas 2 : ```\n<svg...>\n...\n</svg>\n```
    # Cas 3 : <svg...>...</svg> sans fences
    text = text.strip()

    # Cherche le premier <svg
    svg_start = text.find("<svg")
    if svg_start == -1:
        return None

    # Cherche le dernier </svg>
    svg_end = text.rfind("</svg>")
    if svg_end == -1:
        return None

    svg = text[svg_start : svg_end + len("</svg>")]
    return svg


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <webfetch-output-file> <target-svg-path>", file=sys.stderr)
        sys.exit(2)

    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])

    if not src.exists():
        print(f"✗ Source introuvable : {src}", file=sys.stderr)
        sys.exit(1)

    text = src.read_text()
    svg = extract_svg(text)

    if svg is None:
        print(f"✗ Aucun <svg> trouvé dans {src}", file=sys.stderr)
        sys.exit(1)

    if len(svg) < MIN_SVG_SIZE:
        print(f"✗ SVG trop petit ({len(svg)} octets, min {MIN_SVG_SIZE})", file=sys.stderr)
        sys.exit(1)

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(svg)
    print(f"✓ SVG sauvé : {dst} ({len(svg)} octets)")


if __name__ == "__main__":
    main()

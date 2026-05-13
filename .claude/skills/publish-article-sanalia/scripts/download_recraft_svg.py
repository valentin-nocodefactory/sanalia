#!/usr/bin/env python3
"""Télécharge une URL Recraft (signed) vers un fichier SVG local.

Méthode robuste avec 2 tentatives :
1. `curl -sL -o` — méthode préférée (verbatim, rapide, pas de summarization).
   Nécessite que `img.recraft.ai` soit autorisé dans .claude/settings.json
   (`Bash(curl ...)` patterns).
2. Si curl échoue (taille < 1 ko, contient "Host not in allowlist", ou exit
   code ≠ 0) → exit 1 et le caller doit fallback (WebFetch ou placeholder).

NB : WebFetch n'est PAS utilisé ici parce qu'il SUMMARIZE les longs SVG via
le LLM de processing → on perd les centaines de `<path>`. À utiliser uniquement
en dernier recours et avec validation stricte.

Usage :
  python3 download_recraft_svg.py <recraft-url> <target-svg-path>

Exit 0 si SVG valide téléchargé (≥ 1 ko, commence par <svg, contient </svg>).
Exit 1 sinon.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

MIN_SIZE = 1000  # octets
SANDBOX_ERROR_MARKER = "Host not in allowlist"


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <recraft-url> <target-svg-path>", file=sys.stderr)
        sys.exit(2)

    url, target = sys.argv[1], Path(sys.argv[2])
    target.parent.mkdir(parents=True, exist_ok=True)

    curl = shutil.which("curl")
    if not curl:
        print("✗ curl introuvable dans PATH", file=sys.stderr)
        sys.exit(1)

    cmd = [curl, "-sL", "-o", str(target), "--max-time", "30", url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
    except subprocess.TimeoutExpired:
        print("✗ curl timeout (40 s)", file=sys.stderr)
        sys.exit(1)

    if result.returncode != 0:
        print(f"✗ curl exit code {result.returncode} : {result.stderr[:200]}",
              file=sys.stderr)
        sys.exit(1)

    if not target.exists():
        print(f"✗ Fichier non créé : {target}", file=sys.stderr)
        sys.exit(1)

    size = target.stat().st_size
    if size < MIN_SIZE:
        # Probablement bloqué par sandbox réseau (réponse 21 octets
        # "Host not in allowlist")
        content = target.read_text(errors="replace")
        if SANDBOX_ERROR_MARKER in content:
            print(f"✗ Bloqué par sandbox réseau : {content!r}", file=sys.stderr)
        else:
            print(f"✗ Fichier trop petit ({size} octets) : {content[:200]!r}",
                  file=sys.stderr)
        sys.exit(1)

    # Vérifie que c'est bien un SVG valide
    head = target.read_text(errors="replace")[:200]
    if not head.lstrip().startswith("<svg"):
        print(f"✗ Pas un SVG valide (head : {head[:100]!r})", file=sys.stderr)
        sys.exit(1)

    tail = target.read_text(errors="replace")[-100:]
    if "</svg>" not in tail:
        print(f"✗ SVG tronqué (pas de </svg> à la fin)", file=sys.stderr)
        sys.exit(1)

    print(f"✓ SVG téléchargé via curl : {target} ({size} octets)")
    sys.exit(0)


if __name__ == "__main__":
    main()

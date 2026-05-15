#!/usr/bin/env python3
"""Télécharge une URL Recraft (signed) vers un fichier local — raster OU SVG.

Détecte automatiquement le format selon les magic bytes du fichier reçu et
valide en conséquence :
- SVG : doit commencer par `<svg` et contenir `</svg>`
- PNG : magic bytes `\\x89PNG`
- JPEG : magic bytes `\\xFF\\xD8\\xFF`
- WebP : `RIFF....WEBP`

Le format attendu peut être forcé via le 3ᵉ argument (`svg`, `webp`, `png`,
`jpg`). Si omis, le script accepte n'importe quel format reconnu (utile en
fallback). Si forcé, un mismatch déclenche un exit 1.

Méthode : `curl -sL -o` (verbatim, rapide, pas de summarization LLM).
Nécessite que `img.recraft.ai` soit autorisé dans `.claude/settings.json`.

Usage :
  python3 download_recraft_image.py <recraft-url> <target-path> [expected-format]

Exit 0 si fichier valide téléchargé. Exit 1 sinon (avec log stderr clair).
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

MIN_SIZE = 1000  # octets — en dessous c'est probablement une erreur réseau
SANDBOX_ERROR_MARKER = "Host not in allowlist"

VALID_FORMATS = {"svg", "webp", "png", "jpg", "jpeg"}


def sniff_format(path: Path) -> str | None:
    """Détecte le format réel d'un fichier d'après ses magic bytes."""
    with path.open("rb") as f:
        head = f.read(16)

    if not head:
        return None

    # SVG : texte commençant par `<svg` ou `<?xml` (cas de SVG avec déclaration XML)
    head_text = head.decode("utf-8", errors="ignore").lstrip()
    if head_text.startswith("<svg") or head_text.startswith("<?xml"):
        # Confirme avec un peu plus de contexte si <?xml (pour distinguer d'un XML quelconque)
        if head_text.startswith("<?xml"):
            sample = path.read_text(errors="replace")[:500]
            if "<svg" not in sample:
                return None
        return "svg"

    # PNG : 89 50 4E 47
    if head.startswith(b"\x89PNG"):
        return "png"

    # JPEG : FF D8 FF
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg"

    # WebP : "RIFF....WEBP"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"

    return None


def validate_svg_completeness(path: Path) -> bool:
    """Pour SVG : vérifie que `</svg>` est présent (le fichier n'est pas tronqué)."""
    tail = path.read_text(errors="replace")[-200:]
    return "</svg>" in tail


def main():
    if len(sys.argv) < 3:
        print(
            f"Usage: {sys.argv[0]} <recraft-url> <target-path> [expected-format]",
            file=sys.stderr,
        )
        sys.exit(2)

    url = sys.argv[1]
    target = Path(sys.argv[2])
    expected = sys.argv[3].lower() if len(sys.argv) >= 4 else None

    if expected and expected not in VALID_FORMATS:
        print(
            f"✗ Format attendu invalide : {expected!r}. Valides : {sorted(VALID_FORMATS)}",
            file=sys.stderr,
        )
        sys.exit(2)

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
        print(
            f"✗ curl exit code {result.returncode} : {result.stderr[:200]}",
            file=sys.stderr,
        )
        sys.exit(1)

    if not target.exists():
        print(f"✗ Fichier non créé : {target}", file=sys.stderr)
        sys.exit(1)

    size = target.stat().st_size
    if size < MIN_SIZE:
        # Probablement bloqué par sandbox réseau (réponse 21 octets
        # "Host not in allowlist")
        try:
            content = target.read_text(errors="replace")
        except Exception:
            content = "<binary>"
        if SANDBOX_ERROR_MARKER in content:
            print(f"✗ Bloqué par sandbox réseau : {content!r}", file=sys.stderr)
        else:
            print(
                f"✗ Fichier trop petit ({size} octets) : {content[:200]!r}",
                file=sys.stderr,
            )
        sys.exit(1)

    detected = sniff_format(target)
    if detected is None:
        print(
            f"✗ Format non reconnu (head non SVG/PNG/JPG/WebP). Taille : {size} octets.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Normalise jpeg → jpg pour comparaison
    if detected == "jpeg":
        detected = "jpg"

    if expected:
        expected_norm = "jpg" if expected == "jpeg" else expected
        if detected != expected_norm:
            print(
                f"✗ Format détecté ({detected}) ≠ attendu ({expected_norm}). "
                f"L'URL Recraft retourne probablement le bon format selon "
                f"le style choisi (raster ou vector). Vérifie le mapping "
                f"style↔extension dans CONFIG.yaml.",
                file=sys.stderr,
            )
            sys.exit(1)

    if detected == "svg" and not validate_svg_completeness(target):
        print("✗ SVG tronqué (pas de </svg> à la fin)", file=sys.stderr)
        sys.exit(1)

    print(f"✓ {detected.upper()} téléchargé : {target} ({size} octets)")
    sys.exit(0)


if __name__ == "__main__":
    main()

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


# Regex pour détecter et nettoyer les .internal-link-card cassées par le
# convertisseur markdown :
# - Souvent inséré dans un <p> avec un <br>, </p>, <p> parasites à l'intérieur
# - Le navigateur ferme auto le <p> sur <div> enfant, créant des blocs vides
LINK_CARD_RE = re.compile(
    r'<a\b[^>]*\sclass="internal-link-card"[^>]*>(.*?)</a>',
    re.S | re.I,
)


def _clean_card(match: "re.Match") -> str:
    """Nettoie l'intérieur d'une <a class=internal-link-card>.
    Retire <br>, <p>, </p> parasites et normalise les espaces.
    """
    full = match.group(0)
    inner = match.group(1)
    # Retire tous les <br>, <p>, </p> à l'intérieur
    inner = re.sub(r"<br\s*/?>", "", inner)
    inner = re.sub(r"</?p\s*>", "", inner)
    # Normalise les retours à la ligne multiples
    inner = re.sub(r"\n{2,}", "\n", inner).strip("\n ")
    # Reconstruire avec le <a ...> du match initial
    open_tag = full[: full.index(">") + 1]
    return f'{open_tag}\n{inner}\n</a>'


def unescape_inline_html_in_faq(html: str) -> tuple:
    """Réécrit les balises HTML basiques échappées (&lt;strong&gt; etc.)
    à l'intérieur des .accordion-body-inner de la FAQ. Cause du bug : un
    html_escape en trop dans une ancienne version de assemble_html.py.

    Retourne (html_fixé, n_corrections).
    """
    count = [0]
    tags = ("strong", "em", "b", "i", "code", "a", "br", "span")

    def _fix(match):
        body = match.group(1)
        original = body
        for t in tags:
            body = body.replace(f"&lt;{t}&gt;", f"<{t}>")
            body = body.replace(f"&lt;/{t}&gt;", f"</{t}>")
            # Tag avec attributs : &lt;a href="..."&gt;
            body = re.sub(
                rf'&lt;{t}\s+([^&]*?)&gt;',
                rf'<{t} \1>',
                body,
            )
        if body != original:
            count[0] += 1
        return f'<div class="accordion-body-inner">{body}</div>'

    new_html = re.sub(
        r'<div class="accordion-body-inner">(.*?)</div>',
        _fix,
        html,
        flags=re.S,
    )
    return new_html, count[0]


def fix_link_cards(html: str) -> tuple:
    """Nettoie les .internal-link-card et retire les <p> orphelins qui les
    encadrent. Retourne (html_fixé, n_corrections).
    """
    # Phase 1 : nettoie l'intérieur de chaque card
    cleaned_html = LINK_CARD_RE.sub(_clean_card, html)
    n_inner = len(LINK_CARD_RE.findall(html))  # nombre de cards traitées

    # Phase 2 : retire les <p>...</p> qui n'enveloppent QUE une card
    wrap_re = re.compile(
        r"<p>\s*(<a\b[^>]*\sclass=\"internal-link-card\"[^>]*>.*?</a>)\s*</p>",
        re.S | re.I,
    )
    cleaned_html = wrap_re.sub(lambda m: m.group(1), cleaned_html)

    # Phase 3 : retire les <p> orphelins (ouvert sans </p>) juste avant
    # une card. Pattern : <p>\s*<a class="...">
    orphan_open_re = re.compile(
        r"<p>\s*(<a\b[^>]*\sclass=\"internal-link-card\"[^>]*>)",
        re.S | re.I,
    )
    cleaned_html = orphan_open_re.sub(lambda m: m.group(1), cleaned_html)

    return cleaned_html, n_inner


def check_no_external_images(html: str) -> list:
    """Détecte les <img> hotlinkées sur un CDN externe.
    Retourne la liste des URLs incriminées (vide si tout est local).
    Cf. SKILL.md § 5 — toutes les images doivent vivre sous /assets/blog/<slug>/.
    """
    external_imgs = re.findall(r'<img\b[^>]*\ssrc="(https?://[^"]+)"', html)
    return [u for u in external_imgs if "/assets/" not in u]


def post_process(path: Path) -> bool:
    """Retourne True si le fichier a été modifié, False sinon."""
    if not path.exists():
        print(f"✗ Fichier introuvable : {path}", file=sys.stderr)
        return False

    html = path.read_text()

    # Garde-fou : aucune <img> ne doit pointer vers un CDN externe.
    forbidden = check_no_external_images(html)
    if forbidden:
        print(
            f"✗ <img> externes détectées ({len(forbidden)}): {forbidden[:3]}\n"
            f"  → télécharge ces images via download_recraft_image.py et "
            f"référence-les en /assets/blog/<slug>/...",
            file=sys.stderr,
        )
        sys.exit(1)

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

    # 1. Transform semantic → Sanalia
    transformed = transform_semantic_to_sanalia(body)

    # 2. Fix les internal-link-cards cassées par le converter markdown
    transformed, n_lifted = fix_link_cards(transformed)

    # 3. Fix les &lt;strong&gt; échappés dans la FAQ
    transformed, n_unesc = unescape_inline_html_in_faq(transformed)

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
    msg = f"  ✓ Transformations : +{delta_tables} tables, +{delta_callouts} callouts, +{delta_steps} steps"
    if n_lifted:
        msg += f", {n_lifted} link-card(s) nettoyée(s)"
    if n_unesc:
        msg += f", {n_unesc} FAQ unescape(s)"
    print(msg)
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

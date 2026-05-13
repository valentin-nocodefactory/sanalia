#!/usr/bin/env python3
"""Assemble l'HTML final d'un article Sanalia à partir d'un JSON ChatSEO.

Entrée :
  --json    Chemin vers le JSON ChatSEO (cf. schéma plus bas)
  --slug    Slug de l'article (kebab-case)
  --config  Chemin vers CONFIG.yaml du skill
  --output  Chemin du fichier index.html à écrire (sera créé)

Le script :
  1. Charge la config + le skeleton template
  2. Calcule les valeurs dérivées (URL canonique, dates humaines, etc.)
  3. Génère le HTML du corps d'article (sections + 3 CTAs aux 25/50/80%)
  4. Génère la TOC depuis les anchors de sections
  5. Génère les 3 cartes related (1 article + 1 fiche + 1 hub)
  6. Génère le JSON-LD FAQPage et le BreadcrumbList position 3+4
  7. Remplace tous les {{SLOTS}} et écrit le fichier final

Schéma JSON ChatSEO attendu :
{
  "title": "...",                         # H1 + JSON-LD headline + og:title
  "metaTitle": "...",                     # <title> (<= 60 chars)
  "metaDescription": "...",               # meta description (120-155 chars)
  "heroSubtitle": "...",                  # paragraphe sous H1
  "parentNuisible": "rats|cafards|...",   # slug nuisible parent
  "intentType": "informational|...",      # mappe data-variant CTA
  "wordCount": 2050,                      # entier
  "readingTimeMin": 10,                   # entier minutes
  "publishedAt": "2026-05-12",            # ISO date
  "modifiedAt": "2026-05-12",             # ISO date
  "heroImage": {                          # hero générée par Recraft (Editorial style → SVG)
    "filename": "hero.svg",
    "alt": "Description de la hero"
  },
  "introParagraphs": ["...", "..."],      # paragraphes d'intro (HTML autorisé sans balises externes)
  "sections": [
    {
      "h2": "1. Identifier...",
      "anchor": "identifier",
      "tocLabel": "1. Identifier une infestation",
      "html": "<p>...</p><h3>...</h3>...",  # corps HTML de la section (sans le H2)
      "image": null | { "filename": "...", "alt": "...", "caption": "..." },
      "insertImageAfter": "intro" | "h3-1" | null    # placement de l'image dans la section
    },
    ...
  ],
  "ctaInserts": [                         # 3 placements aux 25/50/80%
    { "afterSectionIndex": 1, "variant": "devis", "titleOverride": null, "descOverride": null },
    { "afterSectionIndex": 3, "variant": "urgence", "titleOverride": null, "descOverride": null },
    { "afterSectionIndex": 5, "variant": "devis", "titleOverride": null, "descOverride": null }
  ],
  "faq": [
    { "q": "...", "a": "..." }, ...       # 6-8 paires
  ],
  "related": {                            # 1 article connexe (les 2 autres sont auto)
    "url": "/blog/...",
    "title": "...",
    "category": "Prévention",
    "readingTime": "9 min"
  }
}
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print("⚠ PyYAML manquant : pip3 install pyyaml", file=sys.stderr)
    sys.exit(2)

FRENCH_MONTHS = {
    1: "janvier", 2: "février", 3: "mars", 4: "avril", 5: "mai", 6: "juin",
    7: "juillet", 8: "août", 9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre",
}


def iso_to_human(iso: str) -> str:
    """2026-05-12 → 12 mai 2026"""
    d = datetime.fromisoformat(iso)
    return f"{d.day} {FRENCH_MONTHS[d.month]} {d.year}"


def html_escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def json_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


# ──────────────────────────────────────────────────────────────────────
# Generators
# ──────────────────────────────────────────────────────────────────────

def gen_cta_inline(variant: str, cfg: dict, idx: int, title_override=None, desc_override=None) -> str:
    """Génère un bloc cta-inline-blog."""
    tpl = cfg["cta_templates"].get(variant, cfg["cta_templates"]["devis"])
    title = title_override or tpl["titles"][idx % len(tpl["titles"])]
    desc = desc_override or tpl["descs"][idx % len(tpl["descs"])]
    return (
        f'<div class="cta-inline-blog" data-variant="{variant}">\n'
        f'  <div class="cta-inline-blog-text">\n'
        f'    <div class="cta-inline-blog-title">{html_escape(title)}</div>\n'
        f'    <div class="cta-inline-blog-desc">{html_escape(desc)}</div>\n'
        f'  </div>\n'
        f'  <a href="{tpl["href"]}" class="btn btn-primary">{html_escape(tpl["button_text"])}</a>\n'
        f'</div>'
    )


def gen_image_figure(slug: str, image: dict) -> str:
    """Génère une <figure> pour une image d'article.

    Source de l'image, par ordre de priorité :
    1. `url` (string) : URL externe directe (https://img.recraft.ai/... etc.)
       — utilisé quand le sandbox cron empêche le download local.
    2. `filename` commençant par http(s):// : idem, traité comme externe.
    3. `filename` simple : /assets/blog/<slug>/<filename> (asset local).
    """
    url = image.get("url", "")
    fn = image.get("filename", "")
    if url and (url.startswith("http://") or url.startswith("https://")):
        src = url
    elif fn.startswith("http://") or fn.startswith("https://"):
        src = fn
    else:
        src = f"/assets/blog/{slug}/{fn}"

    alt = html_escape(image.get("alt", ""))
    caption = image.get("caption", "")
    fig_caption = f'\n  <figcaption>{html_escape(caption)}</figcaption>' if caption else ""
    return (
        f'<figure class="image-figure">\n'
        f'  <img src="{src}" alt="{alt}" loading="lazy" width="1456" height="816">{fig_caption}\n'
        f'</figure>'
    )


def gen_section_html(section: dict, slug: str) -> str:
    """Génère le bloc HTML complet d'une section H2."""
    h2 = html_escape(section["h2"])
    anchor = section["anchor"]
    body = section.get("html", "")
    parts = [f'<h2 id="{anchor}">{h2}</h2>', body]
    # Image en fin de section si fournie
    if section.get("image"):
        parts.append(gen_image_figure(slug, section["image"]))
    return "\n\n".join(parts)


def gen_article_body(data: dict, slug: str, canonical_url: str, cfg: dict) -> str:
    """Génère le contenu complet entre <article> et </article>."""
    parts = []

    # 1. Intro paragraphs
    for p in data.get("introParagraphs", []):
        parts.append(f"<p>{p}</p>")

    # 2. Hero image (figure)
    if data.get("heroImage"):
        parts.append(gen_image_figure(slug, {
            "filename": data["heroImage"]["filename"],
            "alt": data["heroImage"].get("alt", ""),
            "caption": data["heroImage"].get("caption", ""),
        }))

    # 3. Sections avec 3 CTAs intercalés
    sections = data["sections"]
    cta_inserts = data.get("ctaInserts", [])
    cta_by_section_idx = {c["afterSectionIndex"]: c for c in cta_inserts}

    cta_counter = 0
    for idx, sec in enumerate(sections):
        parts.append(gen_section_html(sec, slug))
        if idx in cta_by_section_idx:
            cta = cta_by_section_idx[idx]
            parts.append(gen_cta_inline(
                cta["variant"], cfg, cta_counter,
                title_override=cta.get("titleOverride"),
                desc_override=cta.get("descOverride"),
            ))
            cta_counter += 1

    # 4. FAQ accordion (aligné sur le JSONLD)
    parts.append('<h2 id="faq">Questions fréquentes</h2>')
    accordion_items = []
    for fq in data["faq"]:
        accordion_items.append(
            f'  <div class="accordion-item">\n'
            f'    <button class="accordion-header">{html_escape(fq["q"])} <span class="icon-toggle">+</span></button>\n'
            f'    <div class="accordion-body">\n'
            f'      <div class="accordion-body-inner">{html_escape(fq["a"])}</div>\n'
            f'    </div>\n'
            f'  </div>'
        )
    parts.append(
        '<div class="accordion-list" id="faqAccordion">\n' +
        "\n".join(accordion_items) +
        '\n</div>'
    )

    # 5. CTA final
    parts.append(gen_cta_inline("devis", cfg, cta_counter))

    # 6. Author card
    parts.append(
        '<div class="author-card">\n'
        '  <div class="author-card-avatar">S</div>\n'
        '  <div>\n'
        '    <div class="author-card-name">Équipe Sanalia</div>\n'
        '    <div class="author-card-bio">Collectif de techniciens Certibiocide présent dans les plus grandes villes de France (Paris, Lyon, Marseille, Toulouse, Nice, Bordeaux, Lille, Nantes, Strasbourg, Montpellier). 3 000+ interventions réalisées par an, spécialisés en habitat collectif et restauration. Tous nos contenus sont relus par un référent scientifique.</div>\n'
        '  </div>\n'
        '</div>'
    )

    # 7. Share bar inline (URL canonique sera substituée par {{CANONICAL_URL}})
    parts.append(
        '<div class="share-bar-inline">\n'
        '  <span class="share-bar-inline-label">Partager cet article</span>\n'
        '  <a href="https://twitter.com/intent/tweet?url={{CANONICAL_URL}}" target="_blank" rel="noopener" class="share-bar-btn" aria-label="Partager sur X"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg></a>\n'
        '  <a href="https://www.linkedin.com/sharing/share-offsite/?url={{CANONICAL_URL}}" target="_blank" rel="noopener" class="share-bar-btn" aria-label="Partager sur LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>\n'
        '  <a href="https://www.facebook.com/sharer/sharer.php?u={{CANONICAL_URL}}" target="_blank" rel="noopener" class="share-bar-btn" aria-label="Partager sur Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>\n'
        '  <a href="#" class="share-bar-btn share-bar-copy" aria-label="Copier le lien"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></a>\n'
        '</div>'
    )

    # 8. Newsletter CTA
    parts.append(
        '<div class="newsletter-cta">\n'
        '  <h3>Recevez nos guides prévention</h3>\n'
        '  <p>Un e-mail par mois, sans spam. Conseils d\'experts, saisonnalité des nuisibles, check-lists pratiques.</p>\n'
        '  <form class="newsletter-form" action="#" method="post">\n'
        '    <input type="email" placeholder="votre@email.fr" required aria-label="Votre email">\n'
        '    <button type="submit">S\'inscrire</button>\n'
        '  </form>\n'
        '</div>'
    )

    body = "\n\n".join(parts)
    # Substituer le slot {{CANONICAL_URL}} embarqué dans le share-bar-inline
    # AVANT que ce body soit injecté dans le template, sinon le slot du body
    # ne sera pas remplacé par la passe globale.
    body = body.replace("{{CANONICAL_URL}}", canonical_url)
    return body


def gen_toc_list(sections: list) -> str:
    """Génère les <li> de la TOC sidebar depuis les sections."""
    items = []
    for sec in sections:
        items.append(f'        <li><a href="#{sec["anchor"]}">{html_escape(sec.get("tocLabel", sec["h2"]))}</a></li>')
    items.append('        <li><a href="#faq">Questions fréquentes</a></li>')
    return "\n".join(items)


# ──────────────────────────────────────────────────────────────────────
# HTML mode (ChatSEO produit directement un HTML structuré)
# ──────────────────────────────────────────────────────────────────────

H2_PATTERN = re.compile(r'<h2[^>]*\sid="([^"]+)"[^>]*>(.*?)</h2>', re.S | re.I)


# ──────────────────────────────────────────────────────────────────────
# Semantic → Sanalia transformer
# Convertit du HTML sémantique propre (sortie ChatSEO) en HTML avec
# les classes Sanalia (.comparison-table, .steps-list, .callout-*, etc.)
# ──────────────────────────────────────────────────────────────────────

# Mots-clés dans le contenu d'un <aside> qui orientent vers la classe callout-*
ASIDE_KEYWORDS = [
    # (regex pour matcher dans le strong/intro, classe à appliquer)
    (re.compile(r"saviez[\s-]vous|saviezvous|le saviez", re.I), "callout-did-you-know"),
    (re.compile(r"urgence|appel(er)?\s*(le)?\s*(15|112)|anaphyla|d[ée]tresse", re.I), "callout-danger"),
    (re.compile(r"danger\b|attention danger|risque mortel|toxique|grave", re.I), "callout-danger"),
    (re.compile(r"attention|précaution|à éviter|ne (jamais|surtout)", re.I), "callout-warning"),
    (re.compile(r"astuce|conseil|tip|bon\s*à\s*savoir|pratique", re.I), "callout-tip"),
]


def _classify_aside(inner_html: str) -> str:
    """Retourne la classe callout-* adaptée selon le contenu de l'aside."""
    # On regarde surtout les 200 premiers chars (souvent le strong intro)
    sample = re.sub(r"<[^>]+>", " ", inner_html[:300])
    for pattern, cls in ASIDE_KEYWORDS:
        if pattern.search(sample):
            return cls
    return "callout-did-you-know"  # fallback neutre, prend la palette violet/sand


def _transform_aside(match) -> str:
    """Remplace un <aside> sémantique par un <aside class='callout callout-X'>."""
    attrs = match.group(1) or ""
    inner = match.group(2)
    # Skip si déjà classé Sanalia
    if "callout" in attrs:
        return match.group(0)
    cls = _classify_aside(inner)
    # Si pas de <div> wrapper, on en ajoute un pour matcher le markup attendu
    if "<div" not in inner[:50]:
        inner = f"<div>{inner.strip()}</div>"
    return f'<aside class="callout {cls}">{inner}</aside>'


def _transform_table(match) -> str:
    """Wrap les <table> sémantiques (avec thead et 2+ colonnes) en comparison-table."""
    attrs = match.group(1) or ""
    inner = match.group(2)
    # Skip si déjà classé Sanalia
    if "comparison-table" in attrs or "comparison-table-wrap" in match.group(0):
        return match.group(0)
    # Exiger un <thead> pour considérer un tableau comme comparatif
    if "<thead" not in inner.lower():
        return match.group(0)
    # Ajoute la classe et wrap dans le div
    new_attrs = f'{attrs.strip()} class="comparison-table"' if attrs.strip() else 'class="comparison-table"'
    return f'<div class="comparison-table-wrap"><table {new_attrs}>{inner}</table></div>'


def _transform_ol_to_steps(match) -> str:
    """Convertit un <ol> en steps-list si chaque <li> commence par <strong>."""
    attrs = match.group(1) or ""
    inner = match.group(2)
    if "steps-list" in attrs:
        return match.group(0)
    # Compter les <li> qui commencent par <strong>
    li_iter = re.finditer(r"<li[^>]*>\s*(.*?)\s*</li>", inner, re.S | re.I)
    li_list = list(li_iter)
    if len(li_list) < 2:
        return match.group(0)
    strong_led = sum(1 for li in li_list if re.match(r"\s*<strong\b", li.group(1)))
    if strong_led < len(li_list) * 0.7:  # 70 % au moins
        return match.group(0)
    new_attrs = f'{attrs.strip()} class="steps-list"' if attrs.strip() else 'class="steps-list"'
    return f'<ol {new_attrs}>{inner}</ol>'


def transform_semantic_to_sanalia(html: str) -> str:
    """Applique les transformations Sanalia sur un HTML sémantique propre.

    Idempotent : si une classe Sanalia est déjà présente, le bloc est laissé tel quel.

    Règles :
    - <table> avec <thead> → wrap .comparison-table-wrap + class .comparison-table
    - <ol> où ≥ 70 % des <li> commencent par <strong> → class .steps-list
    - <aside> → class callout callout-X (X classé selon mots-clés du contenu)

    Pas géré (laissé à l'orchestrateur Claude ou à un futur run) :
    - .checklist (besoin de contexte sémantique trop subtil)
    - .stats-highlight (idem)
    - .internal-link-card (placement intelligent par l'orchestrateur)
    - .emergency-banner (déjà géré par gen_emergency_banner selon intent)
    """
    # Tables : matcher <table ...>contenu</table> non-greedy
    html = re.sub(
        r"<table\b([^>]*)>(.*?)</table>",
        _transform_table,
        html,
        flags=re.S | re.I,
    )

    # Ordered lists
    html = re.sub(
        r"<ol\b([^>]*)>(.*?)</ol>",
        _transform_ol_to_steps,
        html,
        flags=re.S | re.I,
    )

    # Asides (en dernier pour ne pas interférer avec les nested asides dans tables)
    html = re.sub(
        r"<aside\b([^>]*)>(.*?)</aside>",
        _transform_aside,
        html,
        flags=re.S | re.I,
    )

    return html


def extract_h2s_from_html(html: str) -> list:
    """Extrait les H2 (ancre + label) d'un HTML pour construire la TOC.

    Retourne une liste de dicts {anchor, label, start_pos, end_pos}.
    `start_pos` = index du `<h2` dans la string source.
    """
    h2s = []
    for m in H2_PATTERN.finditer(html):
        anchor = m.group(1)
        # Strip HTML tags from H2 inner text for the TOC label
        label_html = m.group(2)
        label = re.sub(r"<[^>]+>", "", label_html).strip()
        h2s.append({
            "anchor": anchor,
            "label": label,
            "start_pos": m.start(),
            "end_pos": m.end(),
        })
    return h2s


def gen_toc_list_from_h2s(h2s: list) -> str:
    """Comme gen_toc_list mais à partir des H2 extraits du HTML."""
    items = []
    for h in h2s:
        items.append(f'        <li><a href="#{h["anchor"]}">{html_escape(h["label"])}</a></li>')
    items.append('        <li><a href="#faq">Questions fréquentes</a></li>')
    return "\n".join(items)


def insert_ctas_in_html(article_html: str, h2s: list, cta_inserts: list, cfg: dict) -> tuple:
    """Insère les CTAs `cta-inline-blog` dans `article_html` aux positions
    indiquées par `afterSectionIndex` (0-indexed sur la liste des H2).

    Retourne (html_modifié, cta_counter_final).
    """
    # Trie les inserts par section index décroissant pour préserver les offsets
    inserts_sorted = sorted(cta_inserts, key=lambda c: c["afterSectionIndex"], reverse=True)

    cta_counter = len(inserts_sorted)  # numéro initial décroissant pour gen_cta_inline
    # On veut counter 0,1,2,... dans l'ordre original ; on les pré-calcule
    order_map = {id(c): i for i, c in enumerate(cta_inserts)}

    result = article_html
    for cta in inserts_sorted:
        idx = cta["afterSectionIndex"]
        # On insère APRÈS la section N → juste avant le H2 (N+1) s'il existe,
        # sinon à la fin de l'article (avant la FAQ qu'on ajoutera après).
        if idx + 1 < len(h2s):
            insert_pos = h2s[idx + 1]["start_pos"]
        else:
            insert_pos = len(result)

        cta_html = gen_cta_inline(
            cta["variant"], cfg, order_map[id(cta)],
            title_override=cta.get("titleOverride"),
            desc_override=cta.get("descOverride"),
        )
        result = result[:insert_pos] + "\n\n" + cta_html + "\n\n" + result[insert_pos:]

    return result, len(cta_inserts)


def gen_emergency_banner(data: dict) -> str:
    """Génère la bannière urgence si data.emergencyBanner présent
    OU si intentType = 'urgency'."""
    eb = data.get("emergencyBanner")
    if not eb and data.get("intentType") == "urgency":
        eb = {
            "title": "Symptômes graves ? Appelez le 15.",
            "desc": "Au moindre signe d'urgence (gonflement visage/gorge, gêne respiratoire, malaise), composez le 15 ou le 112 sans attendre.",
        }
    if not eb:
        return ""
    return (
        '<aside class="emergency-banner" role="alert">\n'
        '  <div class="emergency-banner__text">\n'
        '    <span class="emergency-banner__icon" aria-hidden="true">🚨</span>\n'
        '    <div>\n'
        f'      <p class="emergency-banner__title">{html_escape(eb["title"])}</p>\n'
        f'      <p class="emergency-banner__desc">{html_escape(eb["desc"])}</p>\n'
        '    </div>\n'
        '  </div>\n'
        '  <a href="tel:15" class="emergency-banner__cta" aria-label="Appeler le 15 — SAMU">\n'
        '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>\n'
        '    Appeler le 15\n'
        '  </a>\n'
        '</aside>'
    )


def gen_article_body_from_html(data: dict, slug: str, canonical_url: str, cfg: dict) -> tuple:
    """Variante HTML mode : prend `articleHtml` brut (avec <h2 id=...>),
    insère bannière urgence + intro + hero + CTAs + FAQ + reste.

    Retourne (body_html, h2_list pour TOC).
    """
    parts = []

    # 1. Emergency banner (urgency only)
    eb_html = gen_emergency_banner(data)
    if eb_html:
        parts.append(eb_html)

    # 2. Intro paragraphs
    intro = data.get("introHtml", "")
    if intro:
        parts.append(intro)
    else:
        for p in data.get("introParagraphs", []):
            parts.append(f"<p>{p}</p>")

    # 3. Hero image
    if data.get("heroImage"):
        parts.append(gen_image_figure(slug, data["heroImage"]))

    # 4. Article HTML : transformation sémantique → Sanalia, puis insertion CTAs
    article_html = data["articleHtml"]
    # Skip la transformation si data.skipTransform=true (utile pour les articles
    # déjà adaptés manuellement, ou en mode legacy avec classes déjà appliquées).
    if not data.get("skipTransform"):
        article_html = transform_semantic_to_sanalia(article_html)
    h2s = extract_h2s_from_html(article_html)
    cta_inserts = data.get("ctaInserts", [])
    article_with_ctas, cta_counter = insert_ctas_in_html(article_html, h2s, cta_inserts, cfg)
    parts.append(article_with_ctas)

    # 5. FAQ accordion (aligné JSONLD)
    parts.append('<h2 id="faq">Questions fréquentes</h2>')
    accordion_items = []
    for fq in data["faq"]:
        accordion_items.append(
            f'  <div class="accordion-item">\n'
            f'    <button class="accordion-header">{html_escape(fq["q"])} <span class="icon-toggle">+</span></button>\n'
            f'    <div class="accordion-body">\n'
            f'      <div class="accordion-body-inner">{html_escape(fq["a"])}</div>\n'
            f'    </div>\n'
            f'  </div>'
        )
    parts.append(
        '<div class="accordion-list" id="faqAccordion">\n' +
        "\n".join(accordion_items) +
        '\n</div>'
    )

    # 6. CTA final
    parts.append(gen_cta_inline("devis", cfg, cta_counter))

    # 7. Author card
    parts.append(
        '<div class="author-card">\n'
        '  <div class="author-card-avatar">S</div>\n'
        '  <div>\n'
        '    <div class="author-card-name">Équipe Sanalia</div>\n'
        '    <div class="author-card-bio">Collectif de techniciens Certibiocide présent dans les plus grandes villes de France (Paris, Lyon, Marseille, Toulouse, Nice, Bordeaux, Lille, Nantes, Strasbourg, Montpellier). 3 000+ interventions réalisées par an, spécialisés en habitat collectif et restauration. Tous nos contenus sont relus par un référent scientifique.</div>\n'
        '  </div>\n'
        '</div>'
    )

    # 8. Share bar inline (slot {{CANONICAL_URL}} substitué plus bas)
    parts.append(
        '<div class="share-bar-inline">\n'
        '  <span class="share-bar-inline-label">Partager cet article</span>\n'
        '  <a href="https://twitter.com/intent/tweet?url={{CANONICAL_URL}}" target="_blank" rel="noopener" class="share-bar-btn" aria-label="Partager sur X"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg></a>\n'
        '  <a href="https://www.linkedin.com/sharing/share-offsite/?url={{CANONICAL_URL}}" target="_blank" rel="noopener" class="share-bar-btn" aria-label="Partager sur LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>\n'
        '  <a href="https://www.facebook.com/sharer/sharer.php?u={{CANONICAL_URL}}" target="_blank" rel="noopener" class="share-bar-btn" aria-label="Partager sur Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>\n'
        '  <a href="#" class="share-bar-btn share-bar-copy" aria-label="Copier le lien"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></a>\n'
        '</div>'
    )

    # 9. Newsletter
    parts.append(
        '<div class="newsletter-cta">\n'
        '  <h3>Recevez nos guides prévention</h3>\n'
        '  <p>Un e-mail par mois, sans spam. Conseils d\'experts, saisonnalité des nuisibles, check-lists pratiques.</p>\n'
        '  <form class="newsletter-form" action="#" method="post">\n'
        '    <input type="email" placeholder="votre@email.fr" required aria-label="Votre email">\n'
        '    <button type="submit">S\'inscrire</button>\n'
        '  </form>\n'
        '</div>'
    )

    body = "\n\n".join(parts)
    body = body.replace("{{CANONICAL_URL}}", canonical_url)
    return body, h2s


def gen_sidebar_widget(intent: str, cfg: dict) -> str:
    """Génère le bloc interne de la sidebar widget."""
    variant = cfg["intent_to_cta_variant"].get(intent, "devis")
    tpl = cfg["cta_templates"][variant]
    return (
        '      <div class="mono">Intervention Lyon &amp; Paris</div>\n'
        f'      <h4>{html_escape(tpl["titles"][0])}</h4>\n'
        f'      <p>{html_escape(tpl["descs"][0])}</p>\n'
        f'      <a href="{tpl["href"]}" class="btn btn-primary">{html_escape(tpl["button_text"])}</a>'
    )


def gen_related_cards(data: dict, parent_nuisible: str, cfg: dict) -> str:
    """Génère les 3 cartes related-articles."""
    related = data.get("related", {})
    parent_meta = cfg["parent_nuisible_map"].get(parent_nuisible, {})
    # url_slug peut différer de la clé Notion (ex : guepes → guepes-frelons)
    fiche_slug = parent_meta.get("url_slug", parent_nuisible)
    fiche_url = f"/nuisibles/{fiche_slug}/" if fiche_slug else "/nuisibles/"
    parent_name = parent_meta.get("name", "Nuisibles")

    cards = []
    # Carte 1 — article connexe
    if related.get("url"):
        cards.append(
            f'      <a href="{related["url"]}" class="related-card">\n'
            f'        <div class="related-card-category">{html_escape(related.get("category", "Article"))}</div>\n'
            f'        <div class="related-card-title">{html_escape(related["title"])}</div>\n'
            f'        <div class="related-card-meta">{html_escape(related.get("readingTime", ""))} de lecture</div>\n'
            f'      </a>'
        )
    # Carte 2 — fiche nuisible parent
    cards.append(
        f'      <a href="{fiche_url}" class="related-card">\n'
        f'        <div class="related-card-category">Guide nuisible</div>\n'
        f'        <div class="related-card-title">{html_escape(parent_name)} : guide complet (identification, dangers, traitement)</div>\n'
        f'        <div class="related-card-meta">15 min de lecture</div>\n'
        f'      </a>'
    )
    # Carte 3 — hub blog
    cards.append(
        '      <a href="/blog/" class="related-card">\n'
        '        <div class="related-card-category">Blog</div>\n'
        '        <div class="related-card-title">Voir tous les articles du blog Sanalia</div>\n'
        '        <div class="related-card-meta">Hub articles</div>\n'
        '      </a>'
    )
    return "\n".join(cards)


def gen_breadcrumb_jsonld_level34(parent_nuisible: str, article_title: str, cfg: dict) -> str:
    """Génère les positions 3 et 4 du BreadcrumbList JSON-LD."""
    parent_meta = cfg["parent_nuisible_map"].get(parent_nuisible, {})
    parent_name = parent_meta.get("name", "Nuisibles")
    fiche_slug = parent_meta.get("url_slug", parent_nuisible)
    if parent_nuisible:
        level3 = f'        {{ "@type": "ListItem", "position": 3, "name": "{json_escape(parent_name)}", "item": "https://www.sanalia.fr/nuisibles/{fiche_slug}/" }},'
    else:
        # Transverse : pas de position 3 vers /nuisibles/<x>/ mais on garde 3 niveaux (skip)
        return f'        {{ "@type": "ListItem", "position": 3, "name": "{json_escape(article_title)}" }}'
    level4 = f'        {{ "@type": "ListItem", "position": 4, "name": "{json_escape(article_title)}" }}'
    return level3 + "\n" + level4


def gen_faq_jsonld(faq: list) -> str:
    """Génère les entries JSON du FAQPage mainEntity."""
    items = []
    for fq in faq:
        items.append(
            '        {\n'
            '          "@type": "Question",\n'
            f'          "name": "{json_escape(fq["q"])}",\n'
            '          "acceptedAnswer": {\n'
            '            "@type": "Answer",\n'
            f'            "text": "{json_escape(fq["a"])}"\n'
            '          }\n'
            '        }'
        )
    return ",\n".join(items)


# ──────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────

def assemble(data: dict, slug: str, cfg: dict, skeleton_path: Path) -> str:
    parent_nuisible = data["parentNuisible"]
    parent_meta = cfg["parent_nuisible_map"].get(parent_nuisible, {})

    canonical_url = f"{cfg['prod_domain']}/blog/{slug}/"
    hero = data.get("heroImage") or {}
    hero_url_field = hero.get("url", "")
    hero_filename = hero.get("filename", "hero.svg")
    # Si heroImage.url est une URL externe (Recraft, etc.), on l'utilise tel quel.
    # Sinon si filename est une URL, idem. Sinon, asset local.
    if hero_url_field and hero_url_field.startswith(("http://", "https://")):
        og_image_url = hero_url_field
    elif hero_filename.startswith(("http://", "https://")):
        og_image_url = hero_filename
    else:
        og_image_url = f"{cfg['prod_domain']}/assets/blog/{slug}/{hero_filename}"

    article_section = parent_meta.get("section", "Conseils")

    breadcrumb_label = data.get("breadcrumbLabel", data["title"])

    # Mode auto : si `articleHtml` est présent (sortie ChatSEO HTML),
    # on passe en mode HTML. Sinon mode JSON legacy (sections list).
    use_html_mode = bool(data.get("articleHtml"))
    if use_html_mode:
        article_body, h2s = gen_article_body_from_html(data, slug, canonical_url, cfg)
        toc_html = gen_toc_list_from_h2s(h2s)
    else:
        article_body = gen_article_body(data, slug, canonical_url, cfg)
        toc_html = gen_toc_list(data["sections"])

    replacements = {
        "{{META_TITLE}}": data["metaTitle"],
        "{{META_DESCRIPTION}}": data["metaDescription"],
        "{{CANONICAL_URL}}": canonical_url,
        "{{OG_TITLE}}": data["title"],
        "{{OG_DESCRIPTION}}": data["metaDescription"],
        "{{OG_IMAGE_URL}}": og_image_url,
        "{{ARTICLE_PUBLISHED}}": data["publishedAt"],
        "{{ARTICLE_MODIFIED}}": data["modifiedAt"],
        "{{ARTICLE_SECTION}}": article_section,
        "{{WORD_COUNT}}": str(data["wordCount"]),
        "{{JSONLD_BREADCRUMB_LEVEL3_AND_4}}": gen_breadcrumb_jsonld_level34(parent_nuisible, data["title"], cfg),
        "{{JSONLD_FAQ_ITEMS}}": gen_faq_jsonld(data["faq"]),
        "{{PARENT_NUISIBLE_SLUG}}": parent_meta.get("url_slug", parent_nuisible) or "rats",
        "{{PARENT_NUISIBLE_PICTO}}": parent_meta.get("picto", ""),
        "{{PARENT_NUISIBLE_BG_CLASS}}": parent_meta.get("bg_class", "bg-gold"),
        "{{PARENT_NUISIBLE_NAME}}": parent_meta.get("name", "Nuisibles"),
        "{{TAG_NUISIBLE_CLASS}}": parent_meta.get("tag_class", "tag-prevention"),
        "{{BREADCRUMB_CURRENT_LABEL}}": breadcrumb_label,
        "{{H1}}": data["title"],
        "{{HERO_SUBTITLE}}": data["heroSubtitle"],
        "{{PUBLISHED_DATE_HUMAN}}": iso_to_human(data["publishedAt"]),
        "{{MODIFIED_DATE_HUMAN}}": iso_to_human(data["modifiedAt"]),
        "{{READING_TIME}}": str(data["readingTimeMin"]),
        "{{ARTICLE_BODY_HTML}}": article_body,
        "{{TOC_LIST}}": toc_html,
        "{{SIDEBAR_WIDGET_INNER}}": gen_sidebar_widget(data["intentType"], cfg),
        "{{RELATED_CARDS_HTML}}": gen_related_cards(data, parent_nuisible, cfg),
    }

    html = skeleton_path.read_text()
    for slot, val in replacements.items():
        html = html.replace(slot, val)

    # Sanity check : aucun slot résiduel
    leftover = re.findall(r"\{\{[A-Z0-9_]+\}\}", html)
    if leftover:
        raise RuntimeError(f"Slots non remplacés : {set(leftover)}")

    return html


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    data = json.loads(Path(args.json).read_text())
    cfg = yaml.safe_load(Path(args.config).read_text())
    skel = Path(cfg["paths"]["skeleton_template"])
    if not skel.is_absolute():
        # Résoudre par rapport à la racine du repo (parent de .claude/)
        # Le SKILL.md positionnera cwd à la racine du repo
        skel = Path.cwd() / skel

    html = assemble(data, args.slug, cfg, skel)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print(f"✓ Article assemblé : {out} ({len(html)} chars)")


if __name__ == "__main__":
    main()

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
  "heroImage": {                          # hero générée par Recraft
    "filename": "hero.webp",
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
    """Génère une <figure> pour une image d'article."""
    src = f"/assets/blog/{slug}/{image['filename']}"
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
        '    <div class="author-card-bio">Collectif de techniciens Certibiocide basés à Lyon et Paris. 3 000+ interventions réalisées par an, spécialisés en habitat collectif et restauration. Tous nos contenus sont relus par un référent scientifique.</div>\n'
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
    hero_filename = data["heroImage"]["filename"] if data.get("heroImage") else "hero.webp"
    og_image_url = f"{cfg['prod_domain']}/assets/blog/{slug}/{hero_filename}"

    article_section = parent_meta.get("section", "Conseils")

    breadcrumb_label = data.get("breadcrumbLabel", data["title"])

    article_body = gen_article_body(data, slug, canonical_url, cfg)

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
        "{{TOC_LIST}}": gen_toc_list(data["sections"]),
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

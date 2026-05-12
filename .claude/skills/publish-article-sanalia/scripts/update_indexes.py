#!/usr/bin/env python3
"""Met à jour sitemap-blog.xml, sitemap-index.xml, blog/feed.xml et blog/index.html
(hub) après création d'un nouvel article Sanalia.

Usage :
  python3 update_indexes.py --slug <slug> --title "<titre>" --description "<desc>" \
                            --published <YYYY-MM-DD> --category <slug-cat> --repo-root <path>

Effets :
  1. sitemap-blog.xml : ajoute <url> pour l'article (priority 0.7, monthly)
  2. sitemap-index.xml : bump <lastmod> de l'entrée sitemap-blog
  3. blog/feed.xml : ajoute <item> en tête, update <lastBuildDate>
  4. blog/index.html : insère une carte article en tête de la grille
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Catégorie slug → nom humain (pour <category> RSS et carte hub)
CATEGORY_LABELS = {
    "rats-souris": "Rats et souris",
    "punaises-de-lit": "Punaises de lit",
    "cafards-insectes": "Cafards & Insectes",
    "guepes-frelons": "Guêpes & Frelons",
    "prevention": "Prévention",
}


def rfc822_now() -> str:
    """Date au format RFC 822 pour RSS."""
    return datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")


def rfc822_from_iso(iso: str) -> str:
    """Convertit YYYY-MM-DD en RFC 822 (09:00:00 +0200 par convention)."""
    d = datetime.fromisoformat(iso)
    return d.strftime("%a, %d %b %Y 09:00:00 +0200")


def update_sitemap_blog(path: Path, slug: str, today: str) -> None:
    """Ajoute une <url> pour le nouvel article si absente."""
    text = path.read_text()
    loc = f"https://www.sanalia.fr/blog/{slug}/"
    if loc in text:
        print(f"  ↻ {loc} déjà dans sitemap-blog")
        return
    new_url = (
        f'  <url>\n'
        f'    <loc>{loc}</loc>\n'
        f'    <lastmod>{today}</lastmod>\n'
        f'    <changefreq>monthly</changefreq>\n'
        f'    <priority>0.7</priority>\n'
        f'  </url>\n'
    )
    # Insère juste avant </urlset>
    text = text.replace("</urlset>", new_url + "\n</urlset>")
    path.write_text(text)
    print(f"  ✓ {loc} ajouté à sitemap-blog")


def update_sitemap_index(path: Path, today: str) -> None:
    """Bump le <lastmod> de l'entrée sitemap-blog.xml dans sitemap-index.xml."""
    text = path.read_text()
    # Pattern : <loc>.../sitemap-blog.xml</loc>\n  <lastmod>YYYY-MM-DD</lastmod>
    new_text = re.sub(
        r"(<loc>[^<]*sitemap-blog\.xml</loc>\s*\n\s*<lastmod>)[\d-]+(</lastmod>)",
        rf"\g<1>{today}\g<2>",
        text,
    )
    if new_text == text:
        print("  ⚠ sitemap-blog.xml non trouvé dans sitemap-index, vérifier")
    else:
        path.write_text(new_text)
        print(f"  ✓ sitemap-index lastmod bumpé à {today}")


def update_feed_xml(path: Path, slug: str, title: str, description: str, category: str, published_iso: str) -> None:
    """Ajoute un <item> en tête du <channel> et update <lastBuildDate>."""
    text = path.read_text()
    link = f"https://www.sanalia.fr/blog/{slug}/"
    if f"<guid isPermaLink=\"true\">{link}</guid>" in text:
        print(f"  ↻ {link} déjà dans feed.xml")
        return

    pub_date = rfc822_from_iso(published_iso)
    cat_label = CATEGORY_LABELS.get(category, "Conseils")

    new_item = (
        '\n    <item>\n'
        f'      <title>{title}</title>\n'
        f'      <link>{link}</link>\n'
        f'      <description>{description}</description>\n'
        f'      <pubDate>{pub_date}</pubDate>\n'
        f'      <guid isPermaLink="true">{link}</guid>\n'
        f'      <category>{cat_label}</category>\n'
        '    </item>\n'
    )

    # Update lastBuildDate
    text = re.sub(
        r"<lastBuildDate>[^<]+</lastBuildDate>",
        f"<lastBuildDate>{rfc822_now()}</lastBuildDate>",
        text,
    )

    # Insère le nouvel item juste après <image>...</image>
    text = re.sub(
        r"(</image>)",
        r"\1" + new_item,
        text,
        count=1,
    )

    path.write_text(text)
    print(f"  ✓ Item ajouté à feed.xml + lastBuildDate refreshed")


# Mapping Catégorie slug → tag color suffixe (utilisé par le hub)
CATEGORY_TAG_COLOR = {
    "rats-souris": "gold",
    "punaises-de-lit": "rose",
    "cafards-insectes": "mint",
    "guepes-frelons": "gold",
    "prevention": "lavender",
}


def update_blog_hub(path: Path, slug: str, title: str, category: str, reading_time: int, hero_filename: str = "hero.svg") -> None:
    """Insère une carte `<article class="card-article">` dans la grille du hub blog,
    juste après le marqueur `<!-- Articles secondaires -->`.

    Pattern attendu (cf. blog/index.html actuel) :
        <!-- Articles secondaires -->
        <article class="card-article" data-pillar="...">
          <a href="/blog/<slug>/" class="card-article-link">
            <div class="card-media" style="background: var(--color-pastel-<color>-light);">
              <img src="/assets/blog/<slug>/hero.svg" alt="..." loading="lazy">
              <span class="card-tag tag-<color>">Catégorie</span>
            </div>
            <div class="card-body">
              <h3>Titre</h3>
              <div class="card-meta"><span>Équipe Sanalia</span><span>·</span><span>N min</span></div>
            </div>
          </a>
        </article>
    """
    if not path.exists():
        print(f"  ⚠ {path} introuvable, hub non mis à jour")
        return

    text = path.read_text()
    href = f"/blog/{slug}/"
    if f'href="{href}"' in text:
        print(f"  ↻ Carte hub déjà présente pour {href}")
        return

    cat_label = CATEGORY_LABELS.get(category, "Conseils")
    color = CATEGORY_TAG_COLOR.get(category, "gold")
    img_src = f"/assets/blog/{slug}/{hero_filename}"

    card = (
        f'        <article class="card-article" data-pillar="{category}">\n'
        f'          <a href="{href}" class="card-article-link">\n'
        f'            <div class="card-media" style="background: var(--color-pastel-{color}-light);">\n'
        f'              <img src="{img_src}" alt="{title}" loading="lazy">\n'
        f'              <span class="card-tag tag-{color}">{cat_label}</span>\n'
        f'            </div>\n'
        f'            <div class="card-body">\n'
        f'              <h3>{title}</h3>\n'
        f'              <div class="card-meta">\n'
        f'                <span>Équipe Sanalia</span>\n'
        f'                <span>·</span>\n'
        f'                <span>{reading_time} min</span>\n'
        f'              </div>\n'
        f'            </div>\n'
        f'          </a>\n'
        f'        </article>\n'
    )

    marker = "<!-- Articles secondaires -->"
    if marker in text:
        text = text.replace(marker, marker + "\n" + card, 1)
        path.write_text(text)
        print(f"  ✓ Carte hub insérée pour {href}")
        return

    # Fallback alternatif : ancien marqueur
    legacy = "<!-- BLOG_HUB_INSERT_HERE -->"
    if legacy in text:
        text = text.replace(legacy, legacy + "\n" + card, 1)
        path.write_text(text)
        print(f"  ✓ Carte hub insérée pour {href} (legacy marker)")
        return

    print("  ⚠ Aucun marqueur 'Articles secondaires' trouvé — hub non mis à jour")


def update_nuisible_fiche(path: Path, slug: str, title_short: str, reading_time: int, parent_nuisible_slug: str, intent: str) -> None:
    """Insère un item dans la section `<h4>À lire aussi</h4>` de la fiche
    /nuisibles/<parent>/ . Remplace l'item position 01 s'il pointe vers /blog/
    (placeholder), sinon insère un nouvel item position 01 et renumérote les suivants.
    """
    if not path.exists():
        print(f"  ⚠ {path} introuvable, fiche nuisible non mise à jour")
        return

    text = path.read_text()
    href = f"/blog/{slug}/"
    if f'href="{href}"' in text:
        print(f"  ↻ Article déjà référencé dans {path.name}")
        return

    # Mapping intent → label visible
    intent_labels = {
        "urgency": "Urgence",
        "transactional": "Service",
        "prevention": "Prévention",
        "informational": "Guide",
        "regulatory": "Réglementation",
    }
    label = intent_labels.get(intent, "Conseil")
    tag_class = f"tag-{parent_nuisible_slug.split('-')[0]}"  # guepes-frelons → tag-guepes

    new_item = (
        f'<li class="articles-list-item">\n'
        f'<a href="{href}">\n'
        f'<span class="articles-list-num">01</span>\n'
        f'<div class="articles-list-body">\n'
        f'<span class="articles-list-tag {tag_class}">{label}</span>\n'
        f'<h5>{title_short}</h5>\n'
        f'<span class="articles-list-meta">{reading_time} min de lecture</span>\n'
        f'</div>\n'
        f'<span class="articles-list-arrow">→</span>\n'
        f'</a>\n'
        f'</li>'
    )

    # Stratégie : remplacer l'item 01 actuel s'il pointe vers /blog/ (placeholder)
    pattern = re.compile(
        r'<li class="articles-list-item">\s*\n'
        r'<a href="/blog/">\s*\n'
        r'<span class="articles-list-num">01</span>.*?</li>',
        re.S,
    )
    new_text, n = pattern.subn(new_item, text, count=1)
    if n == 0:
        # Pas de placeholder à remplacer — chercher la <ul> sous "À lire aussi" et insérer en tête
        marker = '<h4 class="articles-list-title">À lire aussi</h4>\n<ul>\n'
        if marker in text:
            text = text.replace(marker, marker + new_item + "\n", 1)
            path.write_text(text)
            print(f"  ✓ Article inséré en tête de 'À lire aussi' dans {path.name}")
            return
        print(f"  ⚠ Section 'À lire aussi' introuvable dans {path.name}")
        return

    path.write_text(new_text)
    print(f"  ✓ Item 01 'À lire aussi' remplacé dans {path.name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--title-short", default=None, help="Titre raccourci pour la fiche nuisible (défaut: --title)")
    ap.add_argument("--description", required=True)
    ap.add_argument("--published", required=True, help="YYYY-MM-DD")
    ap.add_argument("--category", required=True, help="rats-souris | punaises-de-lit | ...")
    ap.add_argument("--reading-time", type=int, default=10)
    ap.add_argument("--parent-nuisible-slug", default=None, help="ex: guepes-frelons (pour màj fiche nuisible)")
    ap.add_argument("--intent", default="informational", help="urgency | informational | ...")
    ap.add_argument("--hero-filename", default="hero.svg")
    ap.add_argument("--repo-root", required=True)
    args = ap.parse_args()

    repo = Path(args.repo_root).resolve()
    today = datetime.now().strftime("%Y-%m-%d")
    title_short = args.title_short or args.title

    print(f"▶ Mise à jour des index pour /blog/{args.slug}/")

    update_sitemap_blog(repo / "sitemap-blog.xml", args.slug, today)
    update_sitemap_index(repo / "sitemap-index.xml", today)
    update_feed_xml(
        repo / "blog" / "feed.xml",
        args.slug, args.title, args.description, args.category, args.published,
    )
    update_blog_hub(
        repo / "blog" / "index.html",
        args.slug, args.title, args.category, args.reading_time, args.hero_filename,
    )
    if args.parent_nuisible_slug:
        update_nuisible_fiche(
            repo / "nuisibles" / args.parent_nuisible_slug / "index.html",
            args.slug, title_short, args.reading_time, args.parent_nuisible_slug, args.intent,
        )

    print("✓ Tous les index mis à jour")


if __name__ == "__main__":
    main()

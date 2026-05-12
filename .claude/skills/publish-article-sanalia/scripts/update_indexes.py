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


def update_blog_hub(path: Path, slug: str, title: str, description: str, category: str, published_iso: str, reading_time: int) -> None:
    """Ajoute une carte article en tête de la grille du hub blog.

    Le hub /blog/index.html doit contenir un marqueur HTML repérable où insérer
    la nouvelle carte. Pattern attendu : `<!-- BLOG_HUB_INSERT_HERE -->`.
    Si absent, on insère après `<div class="blog-grid">` (premier match).
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
    d = datetime.fromisoformat(published_iso)
    pub_human = d.strftime("%d %b %Y").lower()

    card = (
        f'      <a href="{href}" class="blog-card">\n'
        f'        <div class="blog-card-category">{cat_label}</div>\n'
        f'        <h3 class="blog-card-title">{title}</h3>\n'
        f'        <p class="blog-card-excerpt">{description}</p>\n'
        f'        <div class="blog-card-meta">\n'
        f'          <span class="blog-card-date">{pub_human}</span>\n'
        f'          <span class="blog-card-reading">{reading_time} min de lecture</span>\n'
        f'        </div>\n'
        f'      </a>\n'
    )

    marker = "<!-- BLOG_HUB_INSERT_HERE -->"
    if marker in text:
        text = text.replace(marker, marker + "\n" + card)
    else:
        # Fallback : insère après la première <div class="blog-grid"> trouvée
        new_text = re.sub(
            r'(<div class="blog-grid">\s*\n)',
            r'\1' + card,
            text,
            count=1,
        )
        if new_text == text:
            print("  ⚠ Aucun marqueur 'BLOG_HUB_INSERT_HERE' ni '<div class=\"blog-grid\">' trouvé — hub non mis à jour")
            return
        text = new_text

    path.write_text(text)
    print(f"  ✓ Carte hub insérée pour {href}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", required=True)
    ap.add_argument("--published", required=True, help="YYYY-MM-DD")
    ap.add_argument("--category", required=True, help="rats-souris | punaises-de-lit | ...")
    ap.add_argument("--reading-time", type=int, default=10)
    ap.add_argument("--repo-root", required=True)
    args = ap.parse_args()

    repo = Path(args.repo_root).resolve()
    today = datetime.now().strftime("%Y-%m-%d")

    print(f"▶ Mise à jour des index pour /blog/{args.slug}/")

    update_sitemap_blog(repo / "sitemap-blog.xml", args.slug, today)
    update_sitemap_index(repo / "sitemap-index.xml", today)
    update_feed_xml(
        repo / "blog" / "feed.xml",
        args.slug, args.title, args.description, args.category, args.published,
    )
    update_blog_hub(
        repo / "blog" / "index.html",
        args.slug, args.title, args.description, args.category, args.published, args.reading_time,
    )

    print("✓ Tous les index mis à jour")


if __name__ == "__main__":
    main()

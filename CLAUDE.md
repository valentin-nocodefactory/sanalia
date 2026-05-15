# Sanalia — Design System Rules

Toujours respecter ces regles pour tout fichier HTML/CSS/JS produit dans ce projet.

## Figma Source of Truth
- **File**: https://www.figma.com/design/lEg0coWuifM9JLhc1UTPzt/Sanalia
- **fileKey**: `lEg0coWuifM9JLhc1UTPzt`

## Typographie — STRICTE

### Font principale : Uxum
- **Bold 700** : titres (H1, H2, H3), boutons CTA, accroches
- **Regular 400** : corps de texte, paragraphes, descriptions
- **Light 300** : textes longs, descriptions secondaires
- Fichiers locaux dans `fonts/` (uxumbold.otf, uxumregular.otf, uxumlight.otf)
- CSS : `font-family: 'Uxum', sans-serif;`

### Font secondaire : Space Mono (Google Fonts)
- **Regular 400 uniquement — JAMAIS de bold sur le mono**
- Usage : titres de sections en MAJUSCULES, tags, codes hex, tokens CSS, specs techniques, labels system
- **JAMAIS de couleur violette sur du texte mono** — utiliser uniquement des couleurs neutres (#999, #666)
- CSS : `font-family: 'Space Mono', monospace; font-weight: 400;`
- Import : `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`

## Logo
- **Format** : Wordmark SVG vectorise (PAS une font, ce sont des paths vectoriels)
- **Source** : `logo-sanalia.svg` (159x57 viewBox)
- **Couleur texte** : `#0E052A`
- **Couleur feuille** : `#635DDD`
- Ne JAMAIS tenter de recreer le logo avec une font — toujours utiliser le SVG

## Couleurs

### Palette principale (violet)
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary-900 | #0E052A | Texte principal, boutons dark |
| --color-primary-800 | #34285A | Texte secondaire sombre |
| --color-primary-600 | #635DDD | Couleur de marque principale |
| --color-primary-500 | #7671D5 | Accents texte (ex: "definitivement !") |
| --color-primary-400 | #8781F3 | Violet medium |
| --color-primary-200 | #CECCFC | Violet clair |
| --color-primary-100 | #E9E8FF | Fonds violets legers |

### Accent
| Token | Hex | Usage |
|-------|-----|-------|
| --color-accent-500 | #F66C24 | Orange CTA |
| --color-accent-100 | #FFE5CF | Peach light |

### Fonds & Neutres
| Token | Hex | Usage |
|-------|-----|-------|
| --color-bg | #F6F5F0 | Fond principal (cream) |
| --color-bg-sand | #F1ECDF | Fond secondaire |
| --color-bg-offwhite | #FFFDF8 | Fond tres clair |
| --color-surface | #FFFFFF | Cartes, surfaces |
| --color-gray-light | #E5E5E5 | Bordures, separateurs |

### Pastels (14 couleurs pour categories)
Blue #B0D5F5/#E6F3FF, Lavender #EFDFF6/#FBF2FF, Rose #FFD4CF/#FFECE9, Peach #FFD4A7/#FFF3E7, Gold #F4E9C1/#FFFAE7, Mint #ABE0D1/#E1F7F1, Green #C8EBB3/#EAF9E0

## Espacements
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

## Border Radius
- xs: 2px, sm: 4px, md: 8px, lg: 16px, xl: 20px, full: 100px

## Boutons
- **Primary** : bg #0E052A, text white, Uxum Bold 16px, padding 13px 24px, radius 8px
- **Secondary** : bg #635DDD, text white
- **Outline** : bg transparent, border 2px #635DDD, text #635DDD
- **Ghost** : bg #E9E8FF, text #635DDD
- **Alert** : bg #F66C24, text white — UNIQUEMENT pour alertes/urgence, JAMAIS pour CTA

## Direction artistique
- **Esthetique globale** : pastel, doux, moderne, rassurant — PAS anxiogene
- **CTAs** : TOUJOURS violet (#635DDD ou #0E052A), JAMAIS orange
- **Orange** (#F66C24) : reserve EXCLUSIVEMENT aux barres d'urgence et alertes, utilise avec parcimonie
- **Cartes nuisibles** : petites cartes pastels avec fond colore doux (style category cards)
- **Layout** : utiliser le style bento grid pour la modernite
- **Raison** : les clients sont deja stresses, le site doit rassurer, pas alarmer

## Regles de style strictes
1. Le mono (Space Mono) ne prend JAMAIS de bold
2. Le mono ne prend JAMAIS de couleur violette — uniquement gris neutre (#999, #666)
3. Le fond principal est TOUJOURS #F6F5F0 (pas #FAF6EC)
4. Le logo est TOUJOURS le SVG vectorise, jamais recree avec une font
5. Seules 2 familles de fonts : Uxum + Space Mono
6. Les tokens CSS sont definis dans `tokens.css`
7. Les CTAs sont TOUJOURS violet — JAMAIS orange
8. Le orange est UNIQUEMENT pour les alertes urgentes
9. **RÈGLE D'OR — ACCENTS FRANÇAIS** : Tous les textes visibles sur le site DOIVENT avoir les accents français corrects (é, è, ê, à, ù, ç, î, ô, etc.). Cela concerne TOUTES les pages HTML, les titres, les paragraphes, les boutons, les labels, les attributs alt, les meta descriptions. JAMAIS de texte sans accent. Vérifier systématiquement avant chaque livraison.

## Fichiers
```
├── style-guide.html                # Style guide visuel
├── tokens.css                      # Variables CSS (source of truth)
├── logo-sanalia.svg                # Logo SVG
├── fonts/
│   ├── uxumbold.otf
│   ├── uxumregular.otf
│   └── uxumlight.otf
├── CLAUDE.md                       # Ce fichier (regles design system)
├── MARKETING-BRIEF.md              # Brief marketing : cibles, souffrances, psychologie client
├── SEO-ARCHITECTURE.md             # Architecture SEO complete : double arbre, URLs, maillage, anti-duplicate
├── SEO-INTENTIONS-RECHERCHE.md     # Intentions de recherche par page : questions DOIT/INTERDIT
├── SEO-PAGES-LISTE-GLOBALE.md      # Liste globale pages : URLs, H1, KW, volumes, KD, TP
├── LP-ADS-TEMPLATE.md              # Template canonique des landings Google Ads (/lp/*)
├── build.sh                        # Script de build : synchronise les composants
├── components/
│   ├── header.html                 # SOURCE du header (modifier ici)
│   ├── footer.html                 # SOURCE du footer (modifier ici)
│   ├── certifications.html         # SOURCE des certifications (modifier ici)
│   └── mobile-sticky-cta.html      # SOURCE du CTA mobile (modifier ici)
├── robots.txt                      # Fichier robots.txt
└── sitemap.xml                     # Sitemap XML
```

## Composants partagés — RÈGLE CRITIQUE
- Les fichiers dans `components/` sont la **source unique** du header, footer, certifications et CTA mobile
- Ces composants sont **inlinés** dans toutes les pages HTML pour le SSR (SEO)
- **JAMAIS modifier le header/footer directement dans une page** — toujours modifier le fichier source dans `components/`
- Après toute modification d'un composant, **lancer `./build.sh`** pour synchroniser toutes les pages
- Le build est aussi lancé automatiquement par Cloudflare Pages au déploiement

## Landing Pages Google Ads — Modèle dédié
Pour toute nouvelle landing page destinée à du **trafic payant** (Google Ads, Meta, Bing), le modèle canonique est documenté dans [`LP-ADS-TEMPLATE.md`](LP-ADS-TEMPLATE.md). Reproduire la structure de [`/lp/punaises-de-lit-lyon/index.html`](lp/punaises-de-lit-lyon/index.html) (15 sections, hero 2-col avec form au-dessus de la ligne de flottaison, protocole 5 étapes en scroll horizontal full-bleed, badges Trustpilot/Google inline). Toutes les LP sont obligatoirement `noindex,nofollow` + bloquées par `robots.txt` (`Disallow: /lp/`) et NE doivent JAMAIS apparaître dans le sitemap ni être linkées depuis une page publique du site.

## Template Page Nuisible — Structure de référence
La page `/nuisibles/rats/index.html` est le **modèle à suivre** pour TOUTES les fiches nuisibles. Chaque nouvelle page nuisible DOIT reproduire cette structure exacte.

### Structure des sections (dans l'ordre)
| # | Section ID | Contenu | Interactif |
|---|-----------|---------|------------|
| 1 | `<head>` | Meta SEO, OG, Twitter, Schema.org (Article + FAQPage + BreadcrumbList) | Non |
| 2 | `<style>` | CSS inline de la page (copier depuis rats, adapter couleurs pastels) | Non |
| 3 | Header | Composant inline (`data-component="header"`) | Mega-menus |
| 4 | `.step-nav` | Sticky breadcrumb + dropdown nuisibles + liens sections horizontaux | Scroll spy, dropdown |
| 5 | `#hero` | Hero pastel : H1, sous-titre, 2 CTAs, image, 4 stats animées | Compteurs animés |
| 6 | `#intro-seo` | Texte intro SEO + radar chart (Chart.js) + jauges horizontales | Chart.js radar |
| 7 | `#anatomie` | Schéma interactif : image + points cliquables + détail | Clic sur points |
| 8 | `#identification` | Comparaison espèces (2 cartes), callout, signes de présence photos | Lightbox zoom |
| 9 | `#dangers` | 3 onglets : Nuit / Maladies / Dégâts | Tabs JS |
| 10 | `#simulateur` | Simulateur prolifération : config pills + slider + résultats visuels | Calculs dynamiques |
| 11 | `#zones` | Coupe maison SVG : zones d'infestation jour/nuit | SVG interactif |
| 12 | `#evaluation` | Score de risque : 8 checkboxes + jauge SVG + verdict + CTA conditionnel | Calcul score temps réel |
| 13 | `#calendrier` | Calendrier 12 mois : activité, reproduction, intrusion, traitement | Génération JS |
| 14 | `#carte` | Carte de France SVG : régions cliquables + détail à droite | Clic région |
| 15 | `#methodes` | Comparaison méthodes : cartes avec barres efficacité/rapidité/sécurité | Filtres par niveau |
| 16 | `#protocole` | 5 étapes avec checkboxes interactives | Checkboxes |
| 17 | `#quiz` | Quiz 8 questions, progression, score cercle, verdict | Quiz complet |
| 18 | `#cout` | 4 cartes coûts + graphique Chart.js + slider ROI | Chart.js + slider |
| 19 | `#histoire` | Timeline historique (5 dates clés) | Statique |
| 20 | `#monde` | Carte mondiale : 6 villes cliquables + détail | Clic ville |
| 21 | `#faq` | 6 questions FAQ accordéon | Accordéon |
| 22 | `#action` | CTA final : heading + bouton + badges confiance | Statique |
| 23 | Sidebar | Carte sticky : image, nom, badge, stats, CTA, lien quiz | Sticky |
| 24 | `#cohabitants` | 4 cartes nuisibles liés | Statique |
| 25 | Footer + certifs | Composants inline | Statique |

### Layout CSS
```
.page-layout      → grid: 1fr 320px (collapse 1col à 1024px)
.page-content     → colonne gauche, sections avec padding 3xl + border-bottom
.sidebar-wrap     → sticky top: 130px (statique à 1024px)
.step-nav         → sticky top: 72px, backdrop-filter blur
html              → scroll-padding-top: 130px
```

### Données à adapter par nuisible
- **Couleur pastel** : chaque nuisible a sa couleur (blue=rats, lavender=souris, rose=punaises, peach=cafards, gold=guêpes, mint=fourmis, green=moustiques)
- **Image** : schéma crayon + photo signs
- **Stats hero** : 4 chiffres clés spécifiques
- **Radar** : 6 axes (Dangerosité, Reproduction, Résistance, Discrétion, Agilité, Intelligence)
- **Espèces** : 2 variantes à comparer
- **Maladies** : liste spécifique au nuisible
- **FAQ** : 6 questions spécifiques
- **Cohabitants** : 4 nuisibles liés
- **Données calendrier** : saisonnalité spécifique
- **Score de risque** : critères adaptés au nuisible

## SEO — Regles
- **Architecture** : voir `SEO-ARCHITECTURE.md` pour la structure URL complete, le double arbre Particulier/Pro, les templates geo programmatiques
- **Anti-cannibalisation** : voir `SEO-INTENTIONS-RECHERCHE.md` — chaque page a ses questions AUTORISEES et INTERDITES
- **Inventaire pages** : voir `SEO-PAGES-LISTE-GLOBALE.md` — toutes les pages avec KW, volumes, types
- **Brief marketing** : voir `MARKETING-BRIEF.md` — souffrances clients, psychologie, arguments de conversion
- **Regle cardinale** : 1 intention de recherche = 1 seule page. Jamais de cannibalisation.
- **Ancien nom** : toute reference a "Ciao Nuisible" doit etre remplacee par "Sanalia"
- **Domaine** : le site est sur `https://www.sanalia.fr` (avec www). Le root `sanalia.fr` redirige vers `www.sanalia.fr`.

### 🔴 RÈGLE D'OR ANTI-CANNIBALISATION (URL pattern)

**Cette règle est NON-NÉGOCIABLE. Chaque nuisible peut avoir au maximum 2 pages, une par intent, avec un pattern URL strict :**

| Pattern URL | Intent | Contenu autorisé | Contenu INTERDIT |
|-------------|--------|-----------------|-------------------|
| `/nuisibles/[espece]/` | 🔵 **Informationnel** (biologie, identification) | Espèces, cycle de vie, dangers sanitaires, signes de présence, photos d'identification, prévention générale, FAQ biologique | ❌ Grille prix, ❌ Déroulé d'intervention, ❌ CTA service agressif, ❌ Durées de traitement, ❌ Comparatif méthodes pro |
| `/deratisation/[espece]/` (rongeurs : rats, souris, taupes) ou `/desinsectisation/[espece]/` (insectes : cafards, punaises, guêpes, fourmis, moustiques, puces, chenilles, mites) | 🟠 **Commercial / Transactionnel** (service) | Méthodes pro, produits utilisés, nombre de passages, durée, prix indicatifs, garanties, préparation logement, CTA devis | ❌ Biologie de l'espèce, ❌ Photos identification, ❌ Cycle de vie, ❌ Listes maladies transmises |

**Conséquences concrètes :**
1. Chaque espèce = 1 page `/nuisibles/[espece]/` + 1 page `/[service]/[espece]/` max, JAMAIS de troisième page.
2. La page `/nuisibles/[espece]/` termine toujours avec un CTA renvoyant vers `/[service]/[espece]/` (flèche "J'ai ce problème → Voir le traitement"). L'inverse est un lien discret en bas ("En savoir plus sur l'espèce →").
3. Les Titles doivent être radicalement différents :
   - Info : `"[Espèce] — Guide d'identification, dangers & solutions"`
   - Service : `"Traitement [espèce] / [Service] — Méthodes pro & devis"`
4. Les pages génériques (`/deratisation/`, `/desinsectisation/`) ciblent le service global et relaient vers les spécialités espèce.
5. Si un nuisible n'a pas de page service dédiée (ex : taupes), la page `/nuisibles/[espece]/` capture les 2 intents via un CTA service fort, MAIS il faut alors créer la page service dès que le volume le justifie (> 500 recherches/mois sur "traitement X" ou "[service] X").

**Exceptions documentées :**
- `/traitement-termites/` reste un pilier séparé (PAS dans `/desinsectisation/termites/`) car diagnostic obligatoire + traitement bois + réglementation spécifique.
- Les méthodes sous-spécialisées (ex : `/traitement-thermique-punaises/`) sont autorisées SI elles ciblent un KW distinct (volume ≥ 500) et si le contenu ne recoupe pas la page principale `/desinsectisation/punaises-de-lit/`.

**Vérification avant création d'une page :**
1. Ouvrir la SERP Google pour le KW cible sur Chrome incognito.
2. Si les 5 premiers résultats sont des pages info (Wikipedia, gouv.fr, Ameli) → cible la page `/nuisibles/`.
3. Si les 5 premiers résultats sont des pages commerciales (entreprises, prestataires) → cible la page `/[service]/[espece]/`.
4. Si la SERP mélange les 2 → **NE PAS créer une nouvelle page**, enrichir la page existante avec le meilleur intent et surveiller le ranking.

## SEO Technique — Checklist OBLIGATOIRE avant chaque deploiement
**Cette checklist DOIT etre verifiee avant chaque push/deploiement. C'est un site SEO, le technique doit etre parfait.**

1. **Meta title** : chaque page a un `<title>` unique, < 60 caracteres, avec le keyword cible
2. **Meta description** : chaque page a un `<meta name="description">` unique, 120-155 caracteres, avec CTA
3. **Canonical** : chaque page a un `<link rel="canonical" href="https://www.sanalia.fr/...">` correct
4. **Open Graph** : og:title, og:description, og:type, og:url, og:image, og:locale sur chaque page
5. **Twitter Card** : twitter:card, twitter:title, twitter:description, twitter:image sur chaque page
6. **Schema.org** : JSON-LD adapte au type de page (LocalBusiness, Service, Article, FAQPage, BreadcrumbList)
7. **H1 unique** : exactement 1 seul H1 par page, contenant le keyword cible
8. **Hierarchie Hn** : H1 > H2 > H3, jamais de saut de niveau
9. **Images** : tous les `<img>` ont un attribut `alt` descriptif avec keyword quand pertinent
10. **Liens internes** : chaque page a au moins 3 liens internes vers d'autres pages du site
11. **sitemap.xml** : a jour avec toutes les pages publiques, pas de pages noindex
12. **robots.txt** : present, pointe vers le sitemap, bloque les pages privees (/merci/)
13. **noindex** : la page /merci/ a `<meta name="robots" content="noindex, follow">`
14. **Accents** : TOUS les textes ont les accents francais corrects (regle n°9)
15. **URLs** : toutes les URLs canoniques utilisent `https://www.sanalia.fr` (avec www)
16. **Performance** : images optimisees, CSS/JS minifies, pas de ressources bloquantes inutiles
17. **Mobile** : toutes les pages sont responsive et passent le test Mobile-Friendly

### 🔴 RÈGLE D'OR SITEMAP (NON-NÉGOCIABLE)

**TOUTE PAGE INDEXABLE DOIT ÊTRE DANS LE SITEMAP.** Avant chaque commit qui ajoute, supprime ou renomme une page HTML, vérifier :

1. **Toute nouvelle page indexable** (sans `<meta name="robots" content="noindex">`) DOIT être ajoutée à `sitemap.xml` (pages générales) ou `sitemap-blog.xml` (articles blog/conseils) avec :
   - `<loc>https://www.sanalia.fr/[chemin]/</loc>` (URL canonique avec www)
   - `<lastmod>YYYY-MM-DD</lastmod>` (date du dernier changement)
   - `<changefreq>` adapté (weekly pour services / pages prio, monthly pour fiches, monthly pour blog)
   - `<priority>` cohérent (1.0 pour homepage, 0.9 services pilier, 0.8 géo P1, 0.7 fiches/pro, 0.6 institut, 0.5-0.6 secondaire)

2. **Toute page supprimée ou renommée** DOIT être retirée du sitemap, et idéalement avoir un redirect 301 dans `_redirects`.

3. **Pages noindex légitimes** (ex : `/merci/`) ne doivent JAMAIS apparaître dans le sitemap. Les ajouter à `_redirects` ou via `<meta name="robots" content="noindex, follow">`.

4. **`/sitemap-index.xml`** est la racine officielle déclarée dans `robots.txt` ; il agrège `/sitemap.xml` + `/sitemap-blog.xml`. Les 3 fichiers doivent toujours être à jour ensemble.

5. **`<lastmod>` du sitemap parent** (`sitemap-index.xml`) doit être bumpé à chaque modification d'un sitemap enfant, pour informer Googlebot.

**Procédure de vérification (avant chaque push)** :
```bash
# Comparer les pages publiques aux URLs du sitemap
python3 -c "
import os, re
pages = {os.path.relpath(os.path.join(r,'index.html')).replace('/index.html','/').replace('index.html','/') for r,d,f in os.walk('.') if 'index.html' in f and not r.startswith('./.') and 'components' not in r and 'node_modules' not in r}
sitemap = set()
for sm in ['sitemap.xml','sitemap-blog.xml']:
    if os.path.exists(sm):
        sitemap |= set(re.findall(r'<loc>https?://www\.sanalia\.fr(/[^<]*)</loc>', open(sm).read()))
noindex = {p for p in pages if 'noindex' in open(p.lstrip('/').rstrip('/')+'/index.html' if p!='/'else 'index.html').read()}
missing = pages - sitemap - noindex
extra = sitemap - pages
print('Manquantes :', missing or 'OK')
print('En trop :', extra or 'OK')
"
```

**Sanction** : tout commit ajoutant une page sans entrée sitemap correspondante doit être amendé immédiatement.

## Blog Sanalia — Architecture et conventions

### Structure URL
```
/blog/                                                  → Hub (index)
/blog/[slug-article]/                                   → Article (URL à plat, slug unique)
/blog/feed.xml                                          → RSS feed
/sitemap-blog.xml                                       → Sitemap blog
```

Le sitemap racine est désormais `/sitemap-index.xml` qui agrège `/sitemap.xml` (pages non-blog) et `/sitemap-blog.xml` (blog). Le `robots.txt` pointe sur l'index.

### 🔴 RÈGLE D'OR — URL et breadcrumb blog (NON-NÉGOCIABLE)

1. **URL article** : TOUJOURS `/blog/[slug-article]/` à plat. JAMAIS de sous-dossier de catégorie. Les anciennes URLs `/blog/rats-souris/...`, `/blog/prevention/...`, etc. sont **interdites**. Le `slug` doit être suffisamment descriptif pour éviter toute collision (ex : `comment-se-debarrasser-des-rats` plutôt que `rats`).

   **🔴 INTERDICTION ABSOLUE — Jamais d'année dans le slug.** Aucun slug d'URL (blog OU n'importe quelle autre page du site) ne doit contenir une année (`2024`, `2025`, `2026`, etc.). Cela vaut aussi pour les versions courtes (`-24`, `-25`). Raison : un slug avec année rend l'URL périssable, vieillit le contenu aux yeux de Google et oblige à des redirects 301 chaque année. Le contenu doit être **evergreen**. L'année peut figurer dans le `<title>`, le H1 et le corps de l'article (ex : « Pièges à rats : lesquels choisir en 2026 ? ») et être mise à jour à chaque revue, mais **JAMAIS dans l'URL**. Exemples : `/blog/hantavirus-rats-symptomes-prevention/` ✅ et non `/blog/hantavirus-rats-symptomes-prevention-france-2026/` ❌ ; `/blog/calendrier-nuisibles-france/` ✅ et non `/blog/calendrier-nuisibles-2026/` ❌.

2. **Breadcrumb (HTML + JSON-LD `BreadcrumbList`)** : 4 niveaux pour un article rattaché à un nuisible, 3 niveaux sinon. Le 3ème niveau pointe **toujours** vers la fiche `/nuisibles/[espece]/`, **jamais** vers une catégorie blog.
   - Position 1 : `Accueil` → `/`
   - Position 2 : `Blog` → `/blog/`
   - Position 3 : Nom du nuisible (ex : `Rats`, `Cafards`) → `/nuisibles/[parentNuisible]/` (utiliser le champ `parentNuisible` du data model, pas le `category`)
   - Position 4 : Titre de l'article (sans lien)

   Exemple : `Accueil > Blog > Rats > Se débarrasser des rats en appartement` (URL : `/blog/comment-se-debarrasser-rats-appartement/`).
   
   Si l'article est strictement transverse (pas de nuisible parent identifiable), le breadcrumb a 3 niveaux : `Accueil > Blog > Titre`.

3. **Maillage SEO** : le blog s'appuie sur l'arbre `/nuisibles/` plutôt que sur ses propres pillars. Les anciennes pillars `/blog/rats-souris/`, `/blog/punaises-de-lit/`, `/blog/cafards-insectes/`, `/blog/guepes-frelons/`, `/blog/prevention/` sont redirigées (301) vers `/nuisibles/[espece]/` ou `/reglementation/` dans `_redirects`. **Ne pas les recréer**.

4. **Distinction `category` vs `parentNuisible`** :
   - `category` (cluster éditorial) → tag thématique visible, classification RSS, filtre du hub. **Ne structure ni l'URL, ni le breadcrumb.**
   - `parentNuisible` (slug d'une fiche `/nuisibles/[espece]/`) → utilisé pour le breadcrumb position 3 et pour le maillage avec la fiche nuisible. Peut être `null` si transverse.

### 🔴 RÈGLE D'OR — Template article (NON-NÉGOCIABLE)

Tout nouvel article de blog DOIT reproduire **fidèlement** la structure visuelle et technique de `/blog/comment-se-debarrasser-rats-appartement/index.html` — c'est le **template de référence canonique**.

#### Composants obligatoires (dans l'ordre du DOM)

1. **`<head>` complet** :
   - Meta SEO : `<title>` < 60 car, `<meta description>` 120-155 car, `<link rel="canonical">` avec `https://www.sanalia.fr/blog/[slug]/`
   - Open Graph complet : `og:title`, `og:description`, `og:type=article`, `og:url`, `og:image` (1200×630), `og:locale=fr_FR`, `article:published_time`, `article:modified_time`, `article:section`
   - Twitter Card complet : `summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
   - JSON-LD `@graph` avec **3 entités obligatoires** :
     - `Article` (author = `Organization Sanalia`, publisher avec logo SVG, `wordCount`, `inLanguage=fr-FR`, `datePublished`, `dateModified`)
     - `BreadcrumbList` 4 niveaux (position 3 → `/nuisibles/[parentNuisible]/`, cf règle d'or breadcrumb ci-dessus)
     - `FAQPage` (au minimum 6 paires question/réponse alignées avec la section FAQ visible)
2. `<div class="reading-progress">` — barre de progression de lecture (top fixed)
3. **Header** inliné via `data-component="header"`
4. `<div class="breadcrumb-bar">` — breadcrumb sticky avec dropdown nuisibles (`.breadcrumb-nuisible-wrap`)
5. `<section class="blog-hero">` — hero comportant :
   - `.blog-hero-category.tag-[nuisible]` (picto + nom catégorie selon mapping ci-dessous)
   - H1 unique avec le keyword cible
   - méta : auteur, date publication, `readingTime`
   - image hero 1200×630
6. **Layout 2 colonnes** `.page-layout` :
   - `<aside class="blog-share-col">` — share buttons fixes (colonne gauche desktop)
   - `<article>` — corps principal
   - `<aside class="blog-sidebar">` avec `.sidebar-sticky` contenant :
     - `<nav class="blog-toc">` — table des matières auto-générée depuis les H2 numérotés
     - `.cta-sidebar-widget` — bloc CTA (mono label + titre + texte + bouton "Devis gratuit")
7. **Corps article** (`<article>`) :
   - Sections **H2 numérotées** (`1. Identifier…`, `2. Comprendre…`, etc.) avec **ancres `id`** correspondant aux entrées du TOC
   - Sous-sections H3
   - **Callouts contextuels** (`.callout.callout-did-you-know` minimum) — au moins 1 par article
   - **3 CTAs inline** `<div class="cta-inline-blog" data-variant="…">` insérés à environ **25 %**, **50 %** et **80 %** du contenu (cf règles conversion). Le `data-variant` s'aligne sur `intentType`.
   - Section finale **H2 « Questions fréquentes »** avec **accordéon** (`<button class="accordion-header">…<span class="icon-toggle">+</span></button>`) — Q/A strictement alignées avec le JSON-LD `FAQPage`
8. **Sticky share bar bottom** (`.share-bar-btn` X, LinkedIn, Facebook + bouton copier le lien)
9. `<section class="related-articles">` — exactement **3 cartes** :
   - 1 article connexe du même thème
   - 1 fiche `/nuisibles/[parentNuisible]/`
   - 1 lien vers `/blog/` (hub)
10. **Footer + certifications** inlinés via `data-component` (jamais réécrire ici, modifier `components/`)
11. **Tracking dataLayer** : tous les events `blog_*` listés en section *Tracking* doivent être câblés via `/js/blog.js`

#### Interdictions

- ❌ Inventer de nouveaux composants ou layouts non présents dans le template
- ❌ Omettre une section sans justification éditoriale documentée et alignement avec un autre article validé
- ❌ Renommer ou modifier les classes CSS canoniques (`.blog-hero`, `.cta-inline-blog`, `.blog-toc`, `.cta-sidebar-widget`, `.related-articles`, `.callout-*`, `.share-bar-btn`, etc.)
- ❌ Inliner des styles spécifiques à l'article : tout passe par `/css/blog.css`
- ❌ Réécrire `header.html`, `footer.html`, `certifications.html`, `mobile-sticky-cta.html` directement dans l'article (ils sont injectés par `build.sh` depuis `components/`)
- ❌ Omettre une des 3 entités JSON-LD (Article + BreadcrumbList + FAQPage)

#### Variations autorisées

- Le **nombre de sections H2** peut varier (5 à 10 selon le sujet) tant qu'elles restent numérotées et ancrées dans le TOC
- Le **`data-variant` des CTAs inline** s'adapte à `intentType` (`devis` / `urgence` / `guide`)
- Plusieurs types de **callouts contextuels** sont possibles (`callout-did-you-know`, `callout-warning`, etc.) tant que la classe existe dans `blog.css`
- Le **`readingTime`** reflète le contenu réel (`wordCount` ÷ 250, arrondi à la minute)
- Le **tag pastel** suit le mapping `parentNuisible` → couleur (cf section *Convention tag thématique blog*)

### Catégories (clusters éditoriaux — pour `category`, pas pour l'URL)
- **rats-souris** : rongeurs (rats, souris, mulots)
- **punaises-de-lit** : punaises de lit
- **cafards-insectes** : cafards et autres insectes rampants
- **guepes-frelons** : hyménoptères (guêpes, frelons, abeilles)
- **prevention** : prévention, hygiène et obligations légales (slug court, nom affiché : « Prévention & Réglementation »)

### Data model article (à respecter même sans CMS)
Chaque article doit porter les champs suivants (dans le `<head>` + JSON-LD + front visible) :
- **title** (H1 unique)
- **metaTitle** (< 60 caractères)
- **metaDescription** (120-155 caractères)
- **slug** (kebab-case, descriptif, sans accents ni stopwords inutiles — c'est l'URL `/blog/[slug]/`)
- **category** (une des 5 catégories — sert au tag thématique visible, à la classification RSS et au filtre du hub. **Ne structure ni l'URL ni le breadcrumb**.)
- **parentNuisible** (slug d'une fiche `/nuisibles/[espece]/`, ex : `rats`, `cafards`, `punaises-de-lit` — utilisé pour le breadcrumb position 3 et le maillage. Peut être `null` si l'article est strictement transverse, le breadcrumb passe alors à 3 niveaux.)
- **tags** (3 à 6 tags)
- **publishedAt**, **updatedAt** (ISO 8601)
- **readingTime** : calculé automatiquement (nombre de mots / 250, arrondi à la minute)
- **intentType** : `informational` | `transactional` | `urgency` | `prevention` | `regulatory`
- **primaryCTA** : adapté à l'intent (voir règles conversion)
- **author** : toujours `Organization Sanalia` (E-E-A-T : entité morale certifiée Certibiocide)
- **publisher** : Sanalia avec logo SVG
- **Hero image** : 1200x630 minimum (format OG/Twitter)
- **JSON-LD** : `Article` + `BreadcrumbList` (3ème niveau → `/nuisibles/[parentNuisible]/`) + `FAQPage` (si FAQ présente)

### Règles conversion
- **CTA inline** déclenchés à **25%**, **50%** et **80%** du scroll (3 insertions dans l'article)
- **3 variantes CTA** contrôlées par `data-variant` :
  - `data-variant="devis"` → informational / prevention → "Obtenir un devis gratuit"
  - `data-variant="urgence"` → urgency / transactional → "Intervention sous 4h - Appeler maintenant"
  - `data-variant="guide"` → regulatory → "Télécharger le guide PDF"
- Le CTA principal de l'article doit correspondre à son `intentType`
- **Floating CTA mobile** : affiché après 30% de scroll, masquable
- **Sidebar widget desktop** : sticky avec mini-formulaire (nom, téléphone, code postal)
- **Newsletter CTA** : bloc en fin d'article, avant le footer

### Tracking (dataLayer events)
Tous les articles doivent pousser ces events dans `window.dataLayer` :
- `blog_article_view` — au chargement de la page (payload : slug, category, intentType)
- `blog_scroll_depth` — paliers `25`, `50`, `75`, `100` (une seule fois par palier)
- `blog_cta_view` — quand un CTA entre dans le viewport (payload : variant, position)
- `blog_cta_click` — au clic sur un CTA (payload : variant, position, destination)
- `blog_internal_link_click` — clic sur un lien interne dans le corps de l'article
- `blog_share_click` — clic sur un bouton de partage (payload : network)
- `blog_newsletter_signup` — soumission formulaire newsletter
- `blog_phone_click` — clic sur un lien `tel:`
- `blog_form_start` — premier focus dans le formulaire sidebar ou inline

### Convention tag thématique blog

Pour tout tag thématique (catégorie nuisible dans un article ou liste), utiliser cette structure :

```html
<span class="blog-hero-category tag-[nuisible]">
  <img src="/assets/nuisibles/[picto].png" class="pill-icon" alt="">
  [Nom de la catégorie]
</span>
```

Mapping nuisible → classe + picto :
- Rats → `tag-rats` + `brown-rat--realistic-body-shape--long-tail--pointe.png` (bg pastel gold)
- Souris → `tag-souris` + `house-mouse--mus-musculus--realistic-body-shape--l.png` (bg pastel lavender)
- Punaises → `tag-punaises` + `bed-bug--cimex-lectularius--realistic-body-shape--.png` (bg pastel rose)
- Cafards → `tag-cafards` + `cockroach--realistic-body-shape--flat-oval-body--l.png` (bg pastel mint)
- Guêpes → `tag-guepes` + `european-wasp--vespula-vulgaris--realistic-body-sh.png` (bg pastel gold)
- Fourmis → `tag-fourmis` + `black-garden-ant--lasius-niger--realistic-body-sha.png` (bg pastel rose)
- Moustiques → `tag-moustiques` + `common-mosquito--culex-pipiens--realistic-body-sha.png` (bg pastel blue)
- Pigeons → `tag-pigeons` + `feral-pigeon--columba-livia--realistic-body-shape-.png` (bg pastel mint)
- Prévention/Réglementation → `tag-prevention` + 🛡️ (emoji) (bg pastel lavender)

Le CSS de ces tags est défini dans `/css/blog.css` (section `.blog-hero-category.tag-*`). Couleur pastel alignée sur la couleur du thumbnail nuisible.

### Fichiers CSS/JS blog
- `/css/blog.css` — design system spécifique blog (typo long-form, sidebar, TOC, reading progress, cards articles)
- `/js/blog.js` — logique partagée : table des matières (TOC) auto-générée, barre de progression de lecture, boutons de partage, affichage conditionnel des CTAs selon scroll, push des events dataLayer

### Comment ajouter un article
1. **Créer le dossier** `/blog/[slug]/` (URL à plat, kebab-case, sans accents ni stopwords inutiles, **JAMAIS** de sous-dossier de catégorie)
2. **Créer `index.html`** en **copiant intégralement** le template canonique `/blog/comment-se-debarrasser-rats-appartement/index.html`, puis adapter le contenu. Cf **« 🔴 RÈGLE D'OR — Template article »** : aucun composant ne doit être omis ni réinventé.
3. **Adapter** : `title`, `meta`, `H1`, sections H2 numérotées + ancres, callouts, 3 CTAs inline (variant aligné sur `intentType`), FAQ HTML + JSON-LD FAQPage, dates `publishedAt` / `updatedAt`, `wordCount`, `readingTime`
4. **Renseigner `parentNuisible`** (slug d'une fiche `/nuisibles/[espece]/`) et le refléter dans :
   - Le breadcrumb HTML (position 3 → `<a href="/nuisibles/[parentNuisible]/">[Nom]</a>`)
   - Le JSON-LD `BreadcrumbList` (position 3 : `"item": "https://www.sanalia.fr/nuisibles/[parentNuisible]/"`)
   - Si `parentNuisible` est `null` (article transverse), le breadcrumb passe à 3 niveaux (Accueil > Blog > Titre)
5. **Vérifier le canonical, og:url, twitter:image, share URLs** : tous doivent pointer vers `https://www.sanalia.fr/blog/[slug]/`
6. **Ajouter l'URL** dans `/sitemap-blog.xml` (priority 0.7, changefreq monthly) et bumper `<lastmod>` de `/sitemap-index.xml` à la date du jour
7. **Ajouter l'item** dans `/blog/feed.xml` (mettre à jour `lastBuildDate` du channel)
8. **Insérer l'article dans le hub `/blog/index.html`** — cf **« 🔴 RÈGLE D'OR — Insertion d'un article dans le hub »** ci-dessous. Le hub utilise un système de slots HTML annotés `<!-- BLOG-HUB-SLOT: ... -->` ; chaque nouvel article doit être inséré dans les slots du meilleur emplacement (À la une / Dernières publications / Saison / Par espèce / Cluster).
9. **Linker l'article** depuis la fiche `/nuisibles/[parentNuisible]/` (section "À lire également" ou bloc conseils) et/ou depuis un autre article du même thème (≥ 1 lien interne entrant en plus du hub).
10. **Vérifier** : accents français (règle d'or n°9), liens internes (≥ 3), `alt` sur images, canonical avec `https://www.sanalia.fr` (avec www), OG/Twitter complets, breadcrumb cohérent HTML ↔ JSON-LD
11. **Commit + push** (Cloudflare Pages déploie automatiquement via `build.sh`)

### 🔴 RÈGLE D'OR — Insertion d'un article dans le hub `/blog/index.html` (NON-NÉGOCIABLE)

**Tout article publié DOIT être inséré dans le hub `/blog/index.html` au moment de sa publication.** Le hub utilise des **markers HTML annotés `<!-- BLOG-HUB-SLOT: ... -->`** pour identifier les zones d'insertion. Le hub n'est PAS une vitrine statique : c'est un index vivant qui doit refléter en temps réel les articles publiés.

Le CSS et le HTML utilisent le préfixe **`bv2-`** (Blog v2). Les sections sans aucun article publié sont **commentées en HTML** (encore présentes dans le DOM source mais invisibles côté rendu) pour préserver le SEO ; il suffit de les décommenter dès qu'un premier article du thème est publié.

#### Slots du hub et règles d'attribution

Le hub contient **5 zones** dans lesquelles un article doit potentiellement apparaître. Pour chaque nouvel article, vérifier les 5 zones et insérer là où c'est pertinent (la plupart des articles iront dans **2 à 4 zones** simultanément).

| Zone | Marker | Capacité | Quand y insérer | Action |
|------|--------|----------|-----------------|--------|
| **« À la une »** (`.bv2-feat-left`) | `<!-- BLOG-HUB-SLOT: featured-big -->` (×1) et `<!-- BLOG-HUB-SLOT: featured-small -->` (×2) | 3 cards (1 big + 2 small) | Article pillar / long-form OU sélection éditoriale exceptionnelle. Le big = dossier de référence (8+ min), les 2 small = articles forts récents. Faire tourner : remplacer le plus ancien des 3 si le nouveau est éligible. | Adapter `href`, classe `.bv2-fcard-illu .bg-*`, `.bv2-fcard-pill`, `<img src>`, `.bv2-fcard-illu-label strong + span`, `.bv2-fcard-kicker` (catégorie · min), `.bv2-fcard-title`, `.bv2-fcard-excerpt`, `.bv2-fcard-foot` (auteur · date). |
| **« Les dernières publications »** (`.bv2-latest-list`) | `<!-- BLOG-HUB-SLOT: latest-publication -->` | 10 items max | **TOUJOURS** : tout nouvel article doit être inséré en tête de liste. Supprimer le 10ᵉ item (le plus ancien) si la liste est déjà pleine. | Insérer `<li><a class="bv2-latest-item">` avec `.bv2-latest-avatar.bg-[nuisible]` + img, `<h4>` titre, `<p>` "ÉQUIPE SANALIA · N MIN · JJ MMM YYYY". |
| **« Dossier saison »** (`.bv2-dossier-grid`) | `<!-- BLOG-HUB-SLOT: season-summer / season-spring / season-autumn / season-winter -->` | 6 cards par saison | Si l'article est saisonnier (moustiques/guêpes en été, rongeurs en hiver/automne, fourmis/frelons au printemps). Le titre du dossier change selon la saison courante. | Insérer un `<a class="bv2-dcard">` avec `.bv2-dcard-avatar.bg-[nuisible]` + img, `.bv2-dcard-cat` (catégorie uppercase), `.bv2-dcard-title`, `.bv2-dcard-foot` (min · date). |
| **« Guides terrain, par espèce »** (`.bv2-species-row`) | `<!-- BLOG-HUB-SLOT: species-group / [nuisible] -->` (1 par nuisible) | 1 row horizontal scroll par nuisible (Rats / Souris / Punaises de lit / Cafards & blattes / Guêpes & frelons / Moustiques / Pigeons / Fourmis / Taupes) | **TOUJOURS si `parentNuisible` ≠ null** : insérer dans le groupe `parentNuisible`. Si le groupe est **commenté HTML** (`<!-- ... -->`), le décommenter d'abord (premier article du nuisible). | Insérer `<a class="bv2-mcard">` au début du `.bv2-species-row` du bon groupe avec `.bv2-mcard-kicker` (type article uppercase), `.bv2-mcard-title`, `.bv2-mcard-foot` (min · date). Bumper `.bv2-species-count` (N ARTICLES). |
| **Clusters** (`.bv2-grid` dans `section.bv2-cat`) | `<!-- BLOG-HUB-SLOT: cluster / cat-[name] -->` (1 par cluster) | 5 clusters : `cat-prevention`, `cat-identification`, `cat-traitements`, `cat-pratiques`, `cat-actu` | **TOUJOURS** : mapper l'`intentType` au cluster (voir mapping ci-dessous). Si le cluster est commenté HTML, le décommenter d'abord. | Insérer `<a class="bv2-card">` dans `.bv2-grid` avec `.bv2-card-illu.bg-[nuisible]` + `.bv2-card-pill` + img, `.bv2-card-title`, `.bv2-card-excerpt`, `.bv2-card-foot` (auteur + min · date). Bumper `.bv2-cat-count strong` ET le `.bv2-fp-count` de la pill correspondante dans `.bv2-filter-pills` ET le compteur total `data-target="all"`. |

#### Mapping `intentType` → cluster

| `intentType` | Cluster cible (id) | Eyebrow |
|--------------|--------------------|---------|
| `prevention` | `cat-prevention` | GESTES · ROUTINES · BARRIÈRES |
| `informational` (identification, biologie, signes) | `cat-identification` | RECONNAÎTRE · TRACES · INDICES |
| `transactional` (méthodes, protocoles, comparatifs) | `cat-traitements` | PROTOCOLES · MÉTHODES · TERRAIN |
| `regulatory` (loi, démarches, modèles, HACCP) | `cat-pratiques` | DÉMARCHES · DROIT · OUTILS |
| `urgency`, actu, enquête, données saison, tribune | `cat-actu` | ENQUÊTES · DONNÉES · SAISON |

#### Mapping `parentNuisible` → classe pastel `.bg-*`

Utilisée pour les fonds illustrations / avatars / pills :

| `parentNuisible` | Classe bg |
|------------------|-----------|
| `rats` | `bg-rats` (gold) |
| `souris` | `bg-souris` (lavender) |
| `punaises-de-lit` | `bg-punaises` (rose) |
| `cafards` | `bg-cafards` (mint) |
| `guepes-frelons` | `bg-guepes` (gold) |
| `moustiques` | `bg-moustiques` (blue) |
| `pigeons` | `bg-pigeons` (mint) |
| `fourmis` | `bg-fourmis` (rose) |
| `taupes` | `bg-taupes` (peach) |
| transverse / prévention | `bg-default` (sand) |

#### Procédure d'insertion (algorithmique)

Pour chaque nouvel article :

1. **Identifier les zones cibles** :
   - Zone "Dernières publications" (TOUJOURS)
   - Zone "Par espèce" (si `parentNuisible` ≠ null, sinon skip)
   - Cluster correspondant à `intentType` (TOUJOURS)
   - Dossier saison (si saisonnier ET la saison courante)
   - À la une (uniquement si dossier pillar long-form ou validation éditoriale)

2. **Pour chaque zone cible** :
   - Trouver le marker `<!-- BLOG-HUB-SLOT: ... -->` correspondant
   - Si le slot est commenté en HTML (`<!-- ... -->`) car 0 article précédemment : **le décommenter** (suppression des `<!--` et `-->` + remplacement des `[insérer ici les ...]` et `N` placeholder par le vrai contenu)
   - Insérer le nouveau bloc HTML conforme au template du slot (voir tableau ci-dessus)

3. **Mettre à jour TOUS les compteurs** impactés :
   - `.bv2-species-count` (N ARTICLES) du groupe nuisible
   - `.bv2-cat-count strong` (N) du cluster
   - `.bv2-fp-count` (N) de la pill filter correspondante dans `.bv2-filter-pills`
   - Pill "Tout" `data-target="all"` (somme totale)

4. **Choisir le bon `.bg-*`** selon le `parentNuisible` (voir mapping ci-dessus).

5. **Vérifier en preview** : pas de placeholder visible, compteurs cohérents, layout respecté.

#### Sanction

Tout commit qui crée un article sans mettre à jour le hub `/blog/index.html` doit être amendé immédiatement. Le hub est la **vitrine principale du blog** : un nouvel article qui n'y figure pas est invisible aux yeux de Google (zéro lien interne entrant depuis la page la plus linkée du site).

## Sync Figma ↔ Code
1. User dit "update from Figma" → `get_variable_defs` / `get_design_context`
2. Comparer avec `tokens.css`
3. Mettre a jour `tokens.css` puis `style-guide.html`
4. Re-capturer vers Figma si besoin

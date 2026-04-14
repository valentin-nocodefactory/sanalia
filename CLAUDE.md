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

## Sync Figma ↔ Code
1. User dit "update from Figma" → `get_variable_defs` / `get_design_context`
2. Comparer avec `tokens.css`
3. Mettre a jour `tokens.css` puis `style-guide.html`
4. Re-capturer vers Figma si besoin

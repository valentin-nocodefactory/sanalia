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
└── SEO-PAGES-LISTE-GLOBALE.md      # Liste globale pages : URLs, H1, KW, volumes, KD, TP
```

## SEO — Regles
- **Architecture** : voir `SEO-ARCHITECTURE.md` pour la structure URL complete, le double arbre Particulier/Pro, les templates geo programmatiques
- **Anti-cannibalisation** : voir `SEO-INTENTIONS-RECHERCHE.md` — chaque page a ses questions AUTORISEES et INTERDITES
- **Inventaire pages** : voir `SEO-PAGES-LISTE-GLOBALE.md` — toutes les pages avec KW, volumes, types
- **Brief marketing** : voir `MARKETING-BRIEF.md` — souffrances clients, psychologie, arguments de conversion
- **Regle cardinale** : 1 intention de recherche = 1 seule page. Jamais de cannibalisation.
- **Ancien nom** : toute reference a "Ciao Nuisible" doit etre remplacee par "Sanalia"

## Sync Figma ↔ Code
1. User dit "update from Figma" → `get_variable_defs` / `get_design_context`
2. Comparer avec `tokens.css`
3. Mettre a jour `tokens.css` puis `style-guide.html`
4. Re-capturer vers Figma si besoin

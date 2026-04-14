# Sanalia — Design Rules

Regles de design accumulees au fil du projet. Ce fichier evolue a chaque decision de design.

---

## Typographie

### Uxum (font principale)
- Bold 700 : titres, boutons, accroches
- Regular 400 : paragraphes, descriptions
- Light 300 : textes longs, descriptions secondaires

### Space Mono (font system)
- Regular 400 uniquement
- Jamais de bold
- Jamais de couleur violette — uniquement gris neutre (#999, #666)
- Usage : titres de sections en MAJUSCULES, tags, codes hex, tokens, specs, labels

### Fonts interdites
- SansPlomb, Courier Prime, Inter — ne jamais utiliser

---

## Logo

- Wordmark SVG vectorise avec feuille violette
- Fichier source : `logo-sanalia.svg`
- Couleur texte : #0E052A
- Couleur feuille : #635DDD
- Ne jamais recreer le logo avec une font

---

## Couleurs

### Violet (marque)
- 900: #0E052A — texte principal, boutons dark
- 800: #34285A — texte sombre
- 600: #635DDD — couleur de marque
- 500: #7671D5 — accents texte
- 400: #8781F3 — violet medium
- 200: #CECCFC — violet clair
- 100: #E9E8FF — fonds legers

### Accent
- 500: #F66C24 — orange CTA
- 100: #FFE5CF — peach light

### Fonds
- Principal : #F6F5F0
- Sand : #F1ECDF
- Off-white : #FFFDF8
- Surface : #FFFFFF
- Gray light : #E5E5E5

### Pastels (categories)
- Blue : #B0D5F5 / #E6F3FF
- Lavender : #EFDFF6 / #FBF2FF
- Rose : #FFD4CF / #FFECE9
- Peach : #FFD4A7 / #FFF3E7
- Gold : #F4E9C1 / #FFFAE7
- Mint : #ABE0D1 / #E1F7F1
- Green : #C8EBB3 / #EAF9E0

---

## Boutons

| Variante | Background | Texte | Border |
|----------|-----------|-------|--------|
| Primary | #0E052A | white | — |
| Secondary | #635DDD | white | — |
| Accent | #F66C24 | white | — |
| Outline | transparent | #0E052A | 2px #0E052A |
| Ghost | #E9E8FF | #635DDD | — |

- Font : Uxum Bold 16px
- Padding : 13px 24px
- Border-radius : 8px

---

## Espacements

| Token | Valeur |
|-------|--------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

---

## Border Radius

| Token | Valeur |
|-------|--------|
| xs | 2px |
| sm | 4px |
| md | 8px |
| lg | 16px |
| xl | 20px |
| full | 100px |

---

## Regles strictes

1. Le mono (Space Mono) ne prend JAMAIS de bold
2. Le mono ne prend JAMAIS de couleur violette
3. Le fond principal est #F6F5F0
4. Le logo est toujours le SVG vectorise
5. Seulement 2 familles de fonts : Uxum + Space Mono
6. Les tokens sont dans `tokens.css`

---

## Illustrations

### Nuisibles en laine
- 11 visuels de nuisibles en style "laine tricotee" sur fond noir
- Dossier : `assets/nuisibles/`
- Style : texture laine/tricot realiste, fond noir, rendu 3D soft
- Nuisibles : rat, souris, cafard, fourmi, punaise de lit, moustique, guepe, pigeon, taupe, bacterie, moisissure
- Si places sur fond clair, detourer ou utiliser mix-blend-mode
- Ce style "laine" est un choix de DA fort : rend le sujet plus doux et accessible

---

## Historique des decisions

| Date | Decision |
|------|----------|
| 2026-04-11 | Creation du style guide initial |
| 2026-04-11 | Logo remplace par wordmark SVG vectorise avec feuille |
| 2026-04-11 | SansPlomb supprimee definitivement |
| 2026-04-11 | Courier Prime remplacee par Space Mono |
| 2026-04-11 | Regle : jamais de bold ni de violet sur le mono |
| 2026-04-11 | Fond cream change de #FAF6EC vers #F6F5F0 |
| 2026-04-11 | Ajout de 11 visuels nuisibles en style laine/tricot |

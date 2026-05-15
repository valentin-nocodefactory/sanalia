# Landing Pages Google Ads — Template Sanalia

Ce document décrit le **modèle canonique** à reproduire pour chaque nouvelle landing page (LP) destinée à du **trafic payant Google Ads** (et plus largement Meta, Bing, etc.).

> Référence vivante : [`/lp/punaises-de-lit-lyon/index.html`](lp/punaises-de-lit-lyon/index.html). Toute nouvelle LP DOIT être créée en copiant ce fichier puis en l'adaptant.

---

## 🎯 But d'une LP Ads (vs page SEO)

- **Convertir** un visiteur entrant via une annonce payante en lead qualifié
- **Mono-objectif** : un seul CTA principal (formulaire), pas de navigation transverse
- **Non indexable** : ne pollue pas le SEO du site (cf. règle anti-cannibalisation, CLAUDE.md)
- **Quick-load** : CSS/JS inline, images optimisées
- **Conformité Quality Score** : page rapide, claire, sans dark pattern

---

## 🔴 RÈGLES NON-NÉGOCIABLES

### 1. Emplacement & indexation

| Règle | Détail |
|---|---|
| **URL** | TOUJOURS `/lp/[slug-descriptif-localisé]/` (ex : `/lp/punaises-de-lit-lyon/`, `/lp/deratisation-marseille/`). JAMAIS à la racine. |
| **`<meta name="robots">`** | `noindex, nofollow` obligatoire dans le `<head>`. |
| **`robots.txt`** | `Disallow: /lp/` doit être présent (déjà fait, à conserver). |
| **`canonical`** | Pointer vers `https://www.sanalia.fr/lp/[slug]/` (auto-référent, JAMAIS canonicaliser vers la page service). |
| **PAS de sitemap** | Les LP ne doivent JAMAIS apparaître dans `sitemap.xml` ni `sitemap-index.xml`. |
| **PAS d'année dans le slug** | Règle d'or globale du projet (cf. CLAUDE.md). |
| **PAS de lien interne** | Les pages publiques du site ne doivent PAS pointer vers `/lp/*`. Les LP sont des destinations Ads pures. |

### 2. Architecture du fichier

Chaque LP est **un seul fichier HTML autonome** dans `/lp/[slug]/index.html` :
- CSS **inline** dans `<style>` (pas de fichier externe, sauf fonts)
- JS **inline** en bas du `<body>` (countdown + form submission)
- Images dans `/lp/[slug]/img/` (générées via Recraft ou Nano Banana)
- Logo : `/logo-sanalia.svg` self-hosted à la racine du projet (NE PAS dupliquer dans `/lp/`)
- Fonts Uxum chargées depuis `/fonts/` (chemins absolus)

**Pas de composants inlinés** par `build.sh` : les LP **ne dépendent pas** de `components/header.html` ou `components/footer.html`. Header et footer sont écrits en dur dans la LP, en version minimale (juste logo + tel + obligations légales). C'est volontaire pour la performance et l'isolation.

### 3. Tracking

- **Google Tag (gtag.js)** AW-18163028507 dans le `<head>` (déjà sur toutes les pages du site)
- Le `<form>` du hero POST vers le webhook **n8n** existant : `https://n8n.srv1336530.hstgr.cloud/webhook/alerte-val` (variable `SANALIA_LEAD_ENDPOINT` overridable via `window.SANALIA_LEAD_ENDPOINT`)
- Sur succès formulaire : déclencher un `gtag('event', 'conversion', {...})` avec le label de conversion correspondant à la campagne (à fournir à chaque nouvelle LP)
- Téléphone : `tel:0667464897` (le numéro Sanalia)
- Page de remerciement : `/merci/` (déjà existante, `noindex,follow`)

---

## 📐 Structure des sections (dans l'ordre du DOM)

| # | Section | Rôle | Above-the-fold ? |
|---|---|---|---|
| 1 | **Topbar** `.topbar` | Bandeau urgence localisé + tel cliquable | ✅ |
| 2 | **Header** `.header` | Logo Sanalia + bouton tel (pas de menu) | ✅ |
| 3 | **Countdown band** `<a class="countdown-band">` | Offre limitée + countdown live, **cliquable vers `#heroForm`** | ✅ |
| 4 | **Hero** `.hero` | 2 colonnes desktop (≥880px) : copy à gauche, **form 3-steps à droite** | ✅ |
| 5 | **Trust-strip** `.trust-strip` | "Ils nous font confiance à Lyon" : logos pros + badges Trustpilot/Google inline | Non |
| 6 | **Certifs** `.certifs` | Agréments officiels (Certibiocide, CS3D, QualiPro 3D, RC Pro AXA) | Non |
| 7 | **Pain points** `.pain-section` | 6 cartes douleurs (images + verbatims) | Non |
| 8 | **Protocole** `.section section-bg-sand` | Timeline tricolore + cards en **scroll horizontal full-bleed** | Non |
| 9 | **Why Sanalia** `.section` | 6 différenciateurs concrets (no boxes, pictos sans fond) | Non |
| 10 | **Avis** `.section section-bg-off` | Score Trustpilot+Google inline + 3 verbatims clients | Non |
| 11 | **Offer band** `.offer` | Card sombre avec grand countdown + CTA "Réserver mon créneau" | Non |
| 12 | **FAQ** `.section` | 6 questions accordion | Non |
| 13 | **Final CTA** `.final-cta` | Rappel offre + 2 CTAs + badges confiance | Non |
| 14 | **Footer minimal** `.footer-min` | Adresse + RC Pro + lien CGV | Non |
| 15 | **Sticky CTA mobile** `.sticky-cta` | Fixed bottom : "Mon devis gratuit" + icône tel | Mobile only |

### Détails du hero (le cœur de la LP)

- **Layout** : grid `minmax(0, 1.05fr) minmax(0, 0.95fr)` avec `gap: 40px` et `align-items: start` (form aligné au top, pas centré)
- **Breakpoint stack** : `@media (max-width: 880px)` → 1 colonne (form sous le copy)
- **Hero copy** (gauche) :
  - `.hero-promo` pill : "OFFRE LYON · Première intervention offerte !"
  - `<h1>` : 2 lignes, max ~5-6 mots par ligne, l'accent violet sur le mot-clé bénéfice (ex : "en finir")
  - `.hero-lead` : 2 phrases courtes, bullets en `<strong>` pour le scan
  - `.hero-bullets` : **3 arguments concrets** maximum (Efficacité / Devis / Disponibilité), `<strong>` en `display: inline !important`
  - `.hero-cta-row` : bouton principal violet + bouton ghost téléphone
- **Hero form** (droite) `.hero-form-card` :
  - 3 steps : (1) type logement, (2) surface + niveau infestation, (3) prénom + tel + CP
  - Progress bar fine en haut
  - Bouton submit "Recevoir mon devis"
  - Pas de ribbon "Offre Lyon" ici (déjà dans le countdown band)
  - Trust badges sous le form : "100 % gratuit · Sans engagement · Données protégées"

---

## 🎨 Règles de style (extensions du design system)

### Badges Trustpilot / Google — format unique inline

Utiliser **partout** le même cartouche `.hero-trust` (PAS de pill chip blanc) :

```html
<div class="hero-trust">
  <div class="hero-trust-item">
    <span class="hero-trust-icon" style="color:#00B67A;">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22…"/></svg>
    </span>
    <span class="hero-trust-text">
      <strong>Excellent</strong>
      <span>4,9/5</span>
    </span>
  </div>
  <div class="hero-trust-item">
    <span class="hero-trust-icon hero-trust-google"><!-- Google G svg --></span>
    <span class="hero-trust-text">
      <strong>Google</strong>
      <span>4,9/5</span>
    </span>
  </div>
</div>
```

Apparaît dans : `trust-strip` (sous les logos pros) ET section `avis` (sous le titre H2). JAMAIS dans le hero copy (on a déplacé pour ne pas surcharger).

### Why-section — pas de boites blanches

- `.why-card` : **pas de** `background`, **pas de** `border`, **pas de** `padding`, **pas de** `box-shadow`
- `.why-icon` : `background: transparent !important` — l'icône colorée se suffit
- Layout 3 colonnes desktop, 1 colonne mobile, gap aéré (40px 32px)

### Protocole — timeline + cards horizontal scroll

**Timeline 5 nœuds tricolores**, gradient sur la ligne de connexion :
- Nœuds 1-2-3 : violet `var(--color-primary-600)` (Jour J)
- Nœud 4 : orange `var(--color-accent-500)` (Jour J+15) — classe `.is-mid`
- Nœud 5 : vert `#1F8A5B` (Jour J+90) — classe `.is-last` / `.is-offered`
- Ligne `::after` : `linear-gradient(90deg, violet 0-60%, orange 60-80%, vert 80-100%)`

**Cards en horizontal scroll full-bleed** :
- `.protocol-grid` : `display: flex; overflow-x: auto; scroll-snap-type: x mandatory`
- Largeur 100vw, `margin-inline: calc(50% - 50vw)` pour casser le `.wrap`
- `padding-inline: max(24px, calc(50vw - 600px + 24px))` pour aligner la première card avec le contenu du wrap
- Cards : `flex: 0 0 320px` (desktop), `flex: 0 0 84%` (mobile)
- Card 4 : classe `.is-mid` + `ps-tag style="color:var(--color-accent-500);"` (orange)
- Card 5 : classe `.is-offered` + `ps-tag style="color:#1F8A5B;"` (vert)

### Countdown grand format (offer band)

- Desktop : `display: inline-flex` avec séparateurs ":" entre les blocs
- Mobile (≤520px) : `display: grid; grid-template-columns: repeat(4, 1fr)` + séparateurs `display: none`
- Évite le débordement sur petit écran

### Countdown band (haut de page)

- Wrapper : `<a class="countdown-band" href="#heroForm" onclick="…scrollIntoView({behavior:'smooth', block:'center'})…">`
- `cursor: pointer`, `text-decoration: none`, `:hover { filter: brightness(1.05) }`
- `:focus-visible` : outline blanc 3px pour accessibilité clavier

---

## ✏️ Patterns de copy (à respecter)

### Promesse de délai

**RÈGLE D'OR** : on parle **toujours d'intervention sous 24 h**. JAMAIS "intervention sous 4 h" (ancien claim retiré pour réalisme).

✅ Autorisé :
- "Disponibles en 24 h"
- "Intervention sous 24 h, 7 j/7, de 8 h à 20 h"
- "Sur Lyon centre, le délai moyen est souvent plus court" (formulation soft)
- `sortie 4 h · retour sécurisé` (durée opérationnelle post-biocide, pas une promesse de délai)
- `~ 30 min`, `~ 2 h`, `~ 4 h` dans les ps-footer des cards protocole (durée d'une action, pas un délai d'arrivée)

❌ Interdit :
- "Intervention sous 4 h"
- "Délai moyen 3 h 40"
- Toute promesse implicite d'arrivée < 24 h

### H1 du hero

Pattern : `[Bénéfice/Service] pour [verbe d'action accent] avec les [nuisible cible].`

Exemples :
- ✅ "Traitement professionnel pour **en finir** avec les punaises de lit."
- ✅ "Solution rapide pour **éradiquer** les cafards de votre cuisine."

L'accent violet (`<span class="accent">…</span>`) porte sur le **verbe d'action** ou le **bénéfice**, pas sur le nuisible.

### Lead hero (sous le H1)

Pattern : `Protocole professionnel [méthodes]. Disponibles en 24 h, [bénéfice court] !`

### Bullets hero (3 max)

Pattern : `<strong>[bénéfice]</strong> [précision courte]` — 3 bullets, JAMAIS plus.

✅ Modèle :
- **Efficacité redoutable** — N passages inclus
- **Devis en ligne** en 2 minutes
- **Intervention 7 j/7** · 8 h à 20 h

⚠️ Attention à la **virgule orpheline** : si le complément commence par une virgule, elle peut atterrir seule en début de ligne après un retour à la ligne. Préférer **point médian (·)** ou **tiret cadratin (—)** comme séparateur.

### Protocole — 5 étapes obligatoires

Le prospect doit sentir un accompagnement **complet sur 3 mois**, pas une intervention one-shot. Structure :

| # | Date | Étape | Durée typique |
|---|---|---|---|
| 1 | **Jour J** | Diagnostic | ~ 30 min |
| 2 | **Jour J** | Méthode 1 (ex : vapeur 180 °C) | ~ 2 h |
| 3 | **Jour J** | Méthode 2 (ex : barrière biocide) | ~ 1 h |
| 4 | **Jour J+15** | Contre-visite (tue ce qui a éclos depuis) | ~ 2 h |
| 5 | **Jour J+90** | Suivi 3 mois (WhatsApp + conseils + photos + prévention) | 90 jours |

Pour les nuisibles qui n'ont pas 2 méthodes complémentaires (ex : rats), adapter la card 2 et card 3 en sous-étapes du même type (ex : "appâts" + "pose de pièges"). La structure 3+1+1 reste.

### Outcome banner (sous les cards)

```
Résultat : 100 % des [nids/foyers] éliminés, suivi 3 mois inclus sur facture.

[5 étapes]              [3 mois]
D'accompagnement        Suivi inclus
```

(Pas de stat "~4h chez vous jour J" — confusion avec la promesse 24 h.)

### FAQ — 6 questions, pas plus

Toujours présentes :
1. Sous combien de temps intervenez-vous ?
2. Faut-il jeter mon matelas / mes meubles / mes affaires ?
3. Comment se passe l'estimation tarifaire ?
4. Le traitement est-il dangereux pour mes enfants / animaux ?
5. Et si ça revient ?
6. Vos techniciens sont-ils discrets vis-à-vis des voisins ?

À adapter au contexte du nuisible/zone (ex : pour cafards remplacer "matelas" par "vaisselle/placards").

---

## 🧪 Verification checklist avant deploy

À cocher avant tout commit/push d'une nouvelle LP :

- [ ] `<meta name="robots" content="noindex, nofollow">` présent
- [ ] `canonical` = `https://www.sanalia.fr/lp/[slug]/`
- [ ] OG + Twitter complets (title, description, image 1200×630)
- [ ] **Aucune** entrée dans `sitemap.xml` ou `sitemap-blog.xml`
- [ ] **Aucun** lien interne depuis une page publique du site vers la LP
- [ ] Formulaire câblé sur le webhook n8n
- [ ] Google Tag AW-18163028507 présent
- [ ] Tracking de conversion gtag en cas de success form
- [ ] Hero 2-col vérifié à 1280 px (form au-dessus de la ligne de flottaison)
- [ ] Stack 1-col vérifié à 768 px et 375 px
- [ ] Countdown band cliquable → ancre `#heroForm` smooth scroll
- [ ] Card 4 protocole en orange (`.is-mid`)
- [ ] Card 5 protocole en vert (`.is-offered`)
- [ ] Cards en horizontal scroll full-bleed, premier card aligné avec le H1
- [ ] Why-cards sans boites blanches, pictos sans fond
- [ ] Badges Trustpilot/Google inline (PAS de pill chip), présents dans `trust-strip` ET section `avis`
- [ ] Bullets hero : 3 args max, séparateur point médian ou em-dash (pas virgule en début de ligne)
- [ ] Tous les textes en accents français corrects
- [ ] Promesse 24 h uniquement (zéro mention "intervention 4 h")
- [ ] Mobile sticky CTA visible sur mobile
- [ ] FAQ en accordion fonctionnelle
- [ ] Test live : `curl -sI https://www.sanalia.fr/lp/[slug]/` → HTTP 200

---

## 🚀 Workflow pour créer une nouvelle LP

1. **Copier** `/lp/punaises-de-lit-lyon/index.html` vers `/lp/[nouveau-slug]/index.html`
2. **Copier** le dossier `/lp/punaises-de-lit-lyon/img/` (les 6 pain-points seront à régénérer adaptés au nouveau nuisible)
3. **Adapter** :
   - Slug, title, description, OG, canonical
   - H1 + lead + bullets selon le pattern
   - Contenu de chaque section (pain points, protocole adapté, FAQ)
   - Données de localité (ville, arrondissements, code postal)
   - Logos pros dans la trust-strip (adapter à la cible : copros pour Lyon, hôtellerie pour Paris, etc.)
   - Verbatims clients (les 3 reviews) avec prénom + arrondissement + type de logement cohérents
4. **Générer** les 6 images pain-points via Recraft ou Nano Banana (style cohérent avec les existantes, prompts dans `/lp/punaises-de-lit-lyon/img/` à adapter)
5. **Tester** sur `python3 -m http.server 8000` puis vérifier à 375/768/1024/1280
6. **Cocher** la checklist ci-dessus
7. **Commit** sur la branche worktree, **merge ff-only** sur main, **push** → Cloudflare auto-deploy

---

## 📌 LP existantes

| Slug | URL prod | Statut | Campagne Google Ads |
|---|---|---|---|
| `punaises-de-lit-lyon` | [/lp/punaises-de-lit-lyon/](https://www.sanalia.fr/lp/punaises-de-lit-lyon/) | ✅ Online (depuis 2026-05-15) | AW-18163028507 |

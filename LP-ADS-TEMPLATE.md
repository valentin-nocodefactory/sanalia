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

### 3. Tracking & conversion

- **Google Tag (gtag.js)** AW-18163028507 dans le `<head>` (déjà sur toutes les pages du site)
- Le `<form>` du hero POST vers le webhook **n8n** existant : `https://n8n.srv1336530.hstgr.cloud/webhook/alerte-val` (variable `SANALIA_LEAD_ENDPOINT` overridable via `window.SANALIA_LEAD_ENDPOINT`)
- Sur succès du formulaire :
  1. **Fire** `gtag('event', 'generate_lead', { send_to: 'AW-18163028507', event_callback: redirectToThankYou, event_timeout: 2000, … })` — l'`event_callback` garantit que la conversion est envoyée à Google AVANT la navigation
  2. **Fire-and-forget** le POST n8n avec `keepalive: true` (la requête survit à la navigation)
  3. **Redirect** vers `/thank-you/` après confirmation du callback gtag (ou fallback 2,2 s si gtag bloqué)
- **`/thank-you/`** est la page de remerciement DÉDIÉE aux landings Ads (distincte de `/merci/` qui sert le trafic organique). Elle est en `noindex,nofollow` et son URL est le **signal de conversion** que Google Ads matche pour les goals (destination URL contains `/thank-you`).
- Téléphone affiché : `tel:0667464897`
- **Ne PAS** appeler `showStep('success')` ou afficher une confirmation in-place — toujours rediriger pour que le tracking côté Ads voie bien la navigation.

#### Pattern JS canonique pour le submit (à copier-coller)

```js
var hasRedirected = false;
function redirectToThankYou() {
  if (hasRedirected) return;
  hasRedirected = true;
  window.location.href = '/thank-you/';
}

// 1. Conversion event + redirect callback (idéal côté Ads)
if (typeof gtag === 'function') {
  gtag('event', 'generate_lead', {
    send_to: 'AW-18163028507',
    event_callback: redirectToThankYou,
    event_timeout: 2000,
    nuisible: payload.nuisible,
    ville: payload.ville,
    // … autres params payload utiles à la segmentation
  });
  setTimeout(redirectToThankYou, 2200);  // fallback si gtag bloqué
} else {
  setTimeout(redirectToThankYou, 400);   // pas de gtag (ad blocker)
}

// 2. Lead vers n8n en parallèle (keepalive = survit au redirect)
if (N8N_LEAD_ENDPOINT) {
  fetch(N8N_LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(function (err) {
    console.error('Lead submit failed (n8n will retry from queue):', err);
  });
}
```

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
- [ ] Tracking de conversion gtag (`generate_lead` event) en cas de success form
- [ ] **Redirect vers `/thank-you/`** au lieu d'un `showStep('success')` in-place (essentiel pour le match Google Ads conversion URL)
- [ ] `/thank-you/` existe et répond HTTP 200 (`curl -I https://www.sanalia.fr/thank-you/`)
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
4. **Générer** les 6 images pain-points via Recraft (cf. section dédiée ci-dessous)
5. **Tester** sur `python3 -m http.server 8000` puis vérifier à 375/768/1024/1280
6. **Cocher** la checklist ci-dessus
7. **Commit** sur la branche worktree, **merge ff-only** sur main, **push** → Cloudflare auto-deploy

---

## 🎨 Brief Recraft — génération des 6 pain-points

Les 6 visuels des pain-points sont **toujours générés via le MCP Recraft** (`mcp__…__generate_image`), JAMAIS importés de stock ou recyclés d'une autre LP. Une régénération coûte 6 crédits Recraft (1 par image).

### Paramètres de génération (toujours les mêmes)

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| `model` | `recraftv3` | Compatible avec le style "Photorealism" (que `recraftv4_1` ne supporte pas) |
| `input_style` | `Photorealism` | Look documentaire/photo-réel, cohérent avec le ton empathique de la marque |
| `image_size` | `3:2` | Format paysage qui s'aligne avec l'aire d'affichage des cards (~320×220) |
| `n` | `1` (défaut) | On valide une image à la fois ; si insatisfaisant, on régénère |

### Direction artistique (NON-NÉGOCIABLE)

La marque Sanalia est **rassurante**, pas anxiogène (cf. CLAUDE.md → règles de direction artistique). Les visuels pain-points doivent suivre ces principes :

✅ **À faire**
- **Photographie documentaire candide** (35 mm look, profondeur de champ peu profonde, lumière naturelle)
- **Centrage humain quand pertinent** (personne inquiète, mère/enfant, geste de protection)
- **Décors français cohérents** : parquet bois, plinthe blanche, métro tile, fenêtres haussmanniennes, cuisine 10–15 m²
- **Suggestion plutôt que démonstration** : un homme qui écoute des bruits (pas le rat) ; une mère inquiète (pas l'enfant malade)
- **Lumière émotionnelle** : moonlight froid pour la nuit, golden hour pour les scènes diurnes
- **Format paysage 3:2** strictement

❌ **À éviter**
- Insectes/rongeurs en gros plan menaçants (sauf cas exceptionnel : la card "reproduction" peut montrer 1–2 sujets, suggérant le groupe)
- Plaies, blessures, sang, croûtes — JAMAIS de gore
- Personnes en panique extrême (cris, larmes visibles) — privilégier l'inquiétude sourde
- Imagerie médicale clinique (gants chirurgicaux, blouses) — la LP n'est pas un site santé
- Styles cartoon / illustration / 3D — toujours photo-réel

### Prompts canoniques (à adapter par nuisible)

Les 6 cards de pain-points suivent toujours la même grille narrative : **(1) bruit/présence**, **(2) traces visibles**, **(3) dégât matériel**, **(4) contamination alimentaire**, **(5) risque sanitaire/famille**, **(6) propagation**. Les prompts ci-dessous sont les patterns référence (LP `deratisation-lyon`), à adapter sémantiquement au nuisible cible.

| # | Slug suggéré | Pattern de prompt | Adaptations par nuisible |
|---|---|---|---|
| 1 | `pain-noise.png` | *"Photorealistic image of a worried person lying awake in a dark bedroom at night, listening intently to [signal sonore], slight frown of concern, soft moonlight through curtains, warm bedside lamp glow, [pas du nuisible visible], documentary candid photography, French apartment interior, cinematic atmospheric lighting, 35mm lens look"* | Rats : *"noises in the walls or ceiling"* — Cafards : *"scratching sounds at night"* — Souris : *"scurrying in the walls"* |
| 2 | `pain-droppings.png` (ou `pain-traces.png`) | *"Photorealistic forensic close-up of [trace caractéristique] on a wooden kitchen floor near a white baseboard, [détails spécifiques], French apartment kitchen, natural overhead lighting, documentary style, slightly unsettling but not gory, shallow depth of field"* | Rats : *"small dark rat droppings, grain-of-rice shaped pellets, faint grease smudge"* — Punaises : *"small black dots on bed sheet seam, blood smear traces"* — Cafards : *"dark cockroach droppings, oily smudge"* |
| 3 | `pain-damage.png` | *"Photorealistic forensic close-up of [dégât matériel typique], beige plaster wall behind, harsh natural lighting, documentary inspection photography style, sharp focus, professional pest control documentation"* | Rats : *"damaged electrical cable with exposed copper wires, gnawed plastic insulation showing teeth marks"* — Termites : *"hollow wooden beam with frass and sawdust"* — Mites : *"holed wool sweater"* |
| 4 | `pain-food.png` | *"Photorealistic image of a French pantry shelf with [aliment endommagé], signs of [nuisible] damage, white tiled wall behind, soft natural daylight, documentary style, sharp focus on damaged packaging, candid kitchen scene, no [nuisible] visible"* | Rats/souris : *"torn open paper bag of pasta, scattered dry pasta spilling out, punctured cereal box"* — Cafards : *"opened cereal box with brown stains, contamination"* |
| 5 | `pain-disease.png` (ou `pain-family.png`) | *"Photorealistic candid image of a young [parent French / personne âgée], [contexte familial/intime] with a concerned worried expression, looking down toward [zone à risque] with subtle anxiety, soft natural daylight through window, warm domestic atmosphere, intimate documentary style, no [nuisible] or pest visible"* | Adapter le contexte : mère/bébé pour pathogènes touchant l'enfant, personne âgée pour les maladies systémiques, adulte solo pour la honte/isolement |
| 6 | `pain-spread.png` | *"Photorealistic dim [pièce typique : grenier, cave, cloison], showing a glimpse of [1–2 spécimens du nuisible] partially hidden among [objets de contexte], suggestion of more beyond, dramatic side lighting from [source : skylight, prise de courant, fissure], documentary wildlife style, slightly menacing but not graphic, French residential setting, shallow depth of field"* | Rats : *"two brown rats among old cardboard boxes and yellow insulation in an attic"* — Punaises : *"a few bedbugs along a mattress seam, hint of others underneath"* — Cafards : *"two cockroaches near a sink drain, others suggested in the shadow"* |

### Conversion WebP → PNG (obligatoire)

Recraft renvoie en réalité du **WebP renommé `.png`** (`file *.png` → `RIFF Web/P image`). C'est OK pour les navigateurs modernes, mais on convertit en PNG natif pour la cohérence avec les autres LP du site et éviter les surprises CDN/cache. Sur macOS :

```bash
cd lp/[slug]/img && \
  for f in *.png; do
    sips -s format png "$f" --out "${f}.tmp" && mv "${f}.tmp" "$f"
  done && \
  file *.png  # vérifie "PNG image data, …"
```

Taille finale typique : **2.2–2.4 MB par image en 1536×1024**. Acceptable car `loading="lazy"` est activé sur tous les `<img>` du pain section. Si le poids global dépasse 15 MB cumulé, prévoir une compression `pngquant` ou un downsizing à 1200×800.

### Workflow Recraft pas à pas

1. Vérifier le crédit dispo via `mcp__…__get_user` (compter ~6 crédits = ~10 c€)
2. Générer les 6 images en parallèle (un seul message avec 6 appels `generate_image` simultanés)
3. Récupérer les `image_urls` depuis chaque output JSON
4. `curl -sL [url] -o lp/[slug]/img/pain-[slot].png` (6 téléchargements)
5. Convertir WebP → PNG via `sips` (cf. ci-dessus)
6. Si une image n'est pas convaincante : régénérer **uniquement celle-là** (ne pas refaire les 5 autres pour rien)
7. Vérifier dans le preview que les 6 `complete: true` et `naturalWidth > 0`

### Itération si rendu insatisfaisant

Si une image ne respecte pas la direction artistique (rat trop menaçant, personne trop dramatique, intérieur non-français, etc.) :

1. **Identifier le problème** précis : composition / sujet / éclairage / décor
2. **Ajuster le prompt** en ciblant l'écart : ajouter "no fear visible", "soft lighting", "French Haussmann style"
3. Régénérer **seulement la card concernée** (1 crédit)
4. NE PAS empiler 6 régénérations à l'aveugle — analyser puis ajuster.

---

## 📌 LP existantes

| Slug | URL prod | Statut | Campagne Google Ads |
|---|---|---|---|
| `punaises-de-lit-lyon` | [/lp/punaises-de-lit-lyon/](https://www.sanalia.fr/lp/punaises-de-lit-lyon/) | ✅ Online (depuis 2026-05-15) | AW-18163028507 |
| `deratisation-lyon` | [/lp/deratisation-lyon/](https://www.sanalia.fr/lp/deratisation-lyon/) | ✅ Online (depuis 2026-05-15) | AW-18163028507 |

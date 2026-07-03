#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════
// SANALIA — Rendu des pages ville « dératisation » depuis le modèle typé
// ------------------------------------------------------------------------
// Outil d'AUTORING (pas un pipeline de déploiement) : il lit chaque module
// content/villes/deratisation-*.mjs et réécrit, dans le fichier index.html
// EXISTANT, uniquement trois régions :
//   1. les balises meta du <head> (title, description, OG, Twitter),
//   2. le premier bloc JSON-LD,
//   3. la zone de contenu, délimitée par les marqueurs VILLE-CONTENT.
// Le reste (header, footer, styles, scripts, carte Leaflet par ville) est
// laissé INTACT. Idempotent : relançable sans dupliquer les marqueurs.
//
//   node scripts/render-villes.mjs          → réécrit les 5 pages dératisation
//   node scripts/render-villes.mjs --check  → échoue si un rendu diffère du disque
// ════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const VILLES_DIR = join(ROOT, 'content', 'villes');
const CHECK = process.argv.includes('--check');

const PHONE_DISPLAY = '06 67 46 48 97';
const PHONE_TEL = '0667464897';
const PHONE_INTL = '+33667464897';
const OG_IMAGE = 'https://www.sanalia.fr/assets/hero_technicienne.png';

// Coordonnées de centre-ville (faits publics) + code postal principal.
const CITY_GEO = {
  Lyon: { lat: 45.7640, lng: 4.8357, cp: '69003', street: '53 Rue Villeroy' },
  Paris: { lat: 48.8566, lng: 2.3522, cp: '75001' },
  Marseille: { lat: 43.2965, lng: 5.3698, cp: '13000' },
  Bordeaux: { lat: 44.8378, lng: -0.5792, cp: '33000' },
  Toulouse: { lat: 43.6047, lng: 1.4442, cp: '31000' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');

// Autres villes dératisation (pour le maillage bas de page).
const ALL_CITIES = [
  { name: 'Paris', href: '/deratisation/paris/' },
  { name: 'Lyon', href: '/deratisation/lyon/' },
  { name: 'Marseille', href: '/deratisation/marseille/' },
  { name: 'Bordeaux', href: '/deratisation/bordeaux/' },
  { name: 'Toulouse', href: '/deratisation/toulouse/' },
];
// Villes disposant d'une page service dédiée par nuisible/pro.
const HAS_PUNAISES = new Set(['Lyon', 'Paris']);
const HAS_PRO = new Set(['Lyon', 'Paris']);

// Variantes de formulation par ville : évite des titres/CTA identiques d'une
// page à l'autre (signal doorway). Clé = ville, sinon 1re valeur par défaut.
const V = {
  introHeading: {
    Lyon: "Rats et souris à Lyon : pourquoi ils s'installent",
    Paris: 'Pourquoi les rongeurs prolifèrent à Paris',
    Marseille: 'Rats noirs et surmulots : le cas marseillais',
    Bordeaux: 'Rongeurs à Bordeaux : les facteurs de risque',
    Toulouse: "Ce qui attire rats et souris à Toulouse",
  },
  introLink: {
    Lyon: "Pour reconnaître l'espèce et ses signes de présence : nos guides du <a href=\"/nuisibles/rats/\">rat</a> et de la <a href=\"/nuisibles/souris/\">souris</a>.",
    Paris: "Besoin d'identifier l'espèce ? Consultez nos fiches <a href=\"/nuisibles/rats/\">rat</a> et <a href=\"/nuisibles/souris/\">souris</a>.",
    Marseille: "Rat noir ou surmulot ? Nos guides du <a href=\"/nuisibles/rats/\">rat</a> et de la <a href=\"/nuisibles/souris/\">souris</a> aident à trancher.",
    Bordeaux: "Pour distinguer les espèces et leurs indices : nos guides <a href=\"/nuisibles/rats/\">rat</a> et <a href=\"/nuisibles/souris/\">souris</a>.",
    Toulouse: "Identifier le rongeur et ses traces : nos guides du <a href=\"/nuisibles/rats/\">rat</a> et de la <a href=\"/nuisibles/souris/\">souris</a>.",
  },
  contexteHeading: {
    Lyon: 'Ce qui favorise les rongeurs à Lyon',
    Paris: 'Les facteurs parisiens de prolifération',
    Marseille: 'Habitat et climat : le terrain marseillais',
    Bordeaux: 'Fleuve, pierre et échoppes : le terrain bordelais',
    Toulouse: 'Canaux et brique : le terrain toulousain',
  },
  zonesHeading: {
    Lyon: 'Nous intervenons dans tout Lyon et sa métropole',
    Paris: 'Notre couverture à Paris et en petite couronne',
    Marseille: 'Nos secteurs à Marseille et alentours',
    Bordeaux: 'Bordeaux et sa métropole : zones couvertes',
    Toulouse: 'Toulouse et sa métropole : où nous intervenons',
  },
  zonesFootnote: {
    Lyon: 'Intervention prioritaire dans Lyon intra-muros et les communes limitrophes.',
    Paris: 'Priorité à Paris intra-muros, puis à la petite couronne.',
    Marseille: 'Priorité aux 16 arrondissements, puis aux communes voisines.',
    Bordeaux: 'Priorité au centre de Bordeaux, puis aux communes de la métropole.',
    Toulouse: 'Priorité à Toulouse, puis aux communes de la métropole.',
  },
  tarifHeading: {
    Lyon: 'Combien coûte une dératisation à Lyon ?',
    Paris: 'Prix d\'une dératisation à Paris',
    Marseille: 'Tarif d\'une dératisation à Marseille',
    Bordeaux: 'Combien prévoir pour une dératisation à Bordeaux ?',
    Toulouse: 'Prix d\'une dératisation à Toulouse',
  },
  faqHeading: {
    Lyon: 'Dératisation à Lyon : vos questions',
    Paris: 'Vos questions sur la dératisation à Paris',
    Marseille: 'Questions fréquentes — rongeurs à Marseille',
    Bordeaux: 'Dératisation bordelaise : questions fréquentes',
    Toulouse: 'Vos questions — dératisation à Toulouse',
  },
  ctaHeading: {
    Lyon: 'Des rats ou des souris à Lyon ?',
    Paris: 'Un problème de rongeurs à Paris ?',
    Marseille: 'Rats ou souris chez vous à Marseille ?',
    Bordeaux: 'Des rongeurs à Bordeaux ?',
    Toulouse: 'Rats ou souris à Toulouse ?',
  },
  ctaText: {
    Lyon: 'Nos techniciens certifiés Certibiocide interviennent sous 24h dans tout Lyon et sa métropole.',
    Paris: 'Nos équipes certifiées Certibiocide couvrent Paris et la petite couronne, sous 24h.',
    Marseille: 'Nos techniciens Certibiocide interviennent sous 24h, du centre aux communes voisines.',
    Bordeaux: 'Nos équipes Certibiocide couvrent Bordeaux et sa métropole, sous 24h.',
    Toulouse: 'Nos techniciens Certibiocide interviennent sous 24h dans la ville rose et sa métropole.',
  },
  otherIntro: {
    Lyon: 'Un problème qui ne concerne pas les rongeurs ? Nous traitons aussi :',
    Paris: "Autre nuisible qu'un rongeur ? Voici nos autres services :",
    Marseille: 'Pas un rongeur ? Découvrez nos autres interventions :',
    Bordeaux: 'Un autre nuisible à traiter ? Nous intervenons aussi sur :',
    Toulouse: "Ce n'est pas un rongeur ? Nous traitons également :",
  },
};
const pick = (map, ville) => map[ville] || Object.values(map)[0];

function splitLabel(item) {
  const i = item.indexOf(' : ');
  if (i === -1) return { title: '', body: item };
  return { title: item.slice(0, i), body: item.slice(i + 3) };
}

function buildHead(page) {
  const title = attr(page.metaTitle);
  const desc = attr(page.metaDescription);
  const url = `https://www.sanalia.fr${page.slug}`;
  return { title, desc, url };
}

function buildJsonLd(page) {
  const geo = CITY_GEO[page.ville] || {};
  const url = `https://www.sanalia.fr${page.slug}`;
  const address = { '@type': 'PostalAddress', addressLocality: page.ville, addressCountry: 'FR' };
  if (geo.street) address.streetAddress = geo.street;
  if (geo.cp) address.postalCode = geo.cp;
  address.addressRegion = page.region;

  const graph = [
    {
      '@type': 'Service',
      serviceType: 'Dératisation',
      name: `Dératisation à ${page.ville}`,
      description: page.metaDescription,
      provider: {
        '@type': 'Organization',
        name: 'Sanalia',
        telephone: PHONE_INTL,
        url: 'https://www.sanalia.fr/',
      },
      areaServed: [
        { '@type': 'City', name: page.ville },
        { '@type': 'AdministrativeArea', name: page.departement },
      ],
      url,
    },
    {
      '@type': 'LocalBusiness',
      name: `Sanalia — Dératisation ${page.ville}`,
      image: OG_IMAGE,
      url,
      telephone: PHONE_INTL,
      address,
      ...(geo.lat ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
      areaServed: { '@type': 'City', name: page.ville },
      priceRange: '€€',
      openingHours: 'Mo-Su 08:00-20:00',
      serviceType: ['Dératisation'],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.sanalia.fr/' },
        { '@type': 'ListItem', position: 2, name: 'Dératisation', item: 'https://www.sanalia.fr/deratisation/' },
        { '@type': 'ListItem', position: 3, name: page.ville },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: (page.faqLocale || []).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function buildBody(page) {
  const ville = esc(page.ville);
  const url = `https://www.sanalia.fr${page.slug}`;

  // ── HERO ────────────────────────────────────────────────────────────
  const hero = `
<!-- ════════ HERO ════════ -->
<section class="hero-city">
  <div class="container">
    <div class="hero-city-grid">
      <div>
        <div class="reassurance-row">
          <span class="reassurance-pill pill-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Devis en 2h · Intervention 7j/7</span>
          <span class="reassurance-pill pill-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Techniciens Certibiocide</span>
          <span class="reassurance-pill pill-gold"><span class="pill-star">★</span> 4,9/5 · Google</span>
        </div>
        <h1>${esc(page.h1)}</h1>
        <p class="hero-subtitle">${esc(page.heroLead || '')}</p>
        <div class="hero-cta-group">
          <a href="/devis/" class="hero-cta-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Devis gratuit sous 2h
          </a>
          <a href="tel:${PHONE_TEL}" class="hero-cta-phone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${PHONE_DISPLAY}
          </a>
        </div>
        <div class="hero-trust-micro">
          <span><img src="/assets/certifications/certibiocide-dr.png" alt="Certibiocide"> Certibiocide</span>
          <span><img src="/assets/certifications/cs3d-entreprise-adhérente-295x300.webp" alt="CS3D"> CS3D</span>
          <span><img src="/assets/certifications/20240119-Logo_Qualipro_Blue_Final_BG_Transparent.png" alt="QualiPro3D"> QualiPro 3D</span>
          <span style="color:var(--color-primary-600);font-weight:700;">Satisfait ou re-traité</span>
        </div>
      </div>
      <div class="hero-city-map">
        <div id="minimap"></div>
        <div class="map-overlay-badge">
          <span class="mob-dot"></span>
          <span><strong>Techniciens disponibles</strong> à ${ville}</span>
        </div>
      </div>
    </div>
  </div>
</section>`;

  // ── INTRO LOCALE ────────────────────────────────────────────────────
  const intro = `
<!-- ════════ INTRO LOCALE ════════ -->
<section class="section-premium bg-white">
  <div class="container" style="max-width:900px;">
    <div class="section-header">
      <span class="mono" style="color:#999;">Dératisation à ${ville}</span>
      <h2>${esc(pick(V.introHeading, page.ville))}</h2>
    </div>
    <p style="font-size:16px;line-height:1.8;color:var(--color-primary-800);">${esc(page.introLocale)}</p>
    <p style="font-size:15px;color:#666;margin-top:var(--space-md);">${pick(V.introLink, page.ville)}</p>
  </div>
</section>`;

  // ── CONTEXTE LOCAL (remplace le bloc « ville à part ») ───────────────
  const cards = (page.contexteLocal || []).map((item) => {
    const { title, body } = splitLabel(item);
    const h = title
      ? `<h3 style="font-size:18px;margin:0 0 8px;">${esc(title)}</h3>`
      : '';
    return `      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:var(--space-xl);border:1px solid var(--color-gray-light);">
        ${h}<p style="font-size:15px;line-height:1.7;margin:0;color:var(--color-primary-800);">${esc(body)}</p>
      </div>`;
  }).join('\n');
  const contexte = `
<!-- ════════ CONTEXTE LOCAL ════════ -->
<section class="section-premium bg-cream">
  <div class="container" style="max-width:900px;">
    <div class="section-header">
      <span class="mono" style="color:#999;">Contexte local</span>
      <h2>${esc(pick(V.contexteHeading, page.ville))}</h2>
    </div>
    <div style="display:grid;gap:var(--space-lg);">
${cards}
    </div>
  </div>
</section>`;

  // ── ZONES COUVERTES ─────────────────────────────────────────────────
  const tags = (page.zonesCouvertes || []).map((z) => `      <span class="zone-tag">${esc(z)}</span>`).join('\n');
  const zones = `
<!-- ════════ ZONES D'INTERVENTION ════════ -->
<section class="section-premium bg-white">
  <div class="container">
    <div class="section-header" style="text-align:center;">
      <span class="mono" style="color:#999;">Zones couvertes</span>
      <h2>${esc(pick(V.zonesHeading, page.ville))}</h2>
    </div>
    <div class="zones-grid">
${tags}
    </div>
    <p style="text-align:center;margin-top:var(--space-lg);font-size:14px;color:var(--color-primary-800);">${esc(pick(V.zonesFootnote, page.ville))}</p>
  </div>
</section>`;

  // ── TARIF INDICATIF ─────────────────────────────────────────────────
  const tarif = page.tarifIndicatif ? `
<!-- ════════ TARIF INDICATIF ════════ -->
<section class="section-premium bg-cream">
  <div class="container" style="max-width:900px;">
    <div class="section-header">
      <span class="mono" style="color:#999;">Tarifs</span>
      <h2>${esc(pick(V.tarifHeading, page.ville))}</h2>
    </div>
    <p style="font-size:16px;line-height:1.8;color:var(--color-primary-800);">${esc(page.tarifIndicatif)}</p>
    <p style="font-size:14px;color:#666;margin-top:var(--space-sm);">Le montant exact dépend du diagnostic sur place. <a href="/devis/">Demandez un devis gratuit</a>, sans engagement.</p>
  </div>
</section>` : '';

  // ── TODO interventions récentes (masqué tant que non fourni) ─────────
  const todo = (page.interventionsRecentes && page.interventionsRecentes.length)
    ? ''
    : `
<!-- TODO_CONTENU_LOCAL: interventionsRecentes — insérer ici 2 à 3 cas RÉELS d'intervention
     dératisation à ${page.ville} (zone, nuisible, résumé factuel). NE PAS inventer :
     bloc volontairement masqué (commenté) tant que les données réelles ne sont pas fournies. -->`;

  // ── FAQ LOCALE ──────────────────────────────────────────────────────
  const faqItems = (page.faqLocale || []).map((f) => `    <div class="accordion-item">
      <button class="accordion-header">${esc(f.q)} <span class="icon-toggle">+</span></button>
      <div class="accordion-body"><div class="accordion-body-inner">${esc(f.a)}</div></div>
    </div>`).join('\n');
  const faq = `
<!-- ════════ FAQ ════════ -->
<section class="section-premium bg-white">
  <div class="container" style="max-width:800px;">
    <div class="section-header">
      <span class="mono" style="color:#999;">Questions fréquentes</span>
      <h2>${esc(pick(V.faqHeading, page.ville))}</h2>
    </div>
${faqItems}
  </div>
</section>`;

  // ── CTA ─────────────────────────────────────────────────────────────
  const cta = `
<!-- ════════ CTA ════════ -->
<section class="cta-city">
  <div class="container" style="position:relative;z-index:1;">
    <h2>${esc(pick(V.ctaHeading, page.ville))}</h2>
    <p>${esc(pick(V.ctaText, page.ville))}</p>
    <div class="flex-center gap-md" style="flex-wrap:wrap;">
      <a href="/devis/" class="btn btn-lg" style="background:#fff;color:var(--color-primary-900);">Recevoir un devis personnalisé</a>
      <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg" style="color:#fff;border-color:rgba(255,255,255,0.4);">📞 ${PHONE_DISPLAY}</a>
    </div>
  </div>
</section>`;

  // ── AUTRES SERVICES (liens internes, remplace le stuffing) ──────────
  const otherLinks = [
    `<a href="/desinsectisation/" class="btn btn-ghost btn-sm">Désinsectisation</a>`,
    HAS_PUNAISES.has(page.ville)
      ? `<a href="/desinsectisation/punaises-de-lit/${page.ville.toLowerCase()}/" class="btn btn-ghost btn-sm">Punaises de lit à ${ville}</a>`
      : `<a href="/desinsectisation/punaises-de-lit/" class="btn btn-ghost btn-sm">Punaises de lit</a>`,
    `<a href="/desinfection/" class="btn btn-ghost btn-sm">Désinfection</a>`,
    `<a href="/depigeonnage/" class="btn btn-ghost btn-sm">Dépigeonnage</a>`,
    HAS_PRO.has(page.ville)
      ? `<a href="/professionnel/deratisation/${page.ville.toLowerCase()}/" class="btn btn-ghost btn-sm">Dératisation pro à ${ville}</a>`
      : `<a href="/professionnel/" class="btn btn-ghost btn-sm">Sanalia Pro</a>`,
  ].map((l) => `      ${l}`).join('\n');
  const otherServices = `
<!-- ════════ AUTRES SERVICES ════════ -->
<section class="section-premium bg-cream">
  <div class="container">
    <div class="section-header" style="text-align:center;">
      <span class="mono" style="color:#999;">Autre nuisible ?</span>
      <h2>Nos autres services à ${ville}</h2>
      <p>${esc(pick(V.otherIntro, page.ville))}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);justify-content:center;">
${otherLinks}
    </div>
  </div>
</section>`;

  // ── AUTRES VILLES ───────────────────────────────────────────────────
  const cityLinks = ALL_CITIES.filter((c) => c.name !== page.ville)
    .map((c) => `      <a href="${c.href}" class="btn btn-ghost btn-sm">${c.name}</a>`).join('\n');
  const autresVilles = `
<!-- ════════ AUTRES VILLES ════════ -->
<section class="section-premium bg-white">
  <div class="container">
    <div class="section-header" style="text-align:center;">
      <span class="mono" style="color:#999;">Autres implantations</span>
      <h2>Sanalia dératise aussi dans ces villes</h2>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);justify-content:center;">
${cityLinks}
      <a href="/implantations/" class="btn btn-ghost btn-sm">Toutes nos agences →</a>
    </div>
  </div>
</section>`;

  return [
    '<!-- VILLE-CONTENT:START -->',
    hero, intro, contexte, zones, tarif, todo, faq, cta, otherServices, autresVilles,
    '<!-- VILLE-CONTENT:END -->',
  ].filter(Boolean).join('\n') + '\n';
}

// ── Helpers de contenu réutilisables (pro) ───────────────────────────────
function contexteCardsHtml(page) {
  return (page.contexteLocal || []).map((item) => {
    const { title, body } = splitLabel(item);
    const h = title ? `<h3>${esc(title)}</h3>` : '';
    return `      <div class="card">${h}<p>${esc(body)}</p></div>`;
  }).join('\n');
}

function faqItemsHtml(page) {
  return (page.faqLocale || []).map((f) => `      <div class="accordion-item">
        <button class="accordion-header">${esc(f.q)} <span class="icon-toggle">+</span></button>
        <div class="accordion-body"><div class="accordion-body-inner">${esc(f.a)}</div></div>
      </div>`).join('\n');
}

function buildProJsonLd(page) {
  const geo = CITY_GEO[page.ville] || {};
  const url = `https://www.sanalia.fr${page.slug}`;
  const address = { '@type': 'PostalAddress', addressLocality: page.ville, addressCountry: 'FR' };
  if (geo.street) address.streetAddress = geo.street;
  if (geo.cp) address.postalCode = geo.cp;
  address.addressRegion = page.region;

  const graph = [
    {
      '@type': 'Service',
      serviceType: 'Dératisation',
      name: `Dératisation professionnelle à ${page.ville}`,
      description: page.metaDescription,
      provider: { '@type': 'Organization', name: 'Sanalia', telephone: PHONE_INTL, url: 'https://www.sanalia.fr/' },
      areaServed: [
        { '@type': 'City', name: page.ville },
        { '@type': 'AdministrativeArea', name: page.departement },
      ],
      audience: { '@type': 'BusinessAudience', name: 'Professionnels (restauration, hôtellerie, copropriétés, bureaux)' },
      url,
    },
    {
      '@type': 'LocalBusiness',
      name: `Sanalia Pro — Dératisation ${page.ville}`,
      image: OG_IMAGE,
      url,
      telephone: PHONE_INTL,
      address,
      ...(geo.lat ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
      areaServed: { '@type': 'City', name: page.ville },
      priceRange: '€€',
      openingHours: 'Mo-Su 08:00-20:00',
      serviceType: ['Dératisation'],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.sanalia.fr/' },
        { '@type': 'ListItem', position: 2, name: 'Professionnel', item: 'https://www.sanalia.fr/professionnel/' },
        { '@type': 'ListItem', position: 3, name: `Dératisation ${page.ville}` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: (page.faqLocale || []).map((f) => ({
        '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}\n</script>`;
}

// Convertit les tirets quadratins (—) en ponctuation française naturelle.
// Le — n'apparaît qu'en texte / littéral de chaîne, jamais dans la syntaxe HTML/JS ;
// les règles bornées ne franchissent pas une frontière de chaîne. Protège
// <style>/<svg>/commentaires. Idempotent (pas de — → no-op).
function deDash(html) {
  const store = [];
  const keep = (m) => { store.push(m); return `@@KEEP${store.length - 1}@@`; };
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, keep);
  html = html.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, keep);
  html = html.replace(/<!--[\s\S]*?-->/g, keep);

  html = html.replace(/&mdash;/g, '—');
  html = html.replace(/&nbsp;—&nbsp;/g, '&nbsp;à&nbsp;');           // plage horaire
  html = html.replace(/(\d)\s*—\s*(\d)/g, '$1–$2');                 // plage numérique
  html = html.replace(/\bFAQ\s*—\s*/g, 'FAQ : ');                   // titre FAQ
  html = html.replace(/\b(Étape|Phase|Jour|Niveau|Semaine|Mois|Point)\s+([\dIVX]+)\s*—\s*/g, '$1 $2 : ');
  html = html.replace(/(['"])\s*—\s+/g, '$1');                      // tiret de citation en tête
  html = html.replace(/ — ([^—.'"+<>{}]{1,90}?) — /g, ' ($1) ');    // incise appairée
  html = html.replace(/ — /g, ', ');                               // tiret simple
  html = html.replace(/—/g, ', ');                                 // résiduel
  html = html.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+,/g, ',').replace(/,\s*,/g, ',');

  return html.replace(/@@KEEP(\d+)@@/g, (_, i) => store[+i]);
}

// Insère les marqueurs VILLE-CONTENT autour de HERO … certifications (idempotent).
function ensureMarkers(html) {
  if (/<!--\s*VILLE-CONTENT:START\s*-->/.test(html)) return html;
  html = html.replace(/(<!-- ════════ HERO ════════ -->)/, '<!-- VILLE-CONTENT:START -->\n$1');
  html = html.replace(/(<div data-component="certifications">)/, '<!-- VILLE-CONTENT:END -->\n$1');
  return html;
}

// Met à jour les balises meta communes du <head>.
function applyMeta(html, page) {
  const { title, desc, url } = buildHead(page);
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceOnce(html, /(<meta name="description" content=")[^"]*(">)/, `$1${desc}$2`);
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`);
  html = replaceOnce(html, /(<meta property="og:description" content=")[^"]*(">)/, `$1${desc}$2`);
  if (/<meta property="og:url" content="/.test(html)) html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*(">)/, `$1${url}$2`);
  if (/<meta name="twitter:title" content="/.test(html)) html = replaceOnce(html, /(<meta name="twitter:title" content=")[^"]*(">)/, `$1${title}$2`);
  if (/<meta name="twitter:description" content="/.test(html)) html = replaceOnce(html, /(<meta name="twitter:description" content=")[^"]*(">)/, `$1${desc}$2`);
  return html;
}

// Variantes B2B par ville (évite des sections génériques identiques).
const PV = {
  secteursIntro: {
    Lyon: "De la brasserie de la Presqu'île au groupe hôtelier de la Part-Dieu, chaque secteur a ses contraintes. Nos contrats intègrent un plan de prévention sur mesure et la documentation attendue par la DDPP du Rhône.",
    Paris: "Du bistrot du Marais au siège social de La Défense, chaque activité impose ses règles. Nos contrats incluent un plan de prévention adapté et les justificatifs exigés lors des contrôles parisiens.",
  },
  approche: {
    Lyon: `<!-- ════════ NOTRE APPROCHE PRO ════════ -->
<section style="background: var(--color-primary-100);">
  <div class="container">
    <span class="mono" style="color: #999;">Notre méthode</span>
    <h2>Un contrat lyonnais suivi dans la durée, pas une visite isolée</h2>
    <div class="card-grid" style="margin-top: var(--space-xl);">
      <div class="card"><h3>1. Audit des locaux</h3><p>Repérage des points d'entrée, des caves mutualisées et des zones de stockage, du sous-sol de la Presqu'île aux cuisines de la Part-Dieu. Cartographie et rapport remis à l'issue de la visite.</p></div>
      <div class="card"><h3>2. Plan de lutte intégrée</h3><p>Postes d'appâtage sécurisés, obturation des accès et recommandations, calés sur le bâti ancien lyonnais et le calendrier de votre établissement (service du midi, coupures).</p></div>
      <div class="card"><h3>3. Passages &amp; registre DDPP</h3><p>Visites programmées hors service, chaque passage horodaté et photographié, registre tenu à jour et présentable à la DDPP du Rhône lors d'un contrôle ou d'un audit HACCP.</p></div>
    </div>
  </div>
</section>`,
    Paris: `<!-- ════════ NOTRE APPROCHE PRO ════════ -->
<section style="background: var(--color-primary-100);">
  <div class="container">
    <span class="mono" style="color: #999;">Notre méthode</span>
    <h2>Un abonnement parisien pensé pour l'audit, pas un simple passage</h2>
    <div class="card-grid" style="margin-top: var(--space-xl);">
      <div class="card"><h3>1. Diagnostic de l'établissement</h3><p>Inspection des caves haussmanniennes mitoyennes, des locaux de stockage et des circulations, du bistrot de quartier à la dark kitchen. Cartographie des postes et compte rendu détaillé.</p></div>
      <div class="card"><h3>2. Dispositif de prévention</h3><p>Postes verrouillés, colmatage des passages entre lots et conseils d'hygiène, adaptés à la densité parisienne et aux recontaminations venues des immeubles voisins.</p></div>
      <div class="card"><h3>3. Comptes rendus prêts pour l'inspection</h3><p>Passages hors présence clientèle, rapports horodatés avec photos, registre archivé et présentable lors d'un contrôle de la DDPP de Paris.</p></div>
    </div>
  </div>
</section>`,
  },
};

// ── Rendu PRO : injecte le contenu local unique, préserve la mise en page ─
function renderPro(page) {
  const htmlPath = join(ROOT, page.slug.replace(/^\//, ''), 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  const ville = esc(page.ville);

  html = applyMeta(html, page);
  html = replaceOnce(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, buildProJsonLd(page));

  // H1 unique depuis le module.
  html = replaceOnce(html, /<h1>[\s\S]*?<\/h1>/, `<h1>${esc(page.h1)}</h1>`);

  // Accroche hero (premier <p> de .hero-content) → introLocale local.
  html = html.replace(/(<div class="hero-content">[\s\S]*?<p>)[\s\S]*?(<\/p>)/, `$1${esc(page.introLocale)}$2`);

  // Retire le bloc de stats non vérifiables (fabriqué + boilerplate partagé).
  html = html.replace(/\n?<!-- ════════ STATS PRO[\s\S]*?<\/section>\n?/, '\n');

  // Intro « secteurs » variée par ville.
  if (PV.secteursIntro[page.ville]) {
    html = html.replace(
      new RegExp(`(Les professionnels que nous accompagnons à ${page.ville}</h2>\\s*)<p>[\\s\\S]*?</p>`),
      `$1<p>${esc(PV.secteursIntro[page.ville])}</p>`,
    );
  }

  // Section « Notre approche » réécrite localement (remplace le bloc générique).
  if (PV.approche[page.ville]) {
    html = html.replace(/<!-- ════════ NOTRE APPROCHE PRO ════════ -->[\s\S]*?<\/section>/, PV.approche[page.ville]);
  }

  // Section « Contexte local » insérée avant « Notre approche » (idempotent).
  if (!html.includes('<!-- PRO-CONTEXTE -->')) {
    const contexte = `<!-- PRO-CONTEXTE -->
<!-- ════════ CONTEXTE LOCAL PRO ════════ -->
<section>
  <div class="container">
    <span class="mono" style="color: #999;">Contexte local</span>
    <h2>Pourquoi les professionnels de ${ville} sont exposés</h2>
    <div class="card-grid" style="margin-top: var(--space-xl);">
${contexteCardsHtml(page)}
    </div>
  </div>
</section>

`;
    html = replaceOnce(html, /(<!-- ════════ NOTRE APPROCHE PRO ════════ -->)/, contexte + '$1');
  }

  // FAQ locale du module (remplace la FAQ générique).
  html = replaceOnce(
    html,
    /(<div class="accordion" style="margin-top: var\(--space-xl\);">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/,
    `$1\n${faqItemsHtml(page)}\n    </div>\n  </div>\n</section>`,
  );

  // Conformité : aucun service « gratuit » (seul le devis peut l'être).
  html = html.replace(/Demandez un audit gratuit de vos locaux\./g, 'Demandez un devis gratuit pour vos locaux.');

  html = ensureMarkers(html);
  return { htmlPath, html: deDash(html) };
}

// ── Rendu LÉGER (punaises) : meta + H1 + marqueurs, corps conservé ────────
function renderLight(page) {
  const htmlPath = join(ROOT, page.slug.replace(/^\//, ''), 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = applyMeta(html, page);
  html = replaceOnce(html, /<h1>[\s\S]*?<\/h1>/, `<h1>${esc(page.h1)}</h1>`);
  html = ensureMarkers(html);
  return { htmlPath, html: deDash(html) };
}

// ── Splice dans le fichier existant ──────────────────────────────────────
function render(page) {
  const htmlPath = join(ROOT, page.slug.replace(/^\//, ''), 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  const { title, desc, url } = buildHead(page);

  // 1. Meta <head>
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceOnce(html, /(<meta name="description" content=")[^"]*(">)/, `$1${desc}$2`);
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`);
  html = replaceOnce(html, /(<meta property="og:description" content=")[^"]*(">)/, `$1${desc}$2`);
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*(">)/, `$1${url}$2`);
  html = replaceOnce(html, /(<meta name="twitter:title" content=")[^"]*(">)/, `$1${title}$2`);
  html = replaceOnce(html, /(<meta name="twitter:description" content=")[^"]*(">)/, `$1${desc}$2`);

  // 2. JSON-LD (premier bloc)
  html = replaceOnce(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, buildJsonLd(page));

  // 3. Zone de contenu
  const body = buildBody(page);
  if (/<!--\s*VILLE-CONTENT:START\s*-->/.test(html)) {
    html = html.replace(/<!--\s*VILLE-CONTENT:START\s*-->[\s\S]*?<!--\s*VILLE-CONTENT:END\s*-->\n?/, body);
  } else {
    // Première exécution : remplace du HERO jusqu'au composant certifications.
    const start = html.indexOf('<!-- ════════ HERO ════════ -->');
    const end = html.indexOf('<div data-component="certifications">');
    if (start === -1 || end === -1 || end < start) {
      throw new Error(`${page.slug} — bornes de contenu introuvables (HERO / certifications)`);
    }
    html = html.slice(0, start) + body + '\n' + html.slice(end);
  }

  return { htmlPath, html: deDash(html) };
}

function replaceOnce(s, re, rep) {
  if (!re.test(s)) throw new Error(`Motif introuvable : ${re}`);
  return s.replace(re, rep);
}

// ── Exécution ────────────────────────────────────────────────────────────
const moduleFiles = readdirSync(VILLES_DIR)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

let changed = 0;
for (const file of moduleFiles) {
  const mod = await import(pathToFileURL(join(VILLES_DIR, file)).href);
  const page = mod.default;
  const intent = page.serviceIntentionPrimaire;
  const renderer = intent === 'deratisation' ? render
    : intent === 'pro' ? renderPro
    : renderLight;
  const { htmlPath, html } = renderer(page);
  const current = readFileSync(htmlPath, 'utf8');
  if (current === html) {
    console.log(`  = inchangé : ${page.slug}`);
    continue;
  }
  if (CHECK) {
    console.error(`  ✗ diff : ${page.slug} (le rendu diffère du disque)`);
    changed++;
    continue;
  }
  writeFileSync(htmlPath, html);
  console.log(`  ✓ rendu : ${page.slug}`);
  changed++;
}

if (CHECK && changed > 0) {
  console.error(`\n❌ ${changed} page(s) désynchronisée(s). Lancer : node scripts/render-villes.mjs`);
  process.exit(1);
}
console.log(`\n✅ render-villes : ${changed} page(s) traitée(s).`);

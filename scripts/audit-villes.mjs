#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════
// SANALIA — Garde-fou anti-régression « pages ville »
// ------------------------------------------------------------------------
// Vérifie le cluster service × ville (dératisation / pro / punaises) contre
// le signal « scaled content / doorway » qui a valu la rétrogradation au
// Google Spam Update de juin 2026. Exécuté au build et en pre-commit :
//   node scripts/audit-villes.mjs           → exit 0 (OK) / 1 (échec)
//   node scripts/audit-villes.mjs --verbose → détail par page
//
// Contrôles :
//   1. Modules content/villes/* : champs requis, pas de placeholder publié,
//      longueurs meta, phrases interdites, unicité metaTitle/metaDescription.
//   2. Pages HTML rendues : extraction de la zone de contenu unique
//      (marqueurs VILLE-CONTENT), neutralisation ville/dept, puis
//        - duplication par paire ≤ 25 % (shingles),
//        - minimum de mots uniques,
//        - intention unique (pas de bourrage cross-service),
//        - cohérence h1/metaTitle HTML ↔ module.
// ════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  THRESHOLDS, FORBIDDEN_PATTERNS, FOREIGN_INTENT_KEYWORDS, FOREIGN_INTENT_MAX_MENTIONS,
  validateVillePage, neutralize, collectText,
} from '../content/villes/_schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const VILLES_DIR = join(ROOT, 'content', 'villes');
const VERBOSE = process.argv.includes('--verbose');

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ── 1. Chargement des modules VillePage ──────────────────────────────────
const moduleFiles = readdirSync(VILLES_DIR)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const pages = [];
for (const file of moduleFiles) {
  const url = pathToFileURL(join(VILLES_DIR, file)).href;
  const mod = await import(url);
  const page = mod.default;
  if (!page || typeof page !== 'object') {
    fail(`${file} — export default manquant ou invalide`);
    continue;
  }
  pages.push({ file, page });
}

if (pages.length === 0) {
  fail('Aucun module content/villes/*.mjs chargé.');
  report();
}

// ── 2. Validation individuelle des modules ───────────────────────────────
for (const { file, page } of pages) {
  for (const e of validateVillePage(page, file)) fail(e);
}

// ── 3. Unicité metaTitle / metaDescription / h1 ──────────────────────────
for (const field of ['metaTitle', 'metaDescription', 'h1']) {
  const seen = new Map();
  for (const { file, page } of pages) {
    const v = (page[field] || '').trim().toLowerCase();
    if (!v) continue;
    if (seen.has(v)) fail(`${field} dupliqué : « ${file} » identique à « ${seen.get(v)} »`);
    else seen.set(v, file);
  }
}

// ── 4. Analyse des pages HTML rendues ────────────────────────────────────
for (const entry of pages) {
  const { file, page } = entry;
  const htmlPath = join(ROOT, page.slug.replace(/^\//, ''), 'index.html');
  let html;
  try {
    html = readFileSync(htmlPath, 'utf8');
  } catch {
    fail(`${file} — page HTML introuvable : ${page.slug}index.html`);
    entry.contentText = '';
    continue;
  }

  // Meta HTML réelles.
  const htmlTitle = matchOne(html, /<title>([\s\S]*?)<\/title>/);
  const htmlDesc = matchOne(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (htmlTitle && page.metaTitle && decodeEntities(htmlTitle).trim() !== page.metaTitle.trim()) {
    warn(`${file} — <title> HTML ≠ metaTitle module (drift possible)`);
  }
  if (htmlDesc && page.metaDescription && decodeEntities(htmlDesc).trim() !== page.metaDescription.trim()) {
    warn(`${file} — meta description HTML ≠ metaDescription module (drift possible)`);
  }

  // noindex interdit sur ces pages (elles doivent rester indexables).
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) {
    fail(`${file} — noindex détecté (ces pages doivent rester indexables)`);
  }

  // Zone de contenu unique : marqueurs, sinon fallback (strip shell).
  const contentHtml = extractContentRegion(html);
  const text = htmlToText(contentHtml);
  entry.contentText = text;

  // h1/metaTitle présents dans le HTML.
  if (page.h1 && !text.includes(stripTags(page.h1))) {
    warn(`${file} — h1 du module absent de la zone de contenu HTML`);
  }

  // Mots uniques (zone de contenu).
  const wordCount = countWords(text);
  if (wordCount < THRESHOLDS.minUniqueWords) {
    fail(`${file} — contenu trop court : ${wordCount} mots < ${THRESHOLDS.minUniqueWords}`);
  }

  // Phrases interdites (sur le contenu rendu).
  for (const { re, msg } of FORBIDDEN_PATTERNS) {
    if (re.test(text)) fail(`${file} — ${msg} (dans le HTML rendu)`);
  }

  // Placeholder publié (hors commentaires HTML, qui sont légitimes).
  const visibleNoComments = contentHtml.replace(/<!--[\s\S]*?-->/g, '');
  if (htmlToText(visibleNoComments).includes('TODO_CONTENU_LOCAL')) {
    fail(`${file} — TODO_CONTENU_LOCAL visible sur une page publiée`);
  }

  // Intention unique : pas de bourrage cross-service.
  const foreign = FOREIGN_INTENT_KEYWORDS[page.serviceIntentionPrimaire] || [];
  const low = text.toLowerCase();
  const hits = [];
  for (const kw of foreign) {
    const n = (low.match(new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')) || []).length;
    if (n > 0) hits.push(`${kw}×${n}`);
  }
  const totalForeign = hits.reduce((s, h) => s + Number(h.split('×')[1]), 0);
  if (totalForeign > FOREIGN_INTENT_MAX_MENTIONS) {
    fail(`${file} — intention non unique : ${totalForeign} mentions cross-service (${hits.join(', ')}) > ${FOREIGN_INTENT_MAX_MENTIONS}`);
  }

  entry.shingles = shingleSet(neutralize(text, page), THRESHOLDS.shingleSize);
  if (VERBOSE) {
    console.log(`• ${file}: ${wordCount} mots, ${entry.shingles.size} shingles, cross-service=${totalForeign}`);
  }
}

// ── 5. Duplication par paire (après neutralisation) ──────────────────────
let maxPair = { ratio: 0, a: '', b: '' };
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const A = pages[i].shingles, B = pages[j].shingles;
    if (!A || !B || A.size === 0 || B.size === 0) continue;
    let inter = 0;
    const [small, big] = A.size <= B.size ? [A, B] : [B, A];
    for (const s of small) if (big.has(s)) inter++;
    const ratio = inter / small.size; // coefficient de recouvrement
    if (ratio > maxPair.ratio) maxPair = { ratio, a: pages[i].file, b: pages[j].file };
    if (ratio > THRESHOLDS.duplicationRatioMax) {
      fail(`Duplication ${(ratio * 100).toFixed(1)}% entre « ${pages[i].file} » et « ${pages[j].file} » (> ${(THRESHOLDS.duplicationRatioMax * 100)}%)`);
    }
  }
}
if (VERBOSE && maxPair.a) {
  console.log(`\nPaire la plus proche : ${maxPair.a} ↔ ${maxPair.b} = ${(maxPair.ratio * 100).toFixed(1)}%`);
}

report();

// ════════════════════════ Helpers ═══════════════════════════════════════

function report() {
  console.log('');
  console.log('═══ Audit pages ville ═══');
  console.log(`  Modules analysés : ${pages.length}`);
  if (maxPair.a) console.log(`  Duplication max  : ${(maxPair.ratio * 100).toFixed(1)}% (seuil ${(THRESHOLDS.duplicationRatioMax * 100)}%)`);
  if (warnings.length) {
    console.log(`\n  ⚠ ${warnings.length} avertissement(s) :`);
    for (const w of warnings) console.log(`    - ${w}`);
  }
  if (errors.length) {
    console.log(`\n  ✗ ${errors.length} erreur(s) :`);
    for (const e of errors) console.log(`    - ${e}`);
    console.log('\n❌ Audit ÉCHOUÉ — corriger avant commit/déploiement.\n');
    process.exit(1);
  }
  console.log('\n✅ Audit réussi — cluster ville conforme.\n');
  process.exit(0);
}

function matchOne(s, re) { const m = s.match(re); return m ? m[1] : ''; }

function extractContentRegion(html) {
  const m = html.match(/<!--\s*VILLE-CONTENT:START\s*-->([\s\S]*?)<!--\s*VILLE-CONTENT:END\s*-->/);
  if (m) return m[1];
  // Fallback : corps sans <head>, sans composants partagés, styles et scripts.
  let body = html.replace(/[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '');
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Retire les blocs de composants partagés (header/footer/certifs/mobile-cta).
  body = stripComponentDivs(body);
  return body;
}

// Supprime chaque <div data-component="...">...</div> en comptant la profondeur.
function stripComponentDivs(html) {
  let out = html;
  const marker = /<div\s+data-component="[^"]*">/i;
  let guard = 0;
  while (guard++ < 20) {
    const m = out.match(marker);
    if (!m) break;
    const start = m.index;
    let pos = start + m[0].length;
    let depth = 1;
    while (pos < out.length && depth > 0) {
      const nextOpen = out.indexOf('<div', pos);
      const nextClose = out.indexOf('</div>', pos);
      if (nextClose === -1) { pos = out.length; break; }
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; pos = nextOpen + 4; }
      else { depth--; pos = nextClose + 6; }
    }
    out = out.slice(0, start) + out.slice(pos);
  }
  return out;
}

function stripTags(s) { return s.replace(/<[^>]*>/g, ' '); }

function htmlToText(html) {
  return decodeEntities(
    html.replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim();
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à');
}

function countWords(text) {
  return (text.toLowerCase().match(/[a-zà-ÿ0-9]+/gi) || []).length;
}

function shingleSet(text, n) {
  const words = (text.toLowerCase().match(/[a-zà-ÿ0-9]+/gi) || []);
  const set = new Set();
  for (let i = 0; i + n <= words.length; i++) set.add(words.slice(i, i + n).join(' '));
  return set;
}

// ════════════════════════════════════════════════════════════════════════
// SANALIA — Modèle de contenu « page ville » (VillePage)
// ------------------------------------------------------------------------
// Source de vérité STRUCTURÉE du contenu local des pages service × ville.
// Le site est un site HTML statique (pas de CMS, pas de Next.js) : ces
// modules ne « génèrent » pas les pages, ils documentent et verrouillent le
// contenu local unique de chaque page et servent de base au garde-fou CI
// `scripts/audit-villes.mjs` (unicité, duplication, intention unique).
//
// RÈGLE : un champ local non rédigé reste `TODO_CONTENU_LOCAL` — JAMAIS un
// fait inventé (cf CLAUDE.md « garde-fous éditoriaux » + brief §8).
// ════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} InterventionRecente
 * @property {string} zone      Quartier / arrondissement / commune réel
 * @property {string} nuisible  Espèce traitée (rat, souris…)
 * @property {string} resume    Résumé factuel du cas (données RÉELLES only)
 */

/**
 * @typedef {Object} FaqItem
 * @property {string} q
 * @property {string} a
 */

/**
 * @typedef {Object} VillePage
 * @property {string} slug                      Chemin canonique (ex: "/deratisation/lyon/")
 * @property {string} ville                     Nom de la ville (ex: "Lyon")
 * @property {string} region                    Région (ex: "Auvergne-Rhône-Alpes")
 * @property {string} departement               Département + n° (ex: "Rhône (69)")
 * @property {('deratisation'|'desinsectisation'|'desinfection'|'pro')} serviceIntentionPrimaire
 * @property {string} metaTitle                 Unique, ≤ 60 c, rédigé
 * @property {string} metaDescription           Unique, ≤ 155 c, rédigé
 * @property {string} h1                        Rédigé — PAS "Dératisation à {ville}"
 * @property {string} [heroLead]                Sous-titre du hero (accroche locale, ≠ générique)
 * @property {string} introLocale               ≥ 120 mots, réellement local
 * @property {string[]} zonesCouvertes          Arrondissements / communes / quartiers RÉELS
 * @property {string[]} contexteLocal           Facteurs locaux RÉELS (habitat, saisonnalité, points chauds)
 * @property {InterventionRecente[]} interventionsRecentes  Cas RÉELS — vide tant que non fournis (placeholder TODO commenté côté HTML)
 * @property {string} [tarifIndicatif]
 * @property {FaqItem[]} faqLocale              Spécifique à la ville
 */

// ── Champs requis (absence = échec build via l'audit) ────────────────────
export const REQUIRED_FIELDS = [
  'slug', 'ville', 'region', 'departement', 'serviceIntentionPrimaire',
  'metaTitle', 'metaDescription', 'h1',
  'introLocale', 'zonesCouvertes', 'contexteLocal', 'faqLocale',
];

// Champs texte qui ne doivent JAMAIS rester un placeholder sur une page publiée.
export const NO_PLACEHOLDER_FIELDS = [
  'metaTitle', 'metaDescription', 'h1', 'introLocale', 'contexteLocal', 'faqLocale',
];

export const PLACEHOLDER_TOKEN = 'TODO_CONTENU_LOCAL';

// ── Phrases / patterns interdits (garde-fous éditoriaux) ─────────────────
// Renvoie un message si le texte matche, sinon null.
export const FORBIDDEN_PATTERNS = [
  { re: /ville\s+à\s+part/i, msg: 'Pattern doorway interdit « ville à part »' },
  { re: /Sanalya/i, msg: 'Faute d\'orthographe : « Sanalya » (→ Sanalia)' },
  // Service annoncé comme gratuit / offert / -100 % — « devis/estimation/
  // diagnostic/rappel gratuit » reste autorisé (c'est un devis, pas un service).
  {
    re: /(?<!devis\s)(?<!estimation\s)(?<!diagnostic\s)(?<!rappel\s)(?<!appel\s)(?<!consultation\s)\b(intervention|traitement|dératisation|désinsectisation|désinfection|prestation)s?\s+(?:100\s*%\s+)?(?:gratuit|gratuite|offert|offerte)/i,
    msg: 'Service annoncé gratuit/offert (interdit — seul le devis peut être gratuit)',
  },
  { re: /-\s?100\s?%/i, msg: 'Remise -100 % interdite' },
];

// ── Intentions étrangères par service (anti multi-intention) ─────────────
// Sur une page dératisation, on ne doit PAS optimiser pour la désinsectisation
// ou la désinfection (mots hors liens contextuels). Seuil toléré = quelques
// mentions/liens contextuels, pas des blocs de contenu.
export const FOREIGN_INTENT_KEYWORDS = {
  deratisation: ['désinsectisation', 'désinfection', 'punaise', 'cafard', 'blatte', 'guêpe', 'frelon', 'moustique', 'puce'],
  desinsectisation: ['dératisation', 'rongeur', 'désinfection'],
  desinfection: ['dératisation', 'désinsectisation'],
  pro: [],
};
// Nb max de mentions d'un mot d'intention étrangère dans la zone de contenu.
export const FOREIGN_INTENT_MAX_MENTIONS = 4;

// ── Seuils du garde-fou anti-régression ──────────────────────────────────
export const THRESHOLDS = {
  duplicationRatioMax: 0.25,   // > 25 % de shingles partagés (après neutralisation) = échec
  minUniqueWords: 350,         // mots dans la zone de contenu unique
  shingleSize: 6,              // taille des n-grammes pour la comparaison
  metaTitleMax: 60,
  metaDescriptionMax: 156,
};

// ── Neutralisation ville/dept/région pour la comparaison de duplication ──
// Remplace tous les tokens locaux par un sentinel, afin que la comparaison
// mesure le boilerplate RÉEL (texte identique une fois le nom de ville retiré).
export function neutralize(text, page) {
  if (!text) return '';
  let out = text;
  const tokens = [];
  if (page) {
    tokens.push(page.ville, page.region, page.departement);
    for (const z of page.zonesCouvertes || []) tokens.push(z);
    for (const t of page.neutralizeExtra || []) tokens.push(t);
  }
  // Tri par longueur décroissante pour remplacer les plus longs d'abord.
  const uniq = [...new Set(tokens.filter(Boolean))].sort((a, b) => b.length - a.length);
  for (const tok of uniq) {
    const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(esc, 'gi'), '·');
  }
  // Codes départements et gentilés génériques.
  out = out.replace(/\b\d{2,3}\b/g, '·');
  out = out.replace(/lyonnais(e|es)?|parisien(ne|nes|s)?|marseillais(e|es)?|bordelais(e|es)?|toulousain(e|es|s)?/gi, '·');
  return out;
}

// ── Validation d'un objet VillePage ──────────────────────────────────────
export function validateVillePage(page, name) {
  const errors = [];
  const label = name || page?.slug || '(inconnu)';

  for (const f of REQUIRED_FIELDS) {
    const v = page?.[f];
    const empty = v == null
      || (typeof v === 'string' && v.trim() === '')
      || (Array.isArray(v) && v.length === 0);
    if (empty) errors.push(`${label} — champ requis manquant/vide : « ${f} »`);
  }

  for (const f of NO_PLACEHOLDER_FIELDS) {
    const v = page?.[f];
    const s = Array.isArray(v) ? v.join(' ') : (v || '');
    if (String(s).includes(PLACEHOLDER_TOKEN)) {
      errors.push(`${label} — ${PLACEHOLDER_TOKEN} interdit sur un champ publié : « ${f} »`);
    }
  }

  if (page?.metaTitle && page.metaTitle.length > THRESHOLDS.metaTitleMax) {
    errors.push(`${label} — metaTitle trop long (${page.metaTitle.length} > ${THRESHOLDS.metaTitleMax})`);
  }
  if (page?.metaDescription && page.metaDescription.length > THRESHOLDS.metaDescriptionMax) {
    errors.push(`${label} — metaDescription trop longue (${page.metaDescription.length} > ${THRESHOLDS.metaDescriptionMax})`);
  }

  // Phrases interdites sur l'ensemble des champs texte.
  const haystack = collectText(page);
  for (const { re, msg } of FORBIDDEN_PATTERNS) {
    if (re.test(haystack)) errors.push(`${label} — ${msg}`);
  }

  return errors;
}

// Concatène tout le texte lisible d'un VillePage.
export function collectText(page) {
  if (!page) return '';
  const parts = [
    page.metaTitle, page.metaDescription, page.h1, page.introLocale,
    ...(page.zonesCouvertes || []),
    ...(page.contexteLocal || []),
    ...(page.faqLocale || []).flatMap((f) => [f.q, f.a]),
    ...(page.interventionsRecentes || []).flatMap((i) => [i.zone, i.nuisible, i.resume]),
    page.tarifIndicatif || '',
  ];
  return parts.filter(Boolean).join('\n');
}

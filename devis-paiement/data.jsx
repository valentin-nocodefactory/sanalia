/* =========================================================
   Sanalia — data, pricing logic, helpers
   ========================================================= */

// ---- Nuisibles catalogue ----
const NUISIBLES = [
  { id: 'rat',      label: 'Rats',         hint: 'Rongeurs',    img: '../assets/nuisibles/brown-rat--realistic-body-shape--long-tail--pointe.png',          bg: 'var(--pastel-rose-l)',  glow: 'rgba(255,170,160,.3)',  base: 220 },
  { id: 'souris',   label: 'Souris',       hint: 'Rongeurs',    img: '../assets/nuisibles/house-mouse--mus-musculus--realistic-body-shape--l.png',          bg: 'var(--pastel-gold-l)',  glow: 'rgba(244,233,193,.5)',  base: 180 },
  { id: 'cafard',   label: 'Cafards',      hint: 'Insectes',    img: '../assets/nuisibles/cockroach--realistic-body-shape--flat-oval-body--l.png',          bg: 'var(--pastel-peach-l)', glow: 'rgba(255,212,167,.4)',  base: 240 },
  { id: 'punaise',  label: 'Punaises',     hint: 'Lit',         img: '../assets/nuisibles/bed-bug--cimex-lectularius--realistic-body-shape--.png',           bg: 'var(--pastel-rose-l)',  glow: 'rgba(255,212,207,.5)',  base: 320 },
  { id: 'fourmi',   label: 'Fourmis',      hint: 'Insectes',    img: '../assets/nuisibles/black-garden-ant--lasius-niger--realistic-body-sha.png',           bg: 'var(--pastel-mint-l)',  glow: 'rgba(171,224,209,.5)',  base: 160 },
  { id: 'moustique', label: 'Moustiques',  hint: 'Volants',     img: '../assets/nuisibles/common-mosquito--culex-pipiens--realistic-body-sha.png',           bg: 'var(--pastel-blue-l)',  glow: 'rgba(176,213,245,.5)',  base: 190 },
  { id: 'guepe',    label: 'Guêpes',       hint: 'Volants',     img: '../assets/nuisibles/european-wasp--vespula-vulgaris--realistic-body-sh.png',           bg: 'var(--pastel-gold-l)',  glow: 'rgba(244,233,193,.5)',  base: 210 },
  { id: 'pigeon',   label: 'Pigeons',      hint: 'Volatiles',   img: '../assets/nuisibles/feral-pigeon--columba-livia--realistic-body-shape-.png',           bg: 'var(--pastel-lav-l)',   glow: 'rgba(239,223,246,.5)',  base: 280 },
];

// ---- Urgency ----
const URGENCES = [
  { id: 'eclair',   label: '🚨 Sous 24h',          desc: 'Intervention en urgence absolue', meta: 'Aujourd\'hui ou demain', mult: 1.45, urgent: true },
  { id: 'rapide',   label: '⚡ Sous 48–72h',        desc: 'Cette semaine, priorité élevée',  meta: 'Cette semaine',          mult: 1.15 },
  { id: 'standard', label: '🗓️ Cette semaine',     desc: 'Au cours des 7 prochains jours',  meta: 'Standard',                mult: 1.0  },
  { id: 'flexible', label: '🌿 Pas pressé',        desc: 'Sous 2 semaines, économique',     meta: '–10% économies',          mult: 0.9  },
];

// ---- Type de logement ----
const LOGEMENTS = [
  { id: 'appart',  label: 'Appartement', emoji: '🏢', desc: 'Studio, T1 à T6+',             mult: 1.0 },
  { id: 'maison',  label: 'Maison',      emoji: '🏡', desc: 'Maison individuelle, villa',   mult: 1.15 },
  { id: 'pro',     label: 'Local pro',   emoji: '🏪', desc: 'Bureau, commerce, restaurant', mult: 1.35 },
  { id: 'cave',    label: 'Cave / parking', emoji: '🅿️', desc: 'Cave, garage, parking',     mult: 0.85 },
  { id: 'jardin',  label: 'Extérieur',   emoji: '🌳', desc: 'Jardin, terrasse, dépendances', mult: 0.95 },
  { id: 'autre',   label: 'Autre',       emoji: '📍', desc: 'Précisez sur place',           mult: 1.0 },
];

// ---- Statut occupant ----
const STATUTS = [
  { id: 'proprio',   label: 'Propriétaire',          emoji: '🔑', desc: 'Vous possédez le logement' },
  { id: 'locataire', label: 'Locataire',             emoji: '📝', desc: 'Vous louez le logement' },
  { id: 'gestion',   label: 'Syndic / gestionnaire', emoji: '🏛️', desc: 'Pour un tiers / copropriété' },
  { id: 'pro',       label: 'Pro / entreprise',      emoji: '🏢', desc: 'Au nom d\'une société' },
];

// ---- Calendrier helpers ----
const FR_DOW = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_MO  = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juill', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function buildDays(count = 14, urgent = false) {
  const out = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    const isSunday = dow === 0;
    // Limited availability on Sunday + heavy on first 2 days for urgency
    const ok = !isSunday;
    out.push({
      iso: d.toISOString().slice(0,10),
      dow: FR_DOW[dow],
      day: d.getDate(),
      mo:  FR_MO[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
      available: ok,
      urgentOk: urgent && i <= 2,
    });
  }
  return out;
}

const SLOTS = [
  { id: '08-10', label: '08:00 – 10:00', meta: 'Matin' },
  { id: '10-12', label: '10:00 – 12:00', meta: 'Matin' },
  { id: '12-14', label: '12:00 – 14:00', meta: 'Midi' },
  { id: '14-16', label: '14:00 – 16:00', meta: 'Après-midi' },
  { id: '16-18', label: '16:00 – 18:00', meta: 'Après-midi' },
  { id: '18-20', label: '18:00 – 20:00', meta: 'Soirée' },
];

// ---- Address fake autocomplete ----
const ADDR_DB = [
  { num: '12 rue de Rivoli',           cp: '75001', city: 'Paris' },
  { num: '24 avenue des Champs-Élysées', cp: '75008', city: 'Paris' },
  { num: '8 rue Saint-Antoine',         cp: '75004', city: 'Paris' },
  { num: '45 rue de la République',     cp: '69002', city: 'Lyon' },
  { num: '17 boulevard Haussmann',      cp: '75009', city: 'Paris' },
  { num: '3 place Bellecour',           cp: '69002', city: 'Lyon' },
  { num: '21 Cours Mirabeau',           cp: '13100', city: 'Aix-en-Provence' },
  { num: '14 rue Sainte-Catherine',     cp: '33000', city: 'Bordeaux' },
];

// ---- Pricing ----
function computeQuote(state) {
  const nuisible = NUISIBLES.find(n => n.id === state.nuisible);
  // logement is an array of ids; the first is primary, each extra adds +35% to the treatment line
  const logIds = Array.isArray(state.logement) ? state.logement : (state.logement ? [state.logement] : []);
  const logements = logIds.map(id => LOGEMENTS.find(l => l.id === id)).filter(Boolean);
  const logement = logements[0] || null;
  if (!nuisible) return null;

  const base = nuisible.base;
  const surface = state.surface || 50; // m²
  const surfaceMult = 1 + Math.max(0, (surface - 30)) * 0.004;
  const logMult = logement ? logement.mult : 1;
  const audienceMult = state.audience === 'pro' ? 1.10 : 1;

  // Per-intervention price
  const diag = 49;
  const products = 32; // Produits & matériels (biocides, pièges, gel)
  const traitement = Math.round(base * logMult * audienceMult);
  const surfaceLine = Math.round(base * (surfaceMult - 1) * logMult);
  const interventionUnit = traitement + Math.max(0, surfaceLine);

  // 2 interventions: 1st offered (full discount on intervention 1)
  const intervention1 = interventionUnit;   // shown then deducted
  const intervention2 = interventionUnit;
  const subtotalBefore = diag + intervention1 + intervention2 + products;
  const discount = intervention1; // "1ère intervention offerte"
  const subtotal = subtotalBefore - discount;

  const ht = subtotal;
  const tva = Math.round(ht * 0.20);
  const ttc = ht + tva;

  return {
    nuisible, logement, logements,
    diag, products, traitement, surfaceLine,
    interventionUnit, intervention1, intervention2,
    discount,
    ht, tva, ttc, subtotal, subtotalBefore,
  };
}

// ---- Helpers ----
function fmtEur(n) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}
function fmtEur2(n) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtRef() {
  // SAN-yyyymmdd-XXXX
  const d = new Date();
  const s = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const r = String(Math.floor(1000 + Math.random() * 8999));
  return `SAN-${s}-${r}`;
}

// Brand logo as inline SVG (purple wordmark with the heart-rat icon)
const SanaliaLogo = ({ height = 30, color = '#0E052A' }) => (
  <svg viewBox="0 0 180 40" height={height} aria-label="Sanalia">
    {/* Mark */}
    <g transform="translate(2,4)">
      <path
        d="M16 6 C 9 6, 4 11, 4 18 C 4 25, 12 30, 16 32 C 20 30, 28 25, 28 18 C 28 11, 23 6, 16 6 Z"
        fill="#635DDD"
      />
      <circle cx="11.5" cy="16" r="1.6" fill="#fff" />
      <circle cx="20.5" cy="16" r="1.6" fill="#fff" />
      <path d="M11 21 q5 4 10 0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </g>
    {/* Wordmark */}
    <text x="38" y="27" fontFamily="Uxum, sans-serif" fontWeight="700" fontSize="22" fill={color} letterSpacing="-0.5">
      sanalia
    </text>
  </svg>
);

// expose
Object.assign(window, {
  NUISIBLES, URGENCES, LOGEMENTS, STATUTS,
  buildDays, SLOTS, ADDR_DB,
  computeQuote, fmtEur, fmtEur2, fmtRef,
  SanaliaLogo,
});

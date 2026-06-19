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

  // 2 interventions, toutes deux facturées (offre de bienvenue retirée)
  const intervention1 = interventionUnit;
  const intervention2 = interventionUnit;
  const subtotalBefore = diag + intervention1 + intervention2 + products;
  const discount = 0; // offre retirée — la 1ère intervention est désormais facturée
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

// Real Sanalia wordmark (vectorized SVG from /logo-sanalia.svg, same one used on the home header).
// 159x57 viewBox — wordmark in #0E052A with the purple leaf accent on the "i" in #635DDD.
const SanaliaLogo = ({ height = 32, color = '#0E052A' }) => (
  <svg viewBox="0 0 159 57" height={height} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Sanalia">
    <g clipPath="url(#sanalia-logo-clip)">
      <mask id="sanalia-logo-mask" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="0" y="6" width="159" height="51">
        <path d="M159 6H0V57H159V6Z" fill="white"/>
      </mask>
      <g mask="url(#sanalia-logo-mask)">
        <path d="M23.9401 18.74V22.87H15.05V17.48C15.05 14.0267 13.9534 12.3 11.76 12.3C10.8267 12.3 10.1034 12.6733 9.59 13.42C9.07667 14.12 8.82 15.03 8.82 16.15C8.82 17.0833 9.1 18.11 9.66 19.23C10.22 20.3033 11.27 21.8433 12.81 23.85L19.3899 32.67C21.35 35.33 22.6567 37.4767 23.3101 39.11C24.01 40.7433 24.36 42.68 24.36 44.92C24.36 48.2333 23.1934 50.9867 20.8601 53.18C18.5267 55.3267 15.68 56.4 12.32 56.4C8.82 56.4 5.88 55.3033 3.5 53.11C1.16667 50.9167 0 47.5333 0 42.96V38.2H8.89V44.5C8.89 48.2333 10.0567 50.1 12.39 50.1C13.37 50.1 14.1634 49.7267 14.77 48.98C15.4234 48.2333 15.75 47.2533 15.75 46.04C15.75 44.8267 15.5167 43.7067 15.05 42.68C14.5834 41.6067 13.6034 40.09 12.11 38.13L5.53 29.45C3.57 26.8367 2.24 24.6433 1.54 22.87C0.886667 21.0967 0.56 19.0433 0.56 16.71C0.56 13.9567 1.58667 11.4833 3.64 9.29C5.74 7.09667 8.56333 6 12.11 6C15.5634 6 18.3866 7.16667 20.58 9.5C22.82 11.7867 23.9401 14.8667 23.9401 18.74ZM49.8515 55.7H41.2415L42.0815 50.8H41.2415C40.6349 51.78 40.0982 52.5967 39.6315 53.25C39.1649 53.8567 38.3714 54.5333 37.2514 55.28C36.1314 56.0267 34.9414 56.4 33.6814 56.4C31.4414 56.4 29.6682 55.6067 28.3615 54.02C27.1015 52.4333 26.4715 50.3567 26.4715 47.79C26.4715 45.1767 27.0315 42.82 28.1515 40.72C29.2715 38.5733 31.0915 36.2867 33.6115 33.86L41.1015 26.58V25.6C41.1015 22.3333 40.1681 20.7 38.3014 20.7C36.4348 20.7 35.5014 22.3333 35.5014 25.6V30.15H26.7514V27.56C26.7514 23.5 27.7781 20.3033 29.8314 17.97C31.8848 15.59 34.7081 14.4 38.3014 14.4C41.8948 14.4 44.7182 15.59 46.7715 17.97C48.8249 20.3033 49.8515 23.5233 49.8515 27.63V55.7ZM41.1015 44.43V34.28L37.8115 37.78C35.4315 40.3 34.2415 42.61 34.2415 44.71C34.2415 46.9033 35.0582 48 36.6915 48C38.2782 48 39.7482 46.81 41.1015 44.43ZM63.1614 55.7H54.4114V15.1H63.1614L62.3214 19.86H63.1614C65.3547 16.22 68.0147 14.4 71.1414 14.4C73.148 14.4 74.8514 15.2867 76.2514 17.06C77.6514 18.7867 78.3514 21.47 78.3514 25.11V55.7H69.6014V27.7C69.6014 24.7133 68.7147 23.22 66.9414 23.22C65.588 23.22 64.328 24.2933 63.1614 26.44V55.7ZM104.914 55.7H96.3036L97.1436 50.8H96.3036C95.697 51.78 95.1603 52.5967 94.6936 53.25C94.227 53.8567 93.4336 54.5333 92.3136 55.28C91.1936 56.0267 90.0036 56.4 88.7436 56.4C86.5036 56.4 84.7303 55.6067 83.4236 54.02C82.1636 52.4333 81.5336 50.3567 81.5336 47.79C81.5336 45.1767 82.0936 42.82 83.2136 40.72C84.3336 38.5733 86.1536 36.2867 88.6736 33.86L96.1636 26.58V25.6C96.1636 22.3333 95.2303 20.7 93.3636 20.7C91.497 20.7 90.5636 22.3333 90.5636 25.6V30.15H81.8136V27.56C81.8136 23.5 82.8403 20.3033 84.8936 17.97C86.947 15.59 89.7703 14.4 93.3636 14.4C96.957 14.4 99.7803 15.59 101.834 17.97C103.887 20.3033 104.914 23.5233 104.914 27.63V55.7ZM96.1636 44.43V34.28L92.8736 37.78C90.4936 40.3 89.3036 42.61 89.3036 44.71C89.3036 46.9033 90.1203 48 91.7536 48C93.3403 48 94.8103 46.81 96.1636 44.43ZM109.473 6.7H118.223V55.7H109.473V6.7ZM127 10.5L132.893 6.7C132.893 10.7133 131.377 13.1867 128.343 14.12V15.1H131.843V55.7H123.093V15.1H126.593V14.12C123.56 13.1867 127 14.5133 127 10.5ZM158.693 55.7H150.083L150.923 50.8H150.083C149.477 51.78 148.94 52.5967 148.473 53.25C148.007 53.8567 147.213 54.5333 146.093 55.28C144.973 56.0267 143.783 56.4 142.523 56.4C140.283 56.4 138.51 55.6067 137.203 54.02C135.943 52.4333 135.313 50.3567 135.313 47.79C135.313 45.1767 135.873 42.82 136.993 40.72C138.113 38.5733 139.933 36.2867 142.453 33.86L149.943 26.58V25.6C149.943 22.3333 149.01 20.7 147.143 20.7C145.277 20.7 144.343 22.3333 144.343 25.6V30.15H135.593V27.56C135.593 23.5 136.62 20.3033 138.673 17.97C140.727 15.59 143.55 14.4 147.143 14.4C150.737 14.4 153.56 15.59 155.613 17.97C157.667 20.3033 158.693 23.5233 158.693 27.63V55.7ZM149.943 44.43V34.28L146.653 37.78C144.273 40.3 143.083 42.61 143.083 44.71C143.083 46.9033 143.9 48 145.533 48C147.12 48 148.59 46.81 149.943 44.43Z" fill={color}/>
      </g>
      <path d="M123.391 16.6304C123.251 16.003 123.036 15.3996 122.836 14.8434C122.526 13.9844 122.232 13.1859 122.088 12.3126C121.818 10.6778 122.05 8.63123 124.452 5.74813C126.242 3.59975 129.234 2.31614 131.963 1.63019C133.309 1.29191 134.546 1.11031 135.462 1.03716C135.83 1.00778 136.137 0.998543 136.371 1.00018C136.415 1.23036 136.46 1.53314 136.497 1.8998C136.591 2.81441 136.636 4.06349 136.546 5.44831C136.364 8.25653 135.642 11.431 133.852 13.5794C131.484 16.4204 129.162 17.071 127.267 17.1069C126.288 17.1254 125.393 16.9797 124.591 16.8332C124.204 16.7625 123.805 16.6848 123.459 16.638C123.437 16.635 123.414 16.6333 123.391 16.6304Z" fill="#635DDD" stroke="white" strokeWidth="2"/>
    </g>
    <defs><clipPath id="sanalia-logo-clip"><rect width="159" height="57" fill="white"/></clipPath></defs>
  </svg>
);

// expose
Object.assign(window, {
  NUISIBLES, URGENCES, LOGEMENTS, STATUTS,
  buildDays, SLOTS, ADDR_DB,
  computeQuote, fmtEur, fmtEur2, fmtRef,
  SanaliaLogo,
});

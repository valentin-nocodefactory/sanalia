/* =========================================================
   Sanalia — App shell, state, navigation, tweaks
   ========================================================= */

// ---------- URL ↔ state serialization ----------
// Toutes les réponses sont encodées dans l'URL pour qu'un lien partagé
// (par email, SMS, copier/coller) restitue la même configuration de devis.
function stateToParams(o) {
  const p = new URLSearchParams();
  if (o.audience === 'pro') p.set('a', 'pro');
  if (o.nuisible) p.set('n', o.nuisible);
  if (o.logement && o.logement.length) p.set('l', o.logement.join(','));
  if (o.surface && o.surface !== 50) p.set('s', String(o.surface));
  if (o.statut && o.statut !== 'proprio') p.set('st', o.statut);
  if (o.adresse?.line) p.set('adr', o.adresse.line);
  if (o.adresse?.cp) p.set('cp', o.adresse.cp);
  if (o.adresse?.city) p.set('city', o.adresse.city);
  if (o.adresse?.extra) p.set('ext', o.adresse.extra);
  if (o.creneau?.day) p.set('d', o.creneau.day);
  if (o.creneau?.slot) p.set('sl', o.creneau.slot);
  if (o.creneau?.day2) p.set('d2', o.creneau.day2);
  if (o.creneau?.slot2) p.set('sl2', o.creneau.slot2);
  if (o.coords?.first) p.set('fn', o.coords.first);
  if (o.coords?.last) p.set('ln', o.coords.last);
  if (o.coords?.email) p.set('em', o.coords.email);
  if (o.coords?.phone) p.set('tel', o.coords.phone);
  if (o.coords?.phoneCountry && o.coords.phoneCountry !== 'FR') p.set('tc', o.coords.phoneCountry);
  if (o.coords?.company) p.set('co', o.coords.company);
  if (o.coords?.siret) p.set('si', o.coords.siret);
  if (typeof o.step === 'number' && o.step > 0) p.set('step', String(o.step));
  if (o.variant === 'mission') p.set('v', 'm');
  if (o.quoteRequested) p.set('qr', '1');
  return p;
}

function paramsToState(p) {
  const get = k => p.get(k) || '';
  return {
    audience: get('a') === 'pro' ? 'pro' : 'particulier',
    // Aucune valeur par défaut : l'utilisateur doit choisir explicitement.
    nuisible: get('n'),
    logement: get('l') ? get('l').split(',').filter(Boolean) : [],
    surface: Number(get('s')) || 50, // counter, pas de valeur "vide" → 50 m² comme point de départ
    statut: get('st'),
    adresse: {
      line: get('adr'),
      cp: get('cp'),
      city: get('city'),
      extra: get('ext'),
    },
    creneau: {
      day: get('d'),
      slot: get('sl'),
      day2: get('d2'),
      slot2: get('sl2'),
    },
    coords: {
      first: get('fn'),
      last: get('ln'),
      email: get('em'),
      phone: get('tel'),
      phoneCountry: get('tc') || 'FR',
      company: get('co'),
      siret: get('si'),
    },
    step: Number(get('step')) || 0,
    variant: get('v') === 'm' ? 'mission' : 'invoice',
    quoteRequested: get('qr') === '1',
  };
}

function buildShareUrl(o) {
  // Pour le partage, on force step=7 (recap "devis") afin que le destinataire arrive sur le devis
  const params = stateToParams({ ...o, step: 7 });
  const qs = params.toString();
  return `${window.location.origin}${window.location.pathname}${qs ? '?' + qs : ''}`;
}

const __INITIAL = paramsToState(new URLSearchParams(window.location.search));

const STEPS = [
  { id: 'nuisible', label: 'Nuisible',     short: '1' },
  { id: 'logement', label: 'Logement',     short: '2' },
  { id: 'surface',  label: 'Surface',      short: '3' },
  { id: 'statut',   label: 'Statut',       short: '4' },
  { id: 'adresse',  label: 'Adresse',      short: '5' },
  { id: 'creneau',  label: 'Créneau',      short: '6' },
  { id: 'coords',   label: 'Coordonnées',  short: '7' },
  { id: 'recap',    label: 'Devis',        short: '8' },
  { id: 'paiement', label: 'Paiement',     short: '9' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "sidebar",
  "density": "cozy",
  "audience": "particulier",
  "recapVariant": "invoice",
  "accent": "purple",
  "showUrgency": true
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweaks] = useTweaks({ ...TWEAK_DEFAULTS, recapVariant: __INITIAL.variant, audience: __INITIAL.audience });

  // Form state — initialisé depuis l'URL si présent, sinon valeurs par défaut
  const [step, setStep] = useState(__INITIAL.step);
  const [audience, setAudience] = useState(__INITIAL.audience);
  const [nuisible, setNuisible] = useState(__INITIAL.nuisible);
  const [logement, setLogement] = useState(__INITIAL.logement);
  const [surface, setSurface]   = useState(__INITIAL.surface);
  const [statut, setStatut]     = useState(__INITIAL.statut);
  const [adresse, setAdresse]   = useState(__INITIAL.adresse);
  const [creneau, setCreneau]   = useState(__INITIAL.creneau);
  const [coords, setCoords]     = useState(__INITIAL.coords);
  const [payMethod, setPayMethod] = useState('card');
  const [confetti, setConfetti] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // Le prix exact n'est révélé qu'après clic sur "Recevoir mon devis" (étape 7 → 8).
  // Avant ça, le récap affiche le bloc "Votre prix personnalisé" verrouillé.
  const [quoteRequestedManual, setQuoteRequestedManual] = useState(__INITIAL.quoteRequested);
  // Lead ID retourné par le webhook au 1er POST ("Recevoir mon devis").
  // Ré-utilisé dans tous les POSTs suivants (acompte payé, paiement complété, etc.).
  // leadReady = true dès qu'on a un leadId OU qu'un timeout s'est écoulé sans réponse
  // (fallback pour ne pas bloquer l'UX si n8n ne répond pas avec le leadId).
  const [leadId, setLeadId] = useState(null);
  const [leadReady, setLeadReady] = useState(false);
  const leadIdRef = useRef(null);
  useEffect(() => { leadIdRef.current = leadId; if (leadId) setLeadReady(true); }, [leadId]);

  // Sync state → URL (replaceState pour ne pas polluer l'historique)
  useEffect(() => {
    const params = stateToParams({
      audience, nuisible, logement, surface, statut, adresse, creneau, coords,
      step, variant: tweaks.recapVariant, quoteRequested: quoteRequestedManual,
    });
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? '?' + qs : ''}`;
    window.history.replaceState(null, '', url);
  }, [audience, nuisible, logement, surface, statut, adresse, creneau, coords, step, tweaks.recapVariant, quoteRequestedManual]);

  const ref = useRef(fmtRef());
  const state = { audience, nuisible, logement, surface, statut, adresse, creneau, coords };
  const quote = computeQuote(state);
  // Show real price only once contact details are filled — otherwise "à partir de 149€"
  const hasCoords = !!(coords.first && coords.last && coords.email && coords.phone);
  // Le prix réel n'est dévoilé qu'après clic sur "Recevoir mon devis" OU dès qu'on est arrivé à l'étape 8/9 par quick-nav
  const sidNow = STEPS[step]?.id;
  const quoteRequested = quoteRequestedManual || sidNow === 'recap' || sidNow === 'paiement';

  // Validation per step
  const canAdvance = useMemo(() => {
    switch (STEPS[step]?.id) {
      case 'nuisible': return !!nuisible;
      case 'logement': return Array.isArray(logement) ? logement.length > 0 : !!logement;
      case 'surface':  return surface >= 10;
      case 'statut':   return !!statut;
      case 'adresse':  return !!adresse.line && !!adresse.cp && !!adresse.city;
      case 'creneau':  return !!creneau.day && !!creneau.slot && !!creneau.day2 && !!creneau.slot2;
      case 'coords': {
        // Validation stricte : email format + téléphone longueur correcte selon le pays.
        const validEmail = window.isValidEmail ? window.isValidEmail(coords.email) : !!coords.email;
        const phoneCountry = (window.PHONE_COUNTRIES || []).find(c => c.code === (coords.phoneCountry || 'FR')) || (window.PHONE_COUNTRIES || [])[0];
        const validPhone = phoneCountry && window.isValidPhone ? window.isValidPhone(coords.phone, phoneCountry) : !!coords.phone;
        const ok = coords.first && coords.last && validEmail && validPhone;
        return audience === 'pro' ? (ok && coords.company) : ok;
      }
      case 'recap':    return true;
      case 'paiement': return false;
      default:         return false;
    }
  }, [step, nuisible, logement, surface, statut, adresse, creneau, coords, audience]);

  // 2 endpoints n8n :
  //   LEAD_WEBHOOK   = création du lead au clic "Recevoir mon devis", awaitResponse → renvoie { leadId }
  //   EVENT_WEBHOOK  = tracking des événements suivants (validé, partagé, téléchargé, payé) avec lead_id
  const LEAD_WEBHOOK  = 'https://n8n.srv1336530.hstgr.cloud/webhook/e0762f14-4aee-4f37-bdfa-d17c2e45ec1d';
  const EVENT_WEBHOOK = 'https://n8n.srv1336530.hstgr.cloud/webhook/1f0e78b4-720e-4cbc-b09e-82654cf58f15';

  function buildBasePayload() {
    const dialCode = (window.PHONE_COUNTRIES || []).find(c => c.code === (coords.phoneCountry || 'FR'))?.dial || '+33';
    const utm = {};
    try {
      const p = new URLSearchParams(window.location.search);
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k => {
        const v = p.get(k); if (v) utm[k] = v;
      });
    } catch (e) {}

    return {
      // Lead ID (présent dès le 2e événement, null au tout 1er)
      lead_id: leadIdRef.current || null,
      form_type: 'devis',
      is_pro: audience === 'pro',
      // Identité
      first: coords.first || '',
      last: coords.last || '',
      email: coords.email || '',
      phone: coords.phone || '',
      phone_country: coords.phoneCountry || 'FR',
      phone_full: `${dialCode} ${(coords.phone || '').trim()}`.trim(),
      company: coords.company || '',
      siret: coords.siret || '',
      // Adresse
      address: adresse.line || '',
      postcode: adresse.cp || '',
      city: adresse.city || '',
      address_extra: adresse.extra || '',
      // Demande
      nuisible: nuisible || '',
      nuisible_label: NUISIBLES.find(n => n.id === nuisible)?.label || '',
      logement: Array.isArray(logement) ? logement.join(',') : (logement || ''),
      logement_labels: (Array.isArray(logement) ? logement : [logement]).map(id => LOGEMENTS.find(l => l.id === id)?.label).filter(Boolean).join(' + '),
      surface_m2: surface || '',
      statut: statut || '',
      // Créneaux
      rdv1_date: creneau.day || '',
      rdv1_slot: creneau.slot || '',
      rdv2_date: creneau.day2 || '',
      rdv2_slot: creneau.slot2 || '',
      // Devis
      quote_ref: ref.current,
      quote_total_ttc: quote ? quote.ttc : null,
      quote_total_ht: quote ? quote.ht : null,
      deposit_eur: 49,
      // Meta
      submitted_at: new Date().toISOString(),
      page_url: window.location.href,
      share_url: buildShareUrl({ audience, nuisible, logement, surface, statut, adresse, creneau, coords, variant: tweaks.recapVariant, quoteRequested: true }),
      utm,
    };
  }

  // Extracteur tolérant — supporte les formats de réponse n8n :
  //   { leadId: "..." } | { lead_id: "..." } | { id: "..." }
  //   { records: [{ id }] }                                                      (Airtable list)
  //   { "{\"leadId\":\"abc\"}": { id: "abc", ... } }                              (n8n malformé)
  //   { fields: { ... }, id: "..." }                                              (Airtable single)
  function extractLeadId(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.leadId) return data.leadId;
    if (data.lead_id) return data.lead_id;
    if (data.id) return data.id;
    // Airtable records
    if (Array.isArray(data.records) && data.records[0]?.id) return data.records[0].id;
    // n8n payload malformé : la clé est une string JSON, la valeur contient l'id
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const v = data[keys[0]];
      if (v && typeof v === 'object' && (v.id || v.leadId || v.lead_id)) {
        return v.id || v.leadId || v.lead_id;
      }
      try {
        const parsed = JSON.parse(keys[0]);
        if (parsed && (parsed.leadId || parsed.lead_id || parsed.id)) {
          return parsed.leadId || parsed.lead_id || parsed.id;
        }
      } catch (e) {}
    }
    return null;
  }

  // 1er POST : création du lead. Au clic "Recevoir mon devis" (étape 7 → 8).
  // On attend la réponse pour récupérer le leadId qu'on stocke pour tous les events suivants.
  async function submitLead() {
    const payload = { ...buildBasePayload(), event_type: 'lead_created' };
    try {
      const res = await fetch(LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const newLeadId = extractLeadId(data);
        if (newLeadId) {
          setLeadId(newLeadId);
          leadIdRef.current = newLeadId;
          return newLeadId;
        } else {
          console.warn('[Sanalia lead] Réponse reçue mais leadId introuvable :', data);
        }
      }
    } catch (err) {
      console.warn('[Sanalia lead webhook]', err);
    }
    return null;
  }

  // POSTs de tracking (validé, partagé, téléchargé, payé). Fire-and-forget, embarquent lead_id.
  function trackEvent(eventType, extra = {}) {
    const payload = { ...buildBasePayload(), event_type: eventType, ...extra };
    try {
      fetch(EVENT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
        keepalive: true, // assure l'envoi même si l'utilisateur change de page
      }).catch(err => console.warn('[Sanalia track]', eventType, err));
    } catch (err) {
      console.warn('[Sanalia track] error:', err);
    }
  }

  // Refs pour que les callbacks différés (setTimeout dans StepNuisible, etc.)
  // lisent toujours la version la plus récente — sinon les closures stales bloquent
  // l'avance après un changement de state asynchrone.
  const stateRef = useRef();
  stateRef.current = { nuisible, logement, surface, statut, adresse, creneau, coords, audience, step };

  function isStepValid(stepIdx, s) {
    switch (STEPS[stepIdx]?.id) {
      case 'nuisible': return !!s.nuisible;
      case 'logement': return Array.isArray(s.logement) ? s.logement.length > 0 : !!s.logement;
      case 'surface':  return s.surface >= 10;
      case 'statut':   return !!s.statut;
      case 'adresse':  return !!s.adresse.line && !!s.adresse.cp && !!s.adresse.city;
      case 'creneau':  return !!s.creneau.day && !!s.creneau.slot && !!s.creneau.day2 && !!s.creneau.slot2;
      case 'coords': {
        const validEmail = window.isValidEmail ? window.isValidEmail(s.coords.email) : !!s.coords.email;
        const phoneCountry = (window.PHONE_COUNTRIES || []).find(c => c.code === (s.coords.phoneCountry || 'FR')) || (window.PHONE_COUNTRIES || [])[0];
        const validPhone = phoneCountry && window.isValidPhone ? window.isValidPhone(s.coords.phone, phoneCountry) : !!s.coords.phone;
        const ok = s.coords.first && s.coords.last && validEmail && validPhone;
        return s.audience === 'pro' ? (ok && s.coords.company) : ok;
      }
      case 'recap':    return true;
      case 'paiement': return false;
      default:         return false;
    }
  }

  // Auto-avance après sélection d'un nuisible (clic = signal d'intention claire).
  // Évite les soucis de closure stale du setTimeout(onAdvance) côté StepNuisible.
  useEffect(() => {
    if (STEPS[step]?.id === 'nuisible' && nuisible) {
      const t = setTimeout(() => {
        setStep(s => s === step ? s + 1 : s);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [nuisible, step]);

  function next() {
    const s = stateRef.current;
    if (!isStepValid(s.step, s) || s.step >= STEPS.length - 1) return;
    // Sur "Recevoir mon devis" (coords → recap) : on dévoile le prix
    // ET on crée le lead côté back (POST + récupère leadId pour les events suivants).
    if (STEPS[s.step]?.id === 'coords') {
      setQuoteRequestedManual(true);
      submitLead(); // fire-and-forget côté UX, mais await en interne pour stocker leadId
    }
    setStep(s.step + 1);
  }
  function prev() { if (step > 0) setStep(step - 1); }
  function goto(i) { if (i >= 0 && i <= step) setStep(i); }

  function handleAudience(a) { setAudience(a); setTweaks({ audience: a }); }

  // Acompte payé via Stripe (ou simulé en dev). Track avec lead_id.
  function handlePay(method) {
    setPayMethod(method);
    trackEvent('payment_completed', { payment_method: method, payment_amount_eur: 49 });
    setStep(STEPS.length); // success
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3500);
  }

  // "Valider le devis" (étape 8) : track event, pas de POST bloquant.
  function handleValidateQuote() {
    trackEvent('quote_validated');
  }

  function handleRestart() {
    setStep(0);
    setNuisible(''); setLogement([]); setStatut('');
    setSurface(50);
    setAdresse({ line:'', cp:'', city:'', extra:'' });
    setCreneau({ day:'', slot:'', day2:'', slot2:'' });
    setCoords({ first:'', last:'', email:'', phone:'', phoneCountry:'FR', company:'', siret:'' });
    setQuoteRequestedManual(false);
    ref.current = fmtRef();
    window.history.replaceState(null, '', window.location.pathname);
  }

  function handleDownload() {
    // Génère + déclenche le téléchargement local + envoie au back en base64
    let pdfBase64 = null;
    let pdfFilename = null;
    if (typeof window.downloadQuotePDF === 'function' && quote) {
      const pdf = window.downloadQuotePDF(state, quote, ref.current, leadIdRef.current);
      if (pdf) {
        pdfBase64 = pdf.base64;
        pdfFilename = pdf.filename;
      }
    }
    trackEvent('quote_downloaded', pdfBase64 ? { pdf_base64: pdfBase64, pdf_filename: pdfFilename } : {});
    setDownloadOpen(true);
    setTimeout(() => setDownloadOpen(false), 2400);
  }
  function handleShare() {
    trackEvent('quote_share_opened');
    setShareOpen(true);
  }
  // Submit du modal de partage : génère le PDF et envoie au back avec recipient.
  // Email : on attache pdf_base64 → n8n envoie le mail avec PDF en pièce jointe.
  // SMS : pas d'attachement possible côté SMS, on envoie juste share_url.
  function handleSendQuote({ channel, recipient }) {
    const extra = { channel, recipient };
    if (channel === 'email') {
      extra.recipient_email = recipient;
      if (typeof window.generateQuotePDF === 'function' && quote) {
        const pdf = window.generateQuotePDF(state, quote, ref.current, leadIdRef.current);
        if (pdf) {
          extra.pdf_base64 = pdf.base64;
          extra.pdf_filename = pdf.filename;
        }
      }
    } else if (channel === 'sms') {
      extra.recipient_phone = recipient;
      // share_url est déjà inclus dans buildBasePayload, mais on le double pour clarté
    }
    trackEvent('quote_shared', extra);
  }
  function handleReserve() {
    trackEvent('reservation_started');
    const idx = STEPS.findIndex(s => s.id === 'paiement');
    if (idx >= 0) setStep(idx);
  }

  // URL partageable qui restitue tout l'état du devis (étape 8 pour le destinataire)
  const shareUrl = buildShareUrl({ audience, nuisible, logement, surface, statut, adresse, creneau, coords, variant: tweaks.recapVariant, quoteRequested: quoteRequestedManual || (sidNow === 'recap' || sidNow === 'paiement') });

  // Active step renderer
  let stepNode = null;
  const sid = STEPS[step]?.id;
  if (sid === 'nuisible') stepNode = <StepNuisible value={nuisible} audience={audience} onAudience={handleAudience} onChange={setNuisible} onAdvance={next}/>;
  else if (sid === 'logement') stepNode = <StepLogement value={logement} onChange={setLogement}/>;
  else if (sid === 'surface')  stepNode = <StepSurface surface={surface} onSurface={setSurface}/>;
  else if (sid === 'statut')   stepNode = <StepStatut value={statut} logement={logement} onChange={setStatut}/>;
  else if (sid === 'adresse')  stepNode = <StepAdresse adresse={adresse} onChange={setAdresse}/>;
  else if (sid === 'creneau')  stepNode = <StepCreneau value={creneau} onChange={setCreneau}/>;
  else if (sid === 'coords')   stepNode = <StepCoords audience={audience} value={coords} onChange={setCoords}/>;
  else if (sid === 'recap')    stepNode = <StepRecap state={state} quote={quote} hasCoords={hasCoords} quoteRef={ref.current} leadId={leadId} onDownload={handleDownload} onShare={handleShare} onReserve={handleReserve} onGoto={goto} onValidate={handleValidateQuote} onPay={handlePay} layout={tweaks.layout} variant={tweaks.recapVariant}/>;
  else if (sid === 'paiement') stepNode = <StepPaiement state={state} quote={quote} hasCoords={hasCoords} quoteRef={ref.current} layout={tweaks.layout} onPay={handlePay} onBack={() => setStep(STEPS.findIndex(s => s.id === 'recap'))}/>;
  else if (step >= STEPS.length) stepNode = <StepSuccess state={state} quote={quote} quoteRef={ref.current} payMethod={payMethod} onRestart={handleRestart}/>;

  const inSuccess = step >= STEPS.length;
  const showRail = !inSuccess;

  // Quand l'app est intégrée dans une page avec la navbar Sanalia traditionnelle
  // (ex: /contact-devis/), on masque l'appbar interne pour éviter le doublon.
  const useExternalNavbar = window.__SANALIA_USE_TRADITIONAL_NAVBAR === true;

  return (
    <div className={'app density-' + tweaks.density + (useExternalNavbar ? ' app-embed' : '')}>
      {/* Topbar interne — masquée quand on utilise la navbar traditionnelle Sanalia */}
      {!useExternalNavbar && (
        <header className="appbar">
          <div className="appbar-logo"><SanaliaLogo height={30}/></div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div className="stepdots">
              {STEPS.map((s, i) => (
                <div key={s.id} className={'stepdot' + (i < step ? ' done' : i === step ? ' active' : '')} title={s.label}/>
              ))}
            </div>
            <a className="appbar-phone" href="tel:0102030405">
              <span className="appbar-phone-dot"><Ic.Phone width={14} height={14}/></span>
              <span className="appbar-phone-num">01 02 03 04 05</span>
            </a>
          </div>
        </header>
      )}

      {/* Step dots compacts dans le header traditionnel */}
      {useExternalNavbar && step < STEPS.length && (
        <div className="app-embed-dots">
          <div className="stepdots">
            {STEPS.map((s, i) => (
              <div key={s.id} className={'stepdot' + (i < step ? ' done' : i === step ? ' active' : '')} title={s.label}/>
            ))}
          </div>
          <span className="app-embed-dots-meta">{step + 1} / {STEPS.length}</span>
        </div>
      )}

      {/* Shell */}
      <main
        className={'shell layout-' + (inSuccess ? 'fullwidth' : tweaks.layout) + ((showRail && sid !== 'recap' && sid !== 'paiement') ? '' : ' no-rail')}
        style={{maxWidth: inSuccess ? 720 : (tweaks.layout === 'fullwidth' ? 760 : (sid === 'recap' || sid === 'paiement' ? 1140 : (showRail ? 1200 : 980)))}}
      >
        <div>
          {!inSuccess && (
            <div className="recap-inline">
              <div className="recap-inline-row">
                <div className="recap-inline-summary">
                  {nuisible ? <><strong>{NUISIBLES.find(n => n.id === nuisible)?.label}</strong></> : 'Devis en cours'}
                  {logement && logement.length > 0 && <> · {logement.map(id => LOGEMENTS.find(l => l.id === id)?.label).filter(Boolean).join(' + ')}</>}
                  {surface && nuisible && <> · {surface} m²</>}
                  {creneau.day && <> · {new Date(creneau.day).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</>}
                </div>
                {quote && (
                  <div className="recap-inline-price">
                    {quoteRequested ? (
                      <>
                        <div className="pv">{audience === 'pro' ? fmtEur(quote.ht) : fmtEur(quote.ttc)}</div>
                        <div className="pu">{audience === 'pro' ? 'HT' : 'TTC'}</div>
                      </>
                    ) : (
                      <div style={{display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--c-mut-2)',letterSpacing:'.04em',textTransform:'uppercase'}}>
                        <Ic.Lock width={12} height={12}/> Prix après contact
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!inSuccess && (sid === 'recap' || sid === 'paiement') && (
            /* Pour les étapes 8 (Devis) et 9 (Paiement), pas de gros cartouche blanc englobant.
               Les blocs internes sont des cartes flottantes indépendantes. */
            <div className="step-naked">
              {stepNode}
            </div>
          )}

          {!inSuccess && sid !== 'recap' && sid !== 'paiement' && (
            <div className="step-card">
              <div className="progress">
                <div className="progress-track">
                  <div className="progress-fill" style={{width: `${((step + 0.5) / STEPS.length) * 100}%`}}/>
                </div>
                <div className="progress-meta">{step + 1} / {STEPS.length}</div>
              </div>
              {stepNode}
              {sid !== 'nuisible' && (
                <div className="step-nav">
                  <button className="btn btn-ghost" onClick={prev}><Ic.ArrowL width={16} height={16}/> Précédent</button>
                  {sid === 'coords' ? (
                    <button className="btn btn-primary" onClick={next} disabled={!canAdvance}>
                      Recevoir mon devis <Ic.ArrowR width={16} height={16}/>
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={next} disabled={!canAdvance}>
                      Continuer <Ic.ArrowR width={16} height={16}/>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {inSuccess && stepNode}
        </div>

        {/* Sidebar récap — masquée sur les étapes 8 (devis) et 9 (paiement) où l'in-page CTA prend le relai.
            Affichée même sans nuisible choisi pour montrer l'état vide en step 0. */}
        {showRail && sid !== 'recap' && sid !== 'paiement' && (
          <aside className="recap-rail">
            <div className="recap-rail-head">
              <span className="rt">Devis</span>
              <span className="rid">{ref.current}</span>
            </div>
            <h3>Votre devis en temps réel</h3>
            <p className="rsub">Se construit étape par étape — sans engagement.</p>

            {/* Étape 0 (nuisible) : pas encore de réponse → état vide */}
            {step === 0 && (
              <div className="recap-empty-state">
                <div className="recap-empty-icon"><Ic.Sparkles width={22} height={22}/></div>
                <div className="recap-empty-title">Votre devis se construit ici</div>
                <div className="recap-empty-sub">Chaque réponse alimentera ce récapitulatif en temps réel.</div>
              </div>
            )}

            {/* Bloc PRESTATION : nuisible (step≥1) + logement (step≥2) + surface (step≥3) */}
            {step >= 1 && nuisible && quote && (
              <div className="recap-block recap-block-anim">
                <div className="recap-block-label">Nuisible</div>
                <div className="recap-block-body">
                  <div className="recap-line">
                    <strong>Traitement {quote.nuisible.label.toLowerCase()}</strong>
                  </div>
                  {step >= 2 && logement && logement.length > 0 && quote.logements && (
                    <div className="recap-sub">
                      {quote.logements.map(l => l.label).join(' + ')}
                      {step >= 3 && surface ? <> · {surface} m²</> : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bloc ADRESSE : visible une fois adresse complétée (step >= 5) */}
            {step >= 5 && adresse.line && adresse.cp && adresse.city && (
              <div className="recap-block recap-block-anim">
                <div className="recap-block-label">Adresse d'intervention</div>
                <div className="recap-block-body">
                  <div className="recap-sub">
                    {adresse.line}, {adresse.cp} {adresse.city}
                  </div>
                  {adresse.extra && <div className="recap-sub">{adresse.extra}</div>}
                </div>
              </div>
            )}

            {/* Bloc CRÉNEAUX : visible une fois créneaux choisis (step >= 6) */}
            {step >= 6 && creneau.day && creneau.slot && (
              <div className="recap-block recap-block-anim">
                <div className="recap-block-label">Rendez-vous prévus</div>
                <div className="recap-block-body">
                  <div className="recap-rdv">
                    <div className="recap-rdv-num">1</div>
                    <div className="recap-rdv-body">
                      <strong>{new Date(creneau.day).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</strong>
                      <small>{SLOTS.find(s=>s.id===creneau.slot)?.label || '—'}</small>
                    </div>
                  </div>
                  {creneau.day2 && creneau.slot2 && (
                    <div className="recap-rdv">
                      <div className="recap-rdv-num">2</div>
                      <div className="recap-rdv-body">
                        <strong>{new Date(creneau.day2).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</strong>
                        <small>{SLOTS.find(s=>s.id===creneau.slot2)?.label || '—'}</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pas de totaux ni de CTA dans le sidebar — le prix ne se dévoile que sur la page devis (étape 8). */}

            <div className="recap-perks">
              <div className="recap-perk"><Ic.Check/><span><strong>Annulation gratuite</strong> jusqu'à 48h avant</span></div>
              <div className="recap-perk"><Ic.Check/><span><strong>1<sup>ère</sup> intervention offerte</strong> !</span></div>
              <div className="recap-perk"><Ic.Check/><span>Techniciens <strong>certifiés Certibiocide</strong></span></div>
            </div>

            <div className="recap-rail-certs">
              <img src="../assets/certifications/20240119-Logo_Qualipro_Blue_Final_BG_Transparent.png" alt="Qualipro"/>
              <img src="../assets/certifications/certibiocide-dr.png" alt="Certibiocide"/>
            </div>
          </aside>
        )}
      </main>

      {/* Confetti */}
      {confetti && <Confetti/>}

      {/* Download modal */}
      {downloadOpen && (
        <div className="modal-backdrop" onClick={() => setDownloadOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="success-icon" style={{margin:'0 auto 16px',width:64,height:64,background:'linear-gradient(135deg,var(--c-p600),var(--c-p400))',boxShadow:'0 8px 20px -6px rgba(99,93,221,.5)'}}>
              <Ic.Download width={28} height={28}/>
            </div>
            <h3>Devis envoyé !</h3>
            <p>Le PDF est téléchargé sur votre appareil et envoyé à <strong style={{color:'var(--c-p900)'}}>{coords.email || 'votre email'}</strong>. Sans engagement, valable 7 jours.</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-secondary" onClick={() => setDownloadOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Share (devis) modal */}
      {shareOpen && (
        <SendQuoteModal
          shareUrl={shareUrl}
          quoteRef={ref.current}
          nuisibleLabel={NUISIBLES.find(n => n.id === nuisible)?.label || ''}
          defaultEmail={coords.email}
          defaultPhone={coords.phone}
          onSend={handleSendQuote}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Tweaks */}
      <TweaksPanel title="Tweaks" defaultOpen={false}>
        <TweakSection title="Étape devis (8) — version">
          <TweakRadio
            value={tweaks.recapVariant}
            onChange={v => setTweaks({ recapVariant: v })}
            options={[
              { value: 'invoice', label: 'A · Facture / devis' },
              { value: 'mission', label: 'B · Mission brief' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Layout du récap">
          <TweakRadio
            value={tweaks.layout}
            onChange={v => setTweaks({ layout: v })}
            options={[
              { value: 'sidebar',   label: 'Sidebar (récap sticky)' },
              { value: 'fullwidth', label: 'Full-width (résumé inline)' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Densité">
          <TweakRadio
            value={tweaks.density}
            onChange={v => setTweaks({ density: v })}
            options={[
              { value: 'cozy',    label: 'Aéré (par défaut)' },
              { value: 'compact', label: 'Compact (mobile-friendly)' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Audience">
          <TweakRadio
            value={tweaks.audience}
            onChange={v => { setTweaks({ audience: v }); setAudience(v); }}
            options={[
              { value: 'particulier', label: 'Particulier' },
              { value: 'pro',         label: 'Professionnel' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Navigation rapide">
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
            {STEPS.map((s, i) => (
              <button key={s.id}
                onClick={() => setStep(i)}
                style={{
                  padding:'8px 10px', fontSize:12,
                  border: i === step ? '1.5px solid var(--c-p600)' : '1px solid var(--c-line-soft)',
                  background: i === step ? 'var(--c-p100)' : '#fff',
                  color: 'var(--c-p900)',
                  borderRadius:8, cursor:'pointer', textAlign:'left',
                  fontFamily:'var(--font-uxum)', fontWeight: i === step ? 700 : 500,
                }}>
                <span style={{fontFamily:'var(--font-mono)',color:'var(--c-mut-2)',fontSize:10,marginRight:6}}>{String(i+1).padStart(2,'0')}</span>
                {s.label}
              </button>
            ))}
            <button onClick={() => setStep(STEPS.length)} style={{
              padding:'8px 10px', fontSize:12,
              border: inSuccess ? '1.5px solid var(--c-success)' : '1px solid var(--c-line-soft)',
              background: inSuccess ? 'rgba(34,197,94,.1)' : '#fff',
              color: 'var(--c-p900)', borderRadius:8, cursor:'pointer', textAlign:'left',
              fontFamily:'var(--font-uxum)', fontWeight: inSuccess ? 700 : 500,
              gridColumn: '1 / -1',
            }}>✓ Confirmation</button>
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function RecapRow({ k, v, ok }) {
  return (
    <div className={'recap-row' + (ok ? '' : ' placeholder')}>
      <span className="rk">{k}</span>
      <span className="rv">{ok ? v : '—'}</span>
    </div>
  );
}

function Confetti() {
  const colors = ['#635DDD','#F66C24','#22C55E','#F4E9C1','#ABE0D1','#FFD4CF'];
  const pieces = useMemo(() => Array.from({length: 60}, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.5,
    dur: 1.8 + Math.random() * 1.6,
    rotate: Math.random() * 360,
  })), []);
  return (
    <div className="confetti">
      {pieces.map(p => (
        <span key={p.id} className="confetti-piece" style={{
          left: p.left + '%',
          background: p.color,
          '--delay': p.delay + 's',
          '--dur': p.dur + 's',
          transform: `rotate(${p.rotate}deg)`,
        }}/>
      ))}
    </div>
  );
}

// Spinner keyframes (added once via style tag)
(function injectKf() {
  if (document.getElementById('sanalia-kf')) return;
  const s = document.createElement('style');
  s.id = 'sanalia-kf';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
})();

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

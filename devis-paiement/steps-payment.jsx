/* =========================================================
   Sanalia — Step components: Créneau, Coordonnées, Récap, Paiement, Succès
   ========================================================= */

// ===========================================================
// Step — Créneau (2 interventions)
// ===========================================================
function InterventionPicker({ idx, dayKey, slotKey, value, onChange, minOffset = 0 }) {
  const days = useMemo(() => {
    // 14 jours pour la 1ère intervention, ~21 jours pour la 2ᵉ (à partir de J+minOffset).
    const count = minOffset > 0 ? minOffset + 21 : 14;
    return buildDays(count, false).filter(d => {
      const today = new Date(); today.setHours(0,0,0,0);
      const dDate = new Date(d.iso);
      const diffDays = Math.round((dDate - today) / 86400000);
      return diffDays >= minOffset;
    });
  }, [minOffset]);
  // Pas de pré-sélection : l'utilisateur doit choisir un jour explicitement.
  const selectedDay = value[dayKey] || null;
  const stripRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }
  useEffect(() => {
    updateScrollState();
    const el = stripRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [days]);

  function scrollBy(delta) {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  function setDay(iso)  {
    if (idx === 0) {
      // When picking intervention 1, also seed intervention 2 to ~15 days later so the second picker opens with a sensible default
      const target = new Date(iso);
      target.setDate(target.getDate() + 15);
      const day2Iso = target.toISOString().slice(0,10);
      onChange({ ...value, [dayKey]: iso, [slotKey]: null, day2: day2Iso, slot2: null });
    } else {
      onChange({ ...value, [dayKey]: iso, [slotKey]: null });
    }
  }
  function setSlot(s)   { onChange({ ...value, [slotKey]: s }); }

  return (
    <div className={'intervention-block' + (idx === 0 ? ' first' : ' second')}>
      <div className="intervention-header">
        <div className={'intervention-num' + (idx === 0 ? ' free' : '')}>{idx + 1}</div>
        <div className="intervention-titles">
          <div className="intervention-title">
            {idx === 0 ? <>1<sup>ère</sup> intervention · <span style={{color:'var(--c-success-d)'}}>traitement</span></> : <>2<sup>e</sup> intervention · contrôle &amp; finition</>}
          </div>
          <div className="intervention-sub">
            {idx === 0
              ? <>Le technicien vient identifier le foyer et appliquer le traitement.</>
              : <>Vérification de l'efficacité ~15 jours plus tard, complément si nécessaire.</>}
          </div>
        </div>
        {idx === 0 && <span className="intervention-badge free">OFFERTE</span>}
      </div>
      <div className="intervention-body">
        <div className="intervention-step-label">Choisissez le jour</div>
        <div className="cal-wrap">
          <div className="cal-strip-wrap">
            <button
              type="button"
              className={'cal-nav cal-nav-prev' + (canScrollLeft ? '' : ' disabled')}
              onClick={() => scrollBy(-220)}
              aria-label="Jours précédents"
            >
              <Ic.ArrowL width={16} height={16}/>
            </button>
            <div className="cal-strip" ref={stripRef}>
              {days.map(d => (
                <button key={d.iso} type="button"
                  className={'cal-day' + (selectedDay === d.iso ? ' selected' : '') + (!d.available ? ' unavailable' : '')}
                  onClick={() => d.available && setDay(d.iso)} disabled={!d.available}>
                  <div className="cal-day-dow">{d.dow}</div>
                  <div className="cal-day-num">{d.day}</div>
                  <div className="cal-day-mo">{d.isToday ? "Auj." : d.isTomorrow ? "Demain" : d.mo}</div>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={'cal-nav cal-nav-next' + (canScrollRight ? '' : ' disabled')}
              onClick={() => scrollBy(220)}
              aria-label="Jours suivants"
            >
              <Ic.ArrowR width={16} height={16}/>
            </button>
          </div>
          <div className="intervention-step-label" style={{marginTop:14}}>Choisissez l'horaire</div>
          <div className="slots">
            {SLOTS.map((s, i) => {
              const isLast = i === 2 && idx === 0;
              return (
                <button key={s.id} type="button"
                  className={'slot-btn' + (value[slotKey] === s.id ? ' selected' : '') + (isLast ? ' last-spot' : '')}
                  onClick={() => setSlot(s.id)}>
                  {s.label}
                  <small>{s.meta}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCreneau({ value, onChange }) {
  const intervention1Done = !!(value.day && value.slot);
  const intervention2Done = !!(value.day2 && value.slot2);
  // 'tab1' = en train de choisir la 1ère, 'tab2' = en train de choisir la 2e
  const [activeTab, setActiveTab] = useState(intervention1Done ? 'tab2' : 'tab1');
  const wasDone1 = useRef(intervention1Done);

  // Auto-switch sur tab 2 dès que 1ère intervention est complétée
  useEffect(() => {
    if (intervention1Done && !wasDone1.current) {
      setActiveTab('tab2');
    }
    wasDone1.current = intervention1Done;
  }, [intervention1Done]);

  const day1Label = value.day ? new Date(value.day).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}) : '';
  const day2Label = value.day2 ? new Date(value.day2).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}) : '';
  const slot1 = SLOTS.find(s => s.id === value.slot);
  const slot2 = SLOTS.find(s => s.id === value.slot2);

  // Le 2e tab est verrouillé tant que le 1er n'est pas complété
  const tab2Locked = !intervention1Done;

  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 6 · Créneaux</div>
      <h1 className="headline">Choisissez vos <em>2 interventions</em></h1>
      <p className="subhead">Le traitement complet se fait en <strong>2 passages</strong>. Choisissez d'abord la 1<sup>ʳᵉ</sup>, puis la 2<sup>ᵉ</sup> environ 15 jours plus tard.</p>

      {/* Tabs 1ère / 2e intervention */}
      <div className="creneau-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tab1'}
          className={'creneau-tab' + (activeTab === 'tab1' ? ' active' : '') + (intervention1Done ? ' done' : '')}
          onClick={() => setActiveTab('tab1')}
        >
          <span className="creneau-tab-num">{intervention1Done ? <Ic.Check width={14} height={14}/> : '1'}</span>
          <span className="creneau-tab-body">
            <span className="creneau-tab-title">
              1<sup>ʳᵉ</sup> intervention
              <span className="creneau-tab-badge">Offerte</span>
            </span>
            <span className="creneau-tab-detail">
              {intervention1Done
                ? <><strong>{day1Label}</strong> · {slot1?.label}</>
                : <em>Date à choisir</em>}
            </span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tab2'}
          className={'creneau-tab' + (activeTab === 'tab2' ? ' active' : '') + (intervention2Done ? ' done' : '') + (tab2Locked ? ' locked' : '')}
          onClick={() => { if (!tab2Locked) setActiveTab('tab2'); }}
          disabled={tab2Locked}
        >
          <span className="creneau-tab-num">{intervention2Done ? <Ic.Check width={14} height={14}/> : (tab2Locked ? <Ic.Lock width={13} height={13}/> : '2')}</span>
          <span className="creneau-tab-body">
            <span className="creneau-tab-title">2<sup>ᵉ</sup> intervention</span>
            <span className="creneau-tab-detail">
              {intervention2Done
                ? <><strong>{day2Label}</strong> · {slot2?.label}</>
                : (tab2Locked ? <em>Choisir d'abord la 1ʳᵉ</em> : <em>Date à choisir</em>)}
            </span>
          </span>
        </button>
      </div>

      {/* Contenu du tab actif */}
      {activeTab === 'tab1' && (
        <InterventionPicker idx={0} dayKey="day"  slotKey="slot"  value={value} onChange={onChange} minOffset={0}/>
      )}
      {activeTab === 'tab2' && !tab2Locked && (
        <InterventionPicker idx={1} dayKey="day2" slotKey="slot2" value={value} onChange={onChange} minOffset={10}/>
      )}
    </div>
  );
}

// International phone input — mask + validation portés depuis js/phone-widget.js
// mask : `#` = un chiffre. len = nombre de chiffres nationaux attendus (sans le 0 ni le +X).
const COUNTRIES = [
  { code: 'FR', dial: '+33',  name: 'France',         flag: '🇫🇷', mask: '# ## ## ## ##',  len: 9  },
  { code: 'BE', dial: '+32',  name: 'Belgique',       flag: '🇧🇪', mask: '### ## ## ##',   len: 9  },
  { code: 'CH', dial: '+41',  name: 'Suisse',         flag: '🇨🇭', mask: '## ### ## ##',   len: 9  },
  { code: 'LU', dial: '+352', name: 'Luxembourg',     flag: '🇱🇺', mask: '### ### ###',    len: 9  },
  { code: 'MC', dial: '+377', name: 'Monaco',         flag: '🇲🇨', mask: '## ## ## ##',    len: 8  },
  { code: 'DE', dial: '+49',  name: 'Allemagne',      flag: '🇩🇪', mask: '### #######',    len: 10 },
  { code: 'GB', dial: '+44',  name: 'Royaume-Uni',    flag: '🇬🇧', mask: '#### ######',    len: 10 },
  { code: 'IT', dial: '+39',  name: 'Italie',         flag: '🇮🇹', mask: '### ### ####',   len: 10 },
  { code: 'ES', dial: '+34',  name: 'Espagne',        flag: '🇪🇸', mask: '### ### ###',    len: 9  },
  { code: 'PT', dial: '+351', name: 'Portugal',       flag: '🇵🇹', mask: '### ### ###',    len: 9  },
  { code: 'NL', dial: '+31',  name: 'Pays-Bas',       flag: '🇳🇱', mask: '## ### ####',    len: 9  },
  { code: 'IE', dial: '+353', name: 'Irlande',        flag: '🇮🇪', mask: '## ### ####',    len: 9  },
  { code: 'AT', dial: '+43',  name: 'Autriche',       flag: '🇦🇹', mask: '### #######',    len: 10 },
  { code: 'DK', dial: '+45',  name: 'Danemark',       flag: '🇩🇰', mask: '## ## ## ##',    len: 8  },
  { code: 'SE', dial: '+46',  name: 'Suède',          flag: '🇸🇪', mask: '## ### ## ##',   len: 9  },
  { code: 'NO', dial: '+47',  name: 'Norvège',        flag: '🇳🇴', mask: '### ## ###',     len: 8  },
  { code: 'FI', dial: '+358', name: 'Finlande',       flag: '🇫🇮', mask: '## ### ####',    len: 9  },
  { code: 'PL', dial: '+48',  name: 'Pologne',        flag: '🇵🇱', mask: '### ### ###',    len: 9  },
  { code: 'CZ', dial: '+420', name: 'Tchéquie',       flag: '🇨🇿', mask: '### ### ###',    len: 9  },
  { code: 'US', dial: '+1',   name: 'États-Unis',     flag: '🇺🇸', mask: '### ### ####',   len: 10 },
  { code: 'CA', dial: '+1',   name: 'Canada',         flag: '🇨🇦', mask: '### ### ####',   len: 10 },
  { code: 'MA', dial: '+212', name: 'Maroc',          flag: '🇲🇦', mask: '### ### ###',    len: 9  },
  { code: 'DZ', dial: '+213', name: 'Algérie',        flag: '🇩🇿', mask: '### ### ###',    len: 9  },
  { code: 'TN', dial: '+216', name: 'Tunisie',        flag: '🇹🇳', mask: '## ### ###',     len: 8  },
  { code: 'SN', dial: '+221', name: 'Sénégal',        flag: '🇸🇳', mask: '## ### ## ##',   len: 9  },
  { code: 'CI', dial: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮', mask: '## ## ## ## ##', len: 10 },
  { code: 'CM', dial: '+237', name: 'Cameroun',       flag: '🇨🇲', mask: '### ### ###',    len: 9  },
];

// Applique le masque "# # ## ## ##" à une string de chiffres.
function applyPhoneMask(mask, digits) {
  let out = '';
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    const ch = mask.charAt(i);
    if (ch === '#') { out += digits.charAt(di); di++; }
    else { out += ch; }
  }
  return out;
}

// Renvoie true si le téléphone (formaté) a le bon nombre de chiffres pour son pays.
function isValidPhone(formatted, country) {
  const digits = (formatted || '').replace(/\D/g, '');
  return digits.length === country.len;
}

function PhoneInput({ value, onChange, dialCode, onDialCodeChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const country = COUNTRIES.find(c => c.code === (dialCode || 'FR')) || COUNTRIES[0];
  const wrapRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Re-format value when country changes (e.g. switching FR → BE re-applies the new mask)
  useEffect(() => {
    let digits = (value || '').replace(/\D/g, '');
    if (digits.charAt(0) === '0') digits = digits.slice(1);
    digits = digits.slice(0, country.len);
    const formatted = applyPhoneMask(country.mask, digits);
    if (formatted !== (value || '')) onChange(formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country.code]);

  useEffect(() => {
    function onDoc(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  function handleChange(e) {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.charAt(0) === '0') digits = digits.slice(1);
    digits = digits.slice(0, country.len);
    onChange(applyPhoneMask(country.mask, digits));
  }
  function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) return;
    if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].indexOf(e.key) !== -1) return;
    if (e.key && e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  }

  const placeholder = country.mask.replace(/#/g, '_');
  const filtered = COUNTRIES.filter(c => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div className="phone-input" ref={wrapRef}>
      <button
        type="button"
        className="phone-country"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="phone-flag">{country.flag}</span>
        <span className="phone-dial">{country.dial}</span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.55}}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <input
        ref={inputRef}
        type="tel"
        className="phone-number"
        placeholder={placeholder}
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        inputMode="tel"
        autoComplete="tel"
      />
      {open && (
        <div className="phone-dropdown" role="listbox">
          <div className="phone-dropdown-search">
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher un pays…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoComplete="off"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="phone-dropdown-empty">Aucun pays trouvé</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={c.code === country.code}
                className={'phone-option' + (c.code === country.code ? ' selected' : '')}
                onClick={() => { onDialCodeChange(c.code); setSearch(''); setOpen(false); }}
              >
                <span className="phone-flag">{c.flag}</span>
                <span className="phone-name">{c.name}</span>
                <span className="phone-dial-mut">{c.dial}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// expose pour la validation cross-component (canAdvance notamment)
window.isValidPhone = isValidPhone;
window.isValidEmail = (s) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim());
window.PHONE_COUNTRIES = COUNTRIES;

// ===========================================================
// Step 8 — Coordonnées
// ===========================================================

// Mock French company directory — simulates a SIRENE/Pappers autocomplete.
// In prod this would call /api/companies?q= and return real entries.
const COMPANY_DB = [
  { name: 'Le Bistrot du Marais',    siret: '892 451 029 00018', city: '75004 Paris',   form: 'SARL' },
  { name: 'Boulangerie Camille',     siret: '503 218 774 00021', city: '75011 Paris',   form: 'EURL' },
  { name: 'Café des Halles',         siret: '821 660 442 00033', city: '75001 Paris',   form: 'SAS'  },
  { name: 'Restaurant Le Verger',    siret: '441 502 887 00014', city: '92100 Boulogne', form: 'SAS' },
  { name: 'Hôtel Beauséjour',        siret: '378 990 116 00027', city: '75009 Paris',   form: 'SA'   },
  { name: 'Pharmacie de la Bastille', siret: '512 003 478 00019', city: '75012 Paris',   form: 'SELARL' },
  { name: 'Boucherie Maître Antoine',siret: '634 217 095 00012', city: '75014 Paris',   form: 'SARL' },
  { name: 'SCI Les Tilleuls',        siret: '750 882 314 00015', city: '78000 Versailles', form: 'SCI' },
  { name: 'Crèche Les Lutins',       siret: '839 117 246 00029', city: '93100 Montreuil', form: 'Association' },
  { name: 'Garage Renault Bastille', siret: '612 549 882 00041', city: '75011 Paris',   form: 'SAS'  },
];

function CompanyAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef(null);
  const q = (value.company || '').trim();

  const matches = useMemo(() => {
    if (!q) return COMPANY_DB.slice(0, 6);
    const ql = q.toLowerCase();
    return COMPANY_DB.filter(c => c.name.toLowerCase().includes(ql) || c.siret.replace(/\s/g,'').includes(ql.replace(/\s/g,''))).slice(0, 8);
  }, [q]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function pick(c) {
    onChange({ ...value, company: c.name, siret: c.siret });
    setOpen(false);
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && matches[hi]) { e.preventDefault(); pick(matches[hi]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  const showSelected = !!value.siret && value.company;

  return (
    <div className="company-ac" ref={wrapRef}>
      <div className="input-wrap">
        <svg className="lead" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1"/></svg>
        <input
          className="input with-icon"
          placeholder="Tapez le nom de votre entreprise…"
          value={value.company || ''}
          onChange={e => { onChange({ ...value, company: e.target.value, siret: '' }); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          autoComplete="off"
        />
        {showSelected && (
          <span className="company-ac-check"><Ic.Check width={14} height={14}/></span>
        )}
      </div>
      {showSelected && (
        <div className="company-ac-meta">
          <span className="company-ac-meta-pill">SIRET {value.siret}</span>
          <button type="button" className="company-ac-meta-clear" onClick={() => onChange({ ...value, company: '', siret: '' })}>Changer</button>
        </div>
      )}
      {open && !showSelected && matches.length > 0 && (
        <div className="company-ac-list" role="listbox">
          <div className="company-ac-list-head">
            <span>Suggestions <span style={{color:'var(--c-mut-2)',fontWeight:400}}>· source SIRENE</span></span>
            <span style={{fontSize:10,color:'var(--c-mut-2)',fontFamily:'var(--font-mono)'}}>{matches.length}</span>
          </div>
          {matches.map((c, i) => (
            <button
              type="button"
              key={c.siret}
              className={'company-ac-item' + (i === hi ? ' hi' : '')}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(c)}
            >
              <div className="company-ac-item-main">
                <div className="company-ac-item-name">{c.name}</div>
                <div className="company-ac-item-sub">{c.form} · {c.city}</div>
              </div>
              <div className="company-ac-item-siret">{c.siret}</div>
            </button>
          ))}
          <div className="company-ac-list-foot">
            <Ic.Lock width={12} height={12}/>
            <span>Données publiques INSEE — le SIRET est rempli automatiquement.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// RFC-light email regex : suffisant pour valider à la saisie côté client.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function isValidEmail(s) { return !!s && EMAIL_RE.test(s.trim()); }

function StepCoords({ audience, value, onChange }) {
  const isPro = audience === 'pro';
  const [touched, setTouched] = useState({ email: false, phone: false });

  const phoneCountry = COUNTRIES.find(c => c.code === (value.phoneCountry || 'FR')) || COUNTRIES[0];
  const emailInvalid = touched.email && value.email && !isValidEmail(value.email);
  const phoneInvalid = touched.phone && value.phone && !isValidPhone(value.phone, phoneCountry);

  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 7 · Vos coordonnées</div>
      <h1 className="headline">À qui envoyons-nous le <em>devis</em> ?</h1>
      <p className="subhead">Aucune création de compte. Vos coordonnées servent uniquement à confirmer le rendez-vous.</p>

      {isPro && (
        <div className="field" style={{marginBottom:14}}>
          <label className="field-label">Société <span className="req">*</span></label>
          <CompanyAutocomplete value={value} onChange={onChange}/>
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label className="field-label">Prénom <span className="req">*</span></label>
          <input className="input" placeholder="Camille" value={value.first || ''} onChange={e => onChange({ ...value, first: e.target.value })} autoComplete="given-name"/>
        </div>
        <div className="field">
          <label className="field-label">Nom <span className="req">*</span></label>
          <input className="input" placeholder="Durand" value={value.last || ''} onChange={e => onChange({ ...value, last: e.target.value })} autoComplete="family-name"/>
        </div>
      </div>
      <div className="spacer"></div>
      <div className="field">
        <label className="field-label" htmlFor="coords-email">Email <span className="req">*</span></label>
        <div className="input-wrap">
          <Ic.Mail className="lead"/>
          <input
            id="coords-email"
            type="email"
            className={'input with-icon' + (emailInvalid ? ' input-invalid' : '')}
            placeholder="camille@email.com"
            value={value.email || ''}
            onChange={e => onChange({ ...value, email: e.target.value })}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            autoComplete="email"
            inputMode="email"
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? 'coords-email-err' : undefined}
          />
        </div>
        {emailInvalid && (
          <div id="coords-email-err" className="field-error">Format d'email invalide — exemple : prenom@domaine.com</div>
        )}
      </div>
      <div className="spacer"></div>
      <div className="field">
        <label className="field-label" htmlFor="coords-phone">Téléphone <span className="req">*</span></label>
        <div onBlur={() => setTouched(t => ({ ...t, phone: true }))}>
          <PhoneInput
            value={value.phone}
            onChange={phone => onChange({ ...value, phone })}
            dialCode={value.phoneCountry || 'FR'}
            onDialCodeChange={code => onChange({ ...value, phoneCountry: code })}
          />
        </div>
        {phoneInvalid && (
          <div className="field-error">Numéro incomplet — {phoneCountry.len} chiffres attendus pour {phoneCountry.name}.</div>
        )}
      </div>

      {isPro && (
        <>
          <div className="spacer"></div>
          <div className="field" style={{display:'none'}}>
            {/* SIRET kept in state for invoicing but hidden from UI — auto-filled from CompanyAutocomplete */}
            <input value={value.siret || ''} onChange={e => onChange({ ...value, siret: e.target.value })}/>
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================================
// Step 9 — Récap (devis stylé facture)
// ===========================================================
function StepRecap(props) {
  const variant = props.variant || 'invoice';
  if (variant === 'mission') return <StepRecapMission {...props}/>;
  return <StepRecapInvoice {...props}/>;
}

// Bloc d'actions partagé : Télécharger PDF · Envoyer le devis · Réserver l'intervention
function RecapActions({ quote, isPro, hasCoords, onDownload, onShare, onReserve }) {
  const totalAmount = isPro ? quote.ht : quote.ttc;
  const DEPOSIT = 49;
  const balance = Math.max(0, totalAmount - DEPOSIT);

  return (
    <div className="recap-actions-panel" role="group" aria-label="Actions sur le devis">
      <div className="recap-actions-eyebrow">
        <Ic.Sparkles width={12} height={12}/>
        <span>3 façons d'avancer</span>
      </div>
      <div className="recap-actions-secondary">
        <button type="button" className="action-tile" onClick={onDownload} aria-label="Télécharger le devis au format PDF">
          <span className="action-tile-icon"><Ic.Download width={20} height={20}/></span>
          <span className="action-tile-text">
            <strong>Télécharger</strong>
            <small>Devis PDF</small>
          </span>
        </button>
        <button type="button" className="action-tile" onClick={onShare} aria-label="Envoyer le devis par email ou SMS">
          <span className="action-tile-icon"><Ic.Send width={20} height={20}/></span>
          <span className="action-tile-text">
            <strong>Envoyer le devis</strong>
            <small>Email · SMS</small>
          </span>
        </button>
      </div>
      <button type="button" className="btn-reserve" onClick={onReserve} aria-label={`Réserver l'intervention pour ${fmtEur(totalAmount)}`}>
        <span className="reserve-icon"><Ic.Lock width={22} height={22}/></span>
        <span className="reserve-text">
          <strong>Réserver l'intervention</strong>
          <small>Acompte <b>{fmtEur(DEPOSIT)}</b> aujourd'hui · solde <b>{fmtEur(balance)}</b> après l'intervention</small>
        </span>
        <span className="reserve-price">
          <span className="reserve-price-amount">{hasCoords ? fmtEur(totalAmount) : '149€+'}</span>
          <span className="reserve-price-unit">{isPro ? 'HT' : 'TTC'}</span>
        </span>
      </button>
    </div>
  );
}

// Modale "Envoyer le devis" : Email / SMS / Copier le lien
// Le lien restitue intégralement la configuration du devis (URL ↔ état).
// onSend({ channel, recipient }) → délégué à App qui POST au back avec PDF base64 (email) ou share_url (SMS).
function SendQuoteModal({ shareUrl, quoteRef, nuisibleLabel, defaultEmail, defaultPhone, onSend, onClose }) {
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState(defaultEmail || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Fermeture via Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSend() {
    if (tab === 'email' && !email) return;
    if (tab === 'sms' && !phone) return;
    setSending(true);
    if (onSend) {
      onSend({ channel: tab, recipient: tab === 'email' ? email : phone });
    }
    // Petit delai visuel pour la confirmation
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(onClose, 900);
    }, 600);
  }

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    } else {
      // Fallback pour les contextes non-sécurisés
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
      document.body.removeChild(ta);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-send" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="send-modal-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
          <Ic.X width={16} height={16}/>
        </button>
        <h3 id="send-modal-title">Envoyer le devis</h3>
        <p>Partagez ce devis avec un proche, votre <strong style={{color:'var(--c-p900)'}}>propriétaire</strong>, votre <strong style={{color:'var(--c-p900)'}}>gestionnaire</strong> ou votre <strong style={{color:'var(--c-p900)'}}>conjoint·e</strong>. Le destinataire ouvrira le devis avec toutes vos réponses pré-remplies.</p>

        <div className="send-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab==='email'} className={'send-tab' + (tab==='email' ? ' active' : '')} onClick={() => setTab('email')}>
            <Ic.Mail/> Par email
          </button>
          <button type="button" role="tab" aria-selected={tab==='sms'} className={'send-tab' + (tab==='sms' ? ' active' : '')} onClick={() => setTab('sms')}>
            <Ic.Phone/> Par SMS
          </button>
        </div>

        {tab === 'email' ? (
          <div className="field">
            <label className="field-label" htmlFor="send-email">Adresse email du destinataire <span className="req">*</span></label>
            <div className="input-wrap">
              <Ic.Mail className="lead"/>
              <input id="send-email" type="email" className="input with-icon" placeholder="proprietaire@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus/>
            </div>
          </div>
        ) : (
          <div className="field">
            <label className="field-label" htmlFor="send-phone">Numéro de téléphone <span className="req">*</span></label>
            <div className="input-wrap">
              <Ic.Phone className="lead"/>
              <input id="send-phone" type="tel" className="input with-icon" placeholder="06 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} autoFocus/>
            </div>
          </div>
        )}

        <div className="send-help">
          <Ic.Sparkles width={14} height={14}/>
          <span>Le lien restitue <strong>toutes vos réponses</strong> : nuisible, logement, adresse, créneaux. Le destinataire peut directement consulter ou réserver.</span>
        </div>

        <div className="send-link-row">
          <div className="send-link-url" title={shareUrl}>{shareUrl}</div>
          <button type="button" className={'btn-copy' + (copied ? ' copied' : '')} onClick={handleCopy}>
            {copied ? <><Ic.Check width={14} height={14}/> Copié</> : <><Ic.Copy width={14} height={14}/> Copier le lien</>}
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={sending || sent}>Annuler</button>
          <button type="button" className="btn btn-primary" onClick={handleSend} disabled={(tab === 'email' ? !email : !phone) || sending || sent}>
            {sent ? <><Ic.Check width={16} height={16}/> Envoyé !</> :
              sending ? <>Envoi en cours…</> :
              <><Ic.Send width={16} height={16}/> {tab === 'email' ? 'Envoyer par email' : 'Envoyer par SMS'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepRecapInvoice({ state, quote, hasCoords, quoteRef, leadId, onDownload, onShare, onReserve, onGoto, onValidate, onPay, layout }) {
  const isPro = state.audience === 'pro';
  const adresseFull = [state.adresse.line, state.adresse.cp, state.adresse.city].filter(Boolean).join(' · ');
  const dayLabel = state.creneau.day ? new Date(state.creneau.day).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }) : '—';
  const day2Label = state.creneau.day2 ? new Date(state.creneau.day2).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }) : '—';
  const slot = SLOTS.find(s => s.id === state.creneau.slot);
  const slot2 = SLOTS.find(s => s.id === state.creneau.slot2);

  const total = isPro ? quote.ht : quote.ttc;
  const DEPOSIT = 49;
  const balance = Math.max(0, total - DEPOSIT);

  // État interne : 'devis' (vue par défaut) | 'payment' (formulaire CB)
  const [view, setView] = useState('devis');
  // États du formulaire de paiement (utilisés en vue 'payment')
  const [payEmail, setPayEmail]     = useState(state.coords?.email || '');
  const [cardNum, setCardNum]       = useState('');
  const [cardExp, setCardExp]       = useState('');
  const [cardCvc, setCardCvc]       = useState('');
  const [cardName, setCardName]     = useState(`${state.coords?.first || ''} ${state.coords?.last || ''}`.trim());
  const [promoOpen, setPromoOpen]   = useState(false);
  const [promoCode, setPromoCode]   = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);

  const promoDiscount = promoApplied
    ? (promoApplied.type === 'percent' ? Math.round(DEPOSIT * promoApplied.discount / 100) : Math.min(promoApplied.discount, DEPOSIT))
    : 0;
  const finalAmount = Math.max(0, DEPOSIT - promoDiscount);

  function applyPromo() {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    const found = PROMO_CODES[code];
    if (found) { setPromoApplied(found); setPromoError(''); }
    else { setPromoApplied(null); setPromoError('Code promo invalide ou expiré.'); }
  }
  function onCardNumChange(v) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    setCardNum(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
  }
  function onCardExpChange(v) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setCardExp(digits.length > 2 ? `${digits.slice(0,2)} / ${digits.slice(2)}` : digits);
  }
  function handleStripePay() {
    setProcessing(true);
    setTimeout(() => {
      if (onPay) onPay('card');
      else if (onReserve) onReserve();
      setProcessing(false);
    }, 1300);
  }
  function handleValidate() {
    if (onValidate) onValidate(); // track event côté App (fire-and-forget)
    setView('payment');
  }
  const canPay = payEmail && cardNum.replace(/\s/g,'').length >= 13 && cardExp.length >= 4 && cardCvc.length >= 3;

  return (
    <div className="recap-naked">
      <div className="recap-naked-head">
        <div className="recap-naked-meta">
          <div className="eyebrow"><span className="dot"></span>Étape 8 · Votre devis</div>
          <h1 className="headline">Votre devis est <em>prêt</em></h1>
          {view === 'payment' && (
            <p className="subhead">Saisissez vos infos de carte pour valider le paiement de l'acompte de <strong style={{color:'var(--c-p900)'}}>{fmtEur(DEPOSIT)}</strong> et bloquer votre créneau.</p>
          )}
        </div>

        {/* Lien discret : modifier le devis (jump-to-step) */}
        {onGoto && (
          <details className="recap-edit-menu">
            <summary className="recap-edit-trigger">
              <Ic.Edit width={13} height={13}/>
              <span>Modifier le devis</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.6}}><polyline points="6 9 12 15 18 9"/></svg>
            </summary>
            <div className="recap-edit-popover" role="menu">
              <button type="button" className="recap-edit-item" role="menuitem" onClick={() => onGoto(0)}>
                <span className="reei-num">1</span>
                <span>Le nuisible</span>
              </button>
              <button type="button" className="recap-edit-item" role="menuitem" onClick={() => onGoto(1)}>
                <span className="reei-num">2</span>
                <span>Type de logement</span>
              </button>
              <button type="button" className="recap-edit-item" role="menuitem" onClick={() => onGoto(2)}>
                <span className="reei-num">3</span>
                <span>Surface</span>
              </button>
              <button type="button" className="recap-edit-item" role="menuitem" onClick={() => onGoto(4)}>
                <span className="reei-num">5</span>
                <span>Adresse</span>
              </button>
              <button type="button" className="recap-edit-item" role="menuitem" onClick={() => onGoto(5)}>
                <span className="reei-num">6</span>
                <span>Créneaux</span>
              </button>
              <button type="button" className="recap-edit-item" role="menuitem" onClick={() => onGoto(6)}>
                <span className="reei-num">7</span>
                <span>Coordonnées</span>
              </button>
            </div>
          </details>
        )}
      </div>

      <div className="recap-2col">
        <div className={'recap-2col-doc' + (!leadId && view === 'devis' ? ' is-loading' : '')}>

        {/* Overlay flou + loader pendant la création du lead côté back */}
        {!leadId && view === 'devis' && (
          <div className="quote-loading-overlay" aria-live="polite">
            <div className="quote-loading-card">
              <div className="quote-loading-spinner"/>
              <div className="quote-loading-title">Préparation de votre devis…</div>
              <div className="quote-loading-sub">Génération de la référence personnalisée. Quelques secondes.</div>
            </div>
          </div>
        )}

        {view === 'devis' ? (
          <>
          <div className="quote-doc">
        <div className="quote-head">
          <div className="quote-head-row">
            <div className="quote-brand">
              <SanaliaLogo height={28}/>
              <div className="quote-brand-co">
                Sanalia · Dératisation en ligne<br/>
                12 rue des Innovateurs · 75011 Paris<br/>
                SIRET 891 234 567 00012 · TVA FR 98 891 234 567
              </div>
            </div>
            <div className="quote-meta">
              <div className="quote-meta-row"><span className="k">DEVIS</span><span className="v">{quoteRef}</span></div>
              <div className="quote-meta-row"><span className="k">DATE</span><span className="v">{new Date().toLocaleDateString('fr-FR')}</span></div>
              <div className="quote-meta-row"><span className="k">VALIDE 7 JOURS</span><span className="v">jusqu'au {new Date(Date.now()+7*86400000).toLocaleDateString('fr-FR')}</span></div>
            </div>
          </div>
          <h3 className="quote-title">
            Traitement {quote.nuisible.label.toLowerCase()} {state.audience === 'pro' ? '· Pro' : ''}
            {state.urgence && <small>{quote.urgence?.urgent ? 'Urgence 24h' : (quote.urgence?.label.replace(/^[^\s]+\s/, '') || '')}</small>}
          </h3>
        </div>

        <div className="quote-table">
          <div className="quote-table-head">
            <div>Désignation</div>
            <div className="ta-r">Qté</div>
            <div className="ta-r">PU HT</div>
            <div className="ta-r">Total HT</div>
          </div>
          <div className="quote-line">
            <div className="ldesc">
              Diagnostic + déplacement
              <small>Examen sur place, identification du foyer, plan de traitement</small>
            </div>
            <div className="lqty">1</div>
            <div className="lup">{fmtEur2(quote.diag)}</div>
            <div className="lt">{fmtEur2(quote.diag)}</div>
          </div>
          <div className="quote-line">
            <div className="ldesc">
              Intervention n°1 — traitement {quote.nuisible.label.toLowerCase()}
              <small>{dayLabel} · {slot ? slot.label : '—'} · produits Certibiocide, sans danger pour vos animaux</small>
            </div>
            <div className="lqty">1</div>
            <div className="lup">{fmtEur2(quote.intervention1)}</div>
            <div className="lt">{fmtEur2(quote.intervention1)}</div>
          </div>
          <div className="quote-line">
            <div className="ldesc">
              Intervention n°2 — contrôle &amp; finition
              <small>{day2Label} · {slot2 ? slot2.label : '—'} · vérification de l'efficacité, complément si nécessaire</small>
            </div>
            <div className="lqty">1</div>
            <div className="lup">{fmtEur2(quote.intervention2)}</div>
            <div className="lt">{fmtEur2(quote.intervention2)}</div>
          </div>
          <div className="quote-line">
            <div className="ldesc">
              Produits &amp; matériels
              <small>Biocides Certibiocide TP14/TP18 · pièges, postes d'appâtage sécurisés, gel anti-rampants · dosages adaptés au logement</small>
            </div>
            <div className="lqty">1</div>
            <div className="lup">{fmtEur2(quote.products)}</div>
            <div className="lt">{fmtEur2(quote.products)}</div>
          </div>
          <div className="quote-line discount">
            <div className="ldesc">
              <span>Remise — 1<sup>ère</sup> intervention offerte</span>
              <small>Offre de bienvenue Sanalia, valable sur le 1<sup>er</sup> passage</small>
            </div>
            <div className="lqty">1</div>
            <div className="lup">−{fmtEur2(quote.discount)}</div>
            <div className="lt">−{fmtEur2(quote.discount)}</div>
          </div>
        </div>

        <div className="quote-totals">
          <div className="quote-totals-row"><div className="k">Sous-total HT</div><div className="v">{fmtEur2(quote.subtotalBefore)}</div></div>
          <div className="quote-totals-row discount"><div className="k">Remise 1<sup>ère</sup> intervention</div><div className="v">−{fmtEur2(quote.discount)}</div></div>
          <div className="quote-totals-row"><div className="k">Total HT</div><div className="v">{hasCoords ? fmtEur2(quote.ht) : '— —'}</div></div>
          {!isPro && <div className="quote-totals-row"><div className="k">TVA 20%</div><div className="v">{hasCoords ? fmtEur2(quote.tva) : '— —'}</div></div>}
          <div className="quote-totals-row grand"><div className="k">{isPro ? 'Total HT' : 'Total TTC'}</div><div className="v">{hasCoords ? (isPro ? fmtEur2(quote.ht) : fmtEur2(quote.ttc)) : 'à partir de 149€'}</div></div>
        </div>

        <div className="quote-footer">
          <div className="quote-footer-perks">
            <span className="quote-footer-perk"><Ic.Check/> Annulation gratuite jusqu'à 48h avant</span>
            <span className="quote-footer-perk"><Ic.Check/> 1<sup>ère</sup> intervention offerte</span>
            <span className="quote-footer-perk"><Ic.Check/> Devis valable 7 jours</span>
          </div>
          <div className="quote-certs">
            <img src="../assets/certifications/20240119-Logo_Qualipro_Blue_Final_BG_Transparent.png" alt="Qualipro"/>
            <img src="../assets/certifications/certibiocide-dr.png" alt="Certibiocide"/>
          </div>
        </div>
          </div>
          </>
        ) : (
          /* VUE PAIEMENT : remplace le devis par le formulaire CB Stripe-style */
          <div className="stripe-card devis-stripe-card">
            <div className="stripe-card-head">
              <div className="stripe-card-title">
                <Ic.Card width={18} height={18}/> Paiement par carte
              </div>
              <div className="stripe-card-secured">
                <Ic.Lock width={12} height={12}/> Stripe · 3D Secure
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="dpay-email">Email pour le reçu</label>
              <div className="input-wrap">
                <Ic.Mail className="lead"/>
                <input id="dpay-email" type="email" className="input with-icon" placeholder="vous@email.com" value={payEmail} onChange={e=>setPayEmail(e.target.value)} autoComplete="email"/>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="dpay-card-num">Numéro de carte</label>
              <div className="input-wrap stripe-card-input">
                <Ic.Card className="lead"/>
                <input id="dpay-card-num" type="text" inputMode="numeric" className="input with-icon" placeholder="1234 1234 1234 1234" value={cardNum} onChange={e=>onCardNumChange(e.target.value)} autoComplete="cc-number" maxLength={19}/>
                <div className="stripe-card-brands" aria-hidden="true">
                  <span className="brand-tag visa">VISA</span>
                  <span className="brand-tag mc">MC</span>
                  <span className="brand-tag amex">AMEX</span>
                </div>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="dpay-card-exp">Expiration</label>
                <input id="dpay-card-exp" type="text" inputMode="numeric" className="input" placeholder="MM / AA" value={cardExp} onChange={e=>onCardExpChange(e.target.value)} autoComplete="cc-exp" maxLength={7}/>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="dpay-card-cvc">CVC</label>
                <input id="dpay-card-cvc" type="text" inputMode="numeric" className="input" placeholder="123" value={cardCvc} onChange={e=>setCardCvc(e.target.value.replace(/\D/g,'').slice(0,4))} autoComplete="cc-csc" maxLength={4}/>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="dpay-card-name">Titulaire de la carte</label>
              <input id="dpay-card-name" type="text" className="input" placeholder="Camille Durand" value={cardName} onChange={e=>setCardName(e.target.value)} autoComplete="cc-name"/>
            </div>

            {/* Code promo */}
            <div className="paiement-promo">
              {!promoOpen && !promoApplied ? (
                <button type="button" className="promo-toggle" onClick={() => setPromoOpen(true)}>
                  <Ic.Sparkles width={14} height={14}/>
                  <span>J'ai un code promo</span>
                </button>
              ) : (
                <div className="promo-form">
                  <label className="field-label" htmlFor="dpromo-input">Code promo</label>
                  <div className="promo-input-row">
                    <input id="dpromo-input" type="text" className="input" placeholder="BIENVENUE10" value={promoCode}
                      onChange={e=>{ setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                      autoCapitalize="characters" autoComplete="off"/>
                    <button type="button" className="btn-promo-apply" onClick={applyPromo} disabled={!promoCode.trim()}>Appliquer</button>
                  </div>
                  {promoApplied && (
                    <div className="promo-applied">
                      <Ic.Check width={14} height={14}/>
                      <span>Code <strong>{promoApplied.label}</strong> appliqué — économie de <strong>{fmtEur(promoDiscount)}</strong></span>
                      <button type="button" className="promo-remove" onClick={() => { setPromoApplied(null); setPromoCode(''); }}>×</button>
                    </div>
                  )}
                  {promoError && <div className="promo-error">{promoError}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sticky bottom bar — vue devis : [Partager · Télécharger] · [Valider le devis]
                                vue paiement : [← Retour] · [Payer X €]
            Les actions du devis sont désactivées tant que le leadId n'est pas reçu
            (sinon le PDF généré ne pourrait pas embarquer la référence lead). */}
        <div className="devis-validate-bar">
          {view === 'devis' ? (
            <>
              <div className="devis-bar-secondary">
                <button type="button" className="btn-validate-secondary" onClick={onShare} disabled={!leadId}>
                  <Ic.Send width={14} height={14}/> Partager
                </button>
                <button type="button" className="btn-validate-secondary" onClick={onDownload} disabled={!leadId}>
                  <Ic.Download width={14} height={14}/> Télécharger PDF
                </button>
              </div>
              <button type="button" className="btn-validate btn-validate-compact" onClick={handleValidate} disabled={!leadId}>
                Valider le devis
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-validate-secondary" onClick={() => setView('devis')}>
                <Ic.ArrowL width={14} height={14}/> Retour
              </button>
              <button type="button" className="btn-validate btn-validate-compact" onClick={handleStripePay} disabled={!canPay || processing}>
                {processing ? 'Sécurisation 3D Secure…' : `Payer l'acompte de ${fmtEur(finalAmount)}`}
              </button>
            </>
          )}
        </div>

        </div>

        <aside className="recap-2col-actions">
          <div className="pay-card">
            <div className="pay-card-eyebrow">Votre réservation</div>

            {/* Récap : nuisible · lieu */}
            <div className="pay-card-recap">
              <div className="pcr-line">
                <span className="pcr-icon-wrap"><Ic.Sparkles width={14} height={14}/></span>
                <strong>Traitement {quote.nuisible.label.toLowerCase()}</strong>
              </div>
              <div className="pcr-line">
                <span className="pcr-icon-wrap"><Ic.Pin width={14} height={14}/></span>
                <span>{quote.logements && quote.logements.length ? quote.logements.map(l => l.label).join(' + ') : (quote.logement?.label || '')} · {state.surface} m² · {state.adresse.city || '—'}</span>
              </div>

              {/* Dates 1 et 2 dans les ronds */}
              <div className="pcr-dates">
                <div className="pcr-date-row">
                  <span className="pcr-date-num">1</span>
                  <div className="pcr-date-info">
                    <strong>{dayLabel}</strong>
                    <small>{slot ? slot.label : '—'}</small>
                  </div>
                </div>
                <div className="pcr-date-row">
                  <span className="pcr-date-num">2</span>
                  <div className="pcr-date-info">
                    <strong>{day2Label}</strong>
                    <small>{slot2 ? slot2.label : '—'}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Étapes de paiement en 2 temps */}
            <div className="pay-card-steps">
              <div className="pcs-eyebrow">Paiement en 2 temps</div>
              <div className="pcs-step now">
                <div className="pcs-num">1</div>
                <div className="pcs-info">
                  <strong>Aujourd'hui</strong>
                  <small>Acompte de réservation</small>
                </div>
                <div className="pcs-amount">{fmtEur(DEPOSIT)}</div>
              </div>
              <div className="pcs-connector"/>
              <div className="pcs-step later">
                <div className="pcs-num">2</div>
                <div className="pcs-info">
                  <strong>Avant la 2ᵉ intervention</strong>
                  <small>Solde · prélevé automatiquement</small>
                </div>
                <div className="pcs-amount soft">{fmtEur(balance)}</div>
              </div>
            </div>

            {/* CTA Réserver retiré : la validation se fait via la sticky bar du devis */}

            <ul className="pay-card-trust-list">
              <li><Ic.Check width={13} height={13}/> Annulation gratuite jusqu'à 48 h avant</li>
              <li><Ic.Shield width={13} height={13}/> Paiement sécurisé Stripe · 3D Secure</li>
              <li><Ic.Sparkles width={13} height={13}/> 1<sup>ʳᵉ</sup> intervention offerte</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ----- Variant: Mission Brief (visual + actionable) -----
function StepRecapMission({ state, quote, hasCoords, quoteRef, onDownload, onShare, onReserve }) {
  const isPro = state.audience === 'pro';
  const adresseFull = [state.adresse.line, state.adresse.cp, state.adresse.city].filter(Boolean).join(' · ');
  const dayLabel = state.creneau.day ? new Date(state.creneau.day).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }) : '—';
  const day2Label = state.creneau.day2 ? new Date(state.creneau.day2).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }) : '—';
  const slot = SLOTS.find(s => s.id === state.creneau.slot);
  const slot2 = SLOTS.find(s => s.id === state.creneau.slot2);
  const validUntil = new Date(Date.now()+7*86400000).toLocaleDateString('fr-FR', { day:'numeric', month:'long' });

  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 8 · Votre mission</div>
      <h1 className="headline">Votre <em>plan d'action</em> est prêt</h1>
      <p className="subhead">Mission n° <strong style={{color:'var(--c-p900)',fontFamily:'var(--font-mono)'}}>{quoteRef}</strong> · valable jusqu'au {validUntil}.</p>

      {/* Hero ticket */}
      <div className="mission-ticket">
        <div className="mission-ticket-perf"></div>
        <div className="mission-ticket-left">
          <div className="mission-stamp">
            <div className="mission-stamp-icon">{quote.nuisible.emoji}</div>
            <div>
              <div className="mission-stamp-eyebrow">Cible</div>
              <div className="mission-stamp-name">{quote.nuisible.label}</div>
            </div>
          </div>
          <div className="mission-where">
            <div className="mission-where-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div className="mission-where-label">Lieu d'intervention</div>
              <div className="mission-where-text">
                {quote.logements && quote.logements.length ? quote.logements.map(l => l.label).join(' + ') : (quote.logement?.label || '')} · {state.surface} m²
                <br/>{adresseFull || 'Adresse à renseigner'}
              </div>
            </div>
          </div>
          <div className="mission-contact">
            <div className="mission-contact-avatar">
              {(state.coords.first?.[0] || '?')}{(state.coords.last?.[0] || '')}
            </div>
            <div>
              <div className="mission-contact-name">
                {state.coords.first || 'À renseigner'} {state.coords.last}
                {state.coords.company && <span className="mission-contact-co"> · {state.coords.company}</span>}
              </div>
              <div className="mission-contact-meta">{state.coords.email || '—'} · {state.coords.phone || '—'}</div>
            </div>
          </div>
        </div>
        <div className="mission-ticket-right">
          <div className="mission-price-tag">
            <div className="mission-price-label">{isPro ? 'Total HT' : 'Total à payer'}</div>
            <div className="mission-price-value">
              {hasCoords
                ? (isPro ? fmtEur2(quote.ht) : fmtEur2(quote.ttc))
                : <span style={{fontSize:22}}>à partir de 149€</span>}
            </div>
            {!isPro && hasCoords && <div className="mission-price-sub">TTC · TVA incluse</div>}
            <div className="mission-price-divider"></div>
            <div className="mission-price-savings">
              <div className="mission-price-saved">
                <span className="mission-price-strike">{fmtEur2(quote.subtotalBefore)}</span>
                <span className="mission-price-arrow">→</span>
              </div>
              <div className="mission-price-discount-pill">
                Économie {fmtEur2(quote.discount)}
              </div>
            </div>
            <div className="mission-price-note">
              <Ic.Check/> 1<sup>ère</sup> intervention offerte
            </div>
          </div>
        </div>
      </div>

      {/* Plan d'action — visual timeline */}
      <div className="mission-section-title">
        <span className="mission-section-num">01</span>
        <h2>Votre plan d'action</h2>
      </div>
      <div className="mission-timeline">
        <div className="mission-step">
          <div className="mission-step-rail">
            <div className="mission-step-bullet free">
              <Ic.Check width={16} height={16}/>
            </div>
            <div className="mission-step-line"></div>
          </div>
          <div className="mission-step-content">
            <div className="mission-step-head">
              <div>
                <div className="mission-step-when">{dayLabel}</div>
                <div className="mission-step-title">Intervention n°1 — Traitement {quote.nuisible.label.toLowerCase()}</div>
              </div>
              <div className="mission-step-tag free">OFFERTE</div>
            </div>
            <div className="mission-step-meta">
              <span className="mission-step-pill"><Ic.Clock width={12} height={12}/> {slot ? slot.label : '—'} · {slot?.meta}</span>
              <span className="mission-step-pill">Durée ~1h30</span>
              <span className="mission-step-pill">Produits Certibiocide</span>
            </div>
            <p className="mission-step-desc">Identification du foyer, application du traitement adapté à votre logement, conseils pour limiter la réinfestation. Sans danger pour vos animaux.</p>
          </div>
        </div>

        <div className="mission-step">
          <div className="mission-step-rail">
            <div className="mission-step-bullet">2</div>
          </div>
          <div className="mission-step-content">
            <div className="mission-step-head">
              <div>
                <div className="mission-step-when">{day2Label}</div>
                <div className="mission-step-title">Intervention n°2 — Contrôle &amp; finition</div>
              </div>
              <div className="mission-step-tag">{fmtEur2(quote.intervention2)} HT</div>
            </div>
            <div className="mission-step-meta">
              <span className="mission-step-pill"><Ic.Clock width={12} height={12}/> {slot2 ? slot2.label : '—'} · {slot2?.meta}</span>
              <span className="mission-step-pill">~15 jours après</span>
              <span className="mission-step-pill">Garantie efficacité</span>
            </div>
            <p className="mission-step-desc">Vérification de l'efficacité du traitement, complément si nécessaire. Si le foyer n'est pas neutralisé, nous repassons gratuitement.</p>
          </div>
        </div>
      </div>

      {/* Détail des prix — collapsed by default style */}
      <div className="mission-section-title">
        <span className="mission-section-num">02</span>
        <h2>Détail des prix</h2>
      </div>
      <div className="mission-pricing">
        <div className="mission-pricing-row">
          <div className="mission-pricing-name">
            <span>Diagnostic + déplacement</span>
            <small>Examen sur place, plan de traitement</small>
          </div>
          <div className="mission-pricing-amount">{fmtEur2(quote.diag)}</div>
        </div>
        <div className="mission-pricing-row">
          <div className="mission-pricing-name">
            <span>Intervention n°1 — traitement</span>
            <small>Produits Certibiocide, sans danger pour vos animaux</small>
          </div>
          <div className="mission-pricing-amount">{fmtEur2(quote.intervention1)}</div>
        </div>
        <div className="mission-pricing-row">
          <div className="mission-pricing-name">
            <span>Intervention n°2 — contrôle</span>
            <small>Vérification + complément si nécessaire</small>
          </div>
          <div className="mission-pricing-amount">{fmtEur2(quote.intervention2)}</div>
        </div>
        <div className="mission-pricing-row discount">
          <div className="mission-pricing-name">
            <span>Remise — 1<sup>ère</sup> intervention offerte</span>
            <small>Offre de bienvenue Sanalia</small>
          </div>
          <div className="mission-pricing-amount">−{fmtEur2(quote.discount)}</div>
        </div>
        <div className="mission-pricing-totals">
          <div className="mission-pricing-trow"><span>Total HT</span><span>{hasCoords ? fmtEur2(quote.ht) : '— —'}</span></div>
          {!isPro && <div className="mission-pricing-trow"><span>TVA 20%</span><span>{hasCoords ? fmtEur2(quote.tva) : '— —'}</span></div>}
          <div className="mission-pricing-trow grand">
            <span>{isPro ? 'Total HT' : 'Total TTC'}</span>
            <span>{hasCoords ? (isPro ? fmtEur2(quote.ht) : fmtEur2(quote.ttc)) : 'à partir de 149€'}</span>
          </div>
        </div>
      </div>

      {/* Garanties */}
      <div className="mission-guarantees">
        <div className="mission-g">
          <div className="mission-g-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div className="mission-g-title">Annulation gratuite</div>
            <div className="mission-g-desc">Jusqu'à 48h avant l'intervention</div>
          </div>
        </div>
        <div className="mission-g">
          <div className="mission-g-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="mission-g-title">Résultat garanti</div>
            <div className="mission-g-desc">2<sup>e</sup> passage gratuit si besoin</div>
          </div>
        </div>
        <div className="mission-g">
          <div className="mission-g-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div className="mission-g-title">Devis valable 7 jours</div>
            <div className="mission-g-desc">Jusqu'au {validUntil}</div>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="mission-certs">
        <div className="mission-certs-label">Certifications</div>
        <div className="mission-certs-logos">
          <img src="../assets/certifications/20240119-Logo_Qualipro_Blue_Final_BG_Transparent.png" alt="Qualipro"/>
          <img src="../assets/certifications/certibiocide-dr.png" alt="Certibiocide"/>
        </div>
      </div>

      <RecapActions
        quote={quote}
        isPro={isPro}
        hasCoords={hasCoords}
        onDownload={onDownload}
        onShare={onShare}
        onReserve={onReserve}
      />
      <div style={{textAlign:'center',marginTop:14}}>
        <span className="muted">Le PDF est aussi envoyé à <strong style={{color:'var(--c-p900)'}}>{state.coords.email || 'votre email'}</strong>.</span>
      </div>
    </div>
  );
}

// ===========================================================
// Step 10 — Paiement
// ===========================================================
const PAY_METHODS = [
  { id: 'card',   title: 'Carte bancaire', sub: 'Visa · Mastercard · CB',           pop: true  },
  { id: 'apple',  title: 'Apple Pay',      sub: 'Paiement en 1 clic',                pop: false },
  { id: 'gpay',   title: 'Google Pay',     sub: 'Paiement en 1 clic',                pop: false },
  { id: 'paypal', title: 'PayPal',         sub: 'Connexion à votre compte PayPal',   pop: false },
  { id: 'sepa',   title: 'Virement SEPA',  sub: 'Confirmation sous 24-48h ouvrées',  pop: false },
];

function PayMethodLogo({ id }) {
  if (id === 'card') return <div className="pay-method-logo" style={{background:'linear-gradient(135deg,#1A1F71,#5B47D5)',color:'#fff'}}>VISA</div>;
  if (id === 'apple') return <div className="pay-method-logo" style={{background:'#000',color:'#fff',fontSize:14}}> Pay</div>;
  if (id === 'gpay') return <div className="pay-method-logo" style={{background:'#fff',padding:'0 4px'}}><svg viewBox="0 0 80 24" width="56" height="18"><text x="2" y="18" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="700"><tspan fill="#5F6368">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC04">o</tspan><tspan fill="#34A853">g</tspan><tspan fill="#5F6368">le Pay</tspan></text></svg></div>;
  if (id === 'paypal') return <div className="pay-method-logo" style={{background:'#fff'}}><span style={{color:'#003087',fontWeight:900,fontSize:11}}>Pay</span><span style={{color:'#0070BA',fontWeight:900,fontSize:11}}>Pal</span></div>;
  if (id === 'sepa') return <div className="pay-method-logo" style={{background:'#fff',fontSize:9,color:'#0E052A'}}>SEPA</div>;
  return null;
}

// Mock catalogue de codes promo (remplacé par Stripe Coupons en prod)
const PROMO_CODES = {
  'BIENVENUE10': { label: 'BIENVENUE10', discount: 10, type: 'percent' },
  'AMI20':        { label: 'AMI20',        discount: 20, type: 'percent' },
  'STARTER5':     { label: 'STARTER5',     discount: 5,  type: 'fixed' },
};

function StepPaiement({ state, quote, hasCoords, quoteRef, layout, onPay, onBack }) {
  const isPro = state.audience === 'pro';
  const [email, setEmail]     = useState(state.coords?.email || '');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(`${state.coords?.first || ''} ${state.coords?.last || ''}`.trim());
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState(null); // { label, discount, type }
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);

  const dayLabel = state.creneau.day ? new Date(state.creneau.day).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }) : '—';
  const slot = SLOTS.find(s => s.id === state.creneau.slot);

  const DEPOSIT = 49;
  const total = isPro ? quote.ht : quote.ttc;
  const balance = Math.max(0, total - DEPOSIT);
  const promoDiscount = promo
    ? (promo.type === 'percent' ? Math.round(DEPOSIT * promo.discount / 100) : Math.min(promo.discount, DEPOSIT))
    : 0;
  const finalAmount = Math.max(0, DEPOSIT - promoDiscount);

  function applyPromo() {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    const found = PROMO_CODES[code];
    if (found) {
      setPromo(found);
      setPromoError('');
    } else {
      setPromo(null);
      setPromoError('Code promo invalide ou expiré.');
    }
  }

  function handlePay() {
    setProcessing(true);
    setTimeout(() => { onPay('card'); setProcessing(false); }, 1300);
  }

  // Auto-format card number "1234 1234 1234 1234"
  function onCardNumChange(v) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNum(formatted);
  }
  // Auto-format expiry "MM / AA"
  function onCardExpChange(v) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setCardExp(digits.length > 2 ? `${digits.slice(0,2)} / ${digits.slice(2)}` : digits);
  }

  const canPay = email && cardNum.replace(/\s/g,'').length >= 13 && cardExp.length >= 4 && cardCvc.length >= 3;

  return (
    <div className="paiement-simple">
      <button type="button" className="paiement-back-link" onClick={onBack}>
        <Ic.ArrowL width={14} height={14}/> Retour au devis
      </button>

      <div className="paiement-simple-head">
        <div className="eyebrow"><span className="dot"></span>Étape 9 · Paiement</div>
        <h1 className="headline">Réglez votre <em>acompte</em></h1>
        <p className="subhead">Vous bloquez votre créneau du <strong style={{color:'var(--c-p900)'}}>{dayLabel}</strong> avec un acompte de <strong style={{color:'var(--c-p900)'}}>{fmtEur(DEPOSIT)}</strong>. Le solde de <strong style={{color:'var(--c-p900)'}}>{fmtEur(balance)}</strong> est prélevé automatiquement avant la 2ᵉ intervention.</p>
      </div>

      {/* Carte de paiement Stripe-style */}
      <div className="stripe-card">
        <div className="stripe-card-head">
          <div className="stripe-card-title">
            <Ic.Card width={18} height={18}/> Paiement par carte
          </div>
          <div className="stripe-card-secured">
            <Ic.Lock width={12} height={12}/> Stripe · 3D Secure
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pay-email">Email pour le reçu</label>
          <div className="input-wrap">
            <Ic.Mail className="lead"/>
            <input id="pay-email" type="email" className="input with-icon" placeholder="vous@email.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pay-card-num">Numéro de carte</label>
          <div className="input-wrap stripe-card-input">
            <Ic.Card className="lead"/>
            <input id="pay-card-num" type="text" inputMode="numeric" className="input with-icon" placeholder="1234 1234 1234 1234" value={cardNum} onChange={e=>onCardNumChange(e.target.value)} autoComplete="cc-number" maxLength={19}/>
            <div className="stripe-card-brands" aria-hidden="true">
              <span className="brand-tag visa">VISA</span>
              <span className="brand-tag mc">MC</span>
              <span className="brand-tag amex">AMEX</span>
            </div>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="pay-card-exp">Expiration</label>
            <input id="pay-card-exp" type="text" inputMode="numeric" className="input" placeholder="MM / AA" value={cardExp} onChange={e=>onCardExpChange(e.target.value)} autoComplete="cc-exp" maxLength={7}/>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="pay-card-cvc">CVC</label>
            <input id="pay-card-cvc" type="text" inputMode="numeric" className="input" placeholder="123" value={cardCvc} onChange={e=>setCardCvc(e.target.value.replace(/\D/g,'').slice(0,4))} autoComplete="cc-csc" maxLength={4}/>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pay-card-name">Titulaire de la carte</label>
          <input id="pay-card-name" type="text" className="input" placeholder="Camille Durand" value={cardName} onChange={e=>setCardName(e.target.value)} autoComplete="cc-name"/>
        </div>
      </div>

      {/* Code promo */}
      <div className="paiement-promo">
        {!promoOpen && !promo ? (
          <button type="button" className="promo-toggle" onClick={() => setPromoOpen(true)}>
            <Ic.Sparkles width={14} height={14}/>
            <span>J'ai un code promo</span>
          </button>
        ) : (
          <div className="promo-form">
            <label className="field-label" htmlFor="promo-input">Code promo</label>
            <div className="promo-input-row">
              <input
                id="promo-input"
                type="text"
                className="input"
                placeholder="BIENVENUE10"
                value={promoCode}
                onChange={e=>{ setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                autoCapitalize="characters"
                autoComplete="off"
              />
              <button type="button" className="btn-promo-apply" onClick={applyPromo} disabled={!promoCode.trim()}>
                Appliquer
              </button>
            </div>
            {promo && (
              <div className="promo-applied">
                <Ic.Check width={14} height={14}/>
                <span>Code <strong>{promo.label}</strong> appliqué — économie de <strong>{fmtEur(promoDiscount)}</strong></span>
                <button type="button" className="promo-remove" onClick={() => { setPromo(null); setPromoCode(''); }}>×</button>
              </div>
            )}
            {promoError && <div className="promo-error">{promoError}</div>}
          </div>
        )}
      </div>

      {/* Récap montants */}
      <div className="paiement-total">
        <div className="paiement-total-row">
          <span>Acompte de réservation</span>
          <span>{fmtEur(DEPOSIT)}</span>
        </div>
        {promo && (
          <div className="paiement-total-row promo">
            <span>Réduction · {promo.label}</span>
            <span>−{fmtEur(promoDiscount)}</span>
          </div>
        )}
        <div className="paiement-total-row total">
          <span>Total à payer aujourd'hui</span>
          <span>{fmtEur(finalAmount)}</span>
        </div>
        <div className="paiement-total-note">
          Solde de <strong>{fmtEur(balance)}</strong> prélevé avant la 2ᵉ intervention.
        </div>
      </div>

      {/* CTA */}
      <button type="button" className="btn-pay-stripe" onClick={handlePay} disabled={!canPay || processing}>
        {processing ? (
          <>
            <span className="spinner" style={{display:'inline-block',width:18,height:18,border:'2.5px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}></span>
            <span>Sécurisation 3D Secure…</span>
          </>
        ) : (
          <>
            <Ic.Lock width={18} height={18}/>
            <span>Payer {fmtEur(finalAmount)} · Réserver le créneau</span>
          </>
        )}
      </button>

      <p className="paiement-trust-note">
        <Ic.Shield width={13} height={13}/>
        Paiement traité par Stripe · Aucune donnée carte stockée chez Sanalia · Annulation gratuite jusqu'à 48 h avant.
      </p>
    </div>
  );
}

// ===========================================================
// Step 11 — Confirmation
// ===========================================================
function StepSuccess({ state, quote, quoteRef, payMethod, onRestart }) {
  const dayLabel = state.creneau.day ? new Date(state.creneau.day).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }) : '—';
  const slot = SLOTS.find(s => s.id === state.creneau.slot);
  const methodLabel = PAY_METHODS.find(p => p.id === payMethod)?.title || 'Carte bancaire';

  return (
    <div className="success-card">
      <div className="success-icon"><Ic.Check/></div>
      <h2>Votre intervention est <span style={{color:'var(--c-success-d)'}}>confirmée</span></h2>
      <p>Merci {state.coords.first || ''} ! Le technicien certifié <strong>Certibiocide</strong> sera chez vous le<br/>
      <strong style={{color:'var(--c-p900)'}}>{dayLabel} · {slot?.label || ''}</strong>.</p>

      <span className="booking-id">Réservation · {quoteRef}</span>

      <div className="success-next">
        <div className="success-next-item">
          <div className="num">1</div>
          <div>Un email de confirmation et la <strong>facture</strong> ont été envoyés à <strong>{state.coords.email || 'votre adresse'}</strong>.</div>
        </div>
        <div className="success-next-item">
          <div className="num">2</div>
          <div>Le technicien vous appelle <strong>30 min avant</strong> son arrivée au {state.coords.phone || 'numéro fourni'}.</div>
        </div>
        <div className="success-next-item">
          <div className="num">3</div>
          <div>Préparez l'accès : libérez les zones autour des points d'infestation et éloignez animaux/enfants.</div>
        </div>
      </div>

      <div className="success-cta-row">
        <button className="btn btn-secondary" onClick={onRestart}><Ic.ArrowL width={16} height={16}/> Nouveau devis</button>
        <button className="btn btn-primary"><Ic.Download width={16} height={16}/> Télécharger la facture</button>
      </div>

      <div style={{marginTop:24,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--c-mut-2)',letterSpacing:'.04em'}}>
        Réglé par {methodLabel.toUpperCase()} · {fmtEur2(quote.ttc)} · TVA incluse
      </div>
    </div>
  );
}

Object.assign(window, {
  StepCreneau, StepCoords, StepRecap, StepPaiement, StepSuccess,
  RecapActions, SendQuoteModal,
  PAY_METHODS,
});

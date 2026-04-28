/* =========================================================
   Sanalia — Step components (Q&A part)
   ========================================================= */

const { useState, useEffect, useRef, useMemo } = React;

// ---- Small icon helpers (inline SVGs only where needed; rest are emoji from data) ----
const Ic = {
  Lock:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Check:   p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  ArrowR:  p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ArrowL:  p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Pin:     p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Mail:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 6 12 13 22 6"/></svg>,
  Phone:   p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  User:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Card:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  Download: p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Clock:   p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield:  p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Star:    p => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Sparkles:p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>,
  Send:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Copy:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  X:       p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Link:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Edit:    p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
};

// ===========================================================
// Step 1 — Quel nuisible ?
// ===========================================================
function StepNuisible({ value, audience, onAudience, onChange, onAdvance }) {
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:14,flexWrap:'wrap'}}>
        <div className="eyebrow"><span className="dot"></span>Étape 1 · Le nuisible</div>
        <div className="audience-toggle">
          <button className={audience==='particulier'?'active':''} onClick={()=>onAudience('particulier')}>Particulier</button>
          <button className={audience==='pro'?'active':''} onClick={()=>onAudience('pro')}>Professionnel</button>
        </div>
      </div>
      <h1 className="headline">De quel nuisible souhaitez-vous <em>vous débarrasser</em> ?</h1>
      <p className="subhead">Choisissez ce que vous avez identifié. Si vous hésitez, prenez celui qui ressemble le plus — notre technicien confirmera sur place.</p>
      <div className="nuisible-grid">
        {NUISIBLES.map(n => (
          <button
            key={n.id}
            type="button"
            className={'nuisible-card' + (value === n.id ? ' selected' : '')}
            style={{'--glow': n.glow}}
            onClick={() => { onChange(n.id); setTimeout(onAdvance, 350); }}
          >
            <div className="nuisible-img" style={{background: n.bg}}>
              <img src={n.img} alt={n.label} />
            </div>
            <div className="nuisible-name">{n.label}</div>
            <div className="nuisible-hint">{n.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================================
// Step 2 — Urgence
// ===========================================================
function StepUrgence({ value, onChange }) {
  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 2 · Urgence</div>
      <h1 className="headline">À quelle vitesse devons-nous <em>intervenir</em> ?</h1>
      <p className="subhead">Plus c'est rapide, plus c'est cher : nos meilleurs créneaux 24h partent vite. Choisissez en fonction de votre besoin réel.</p>
      <div className="urgency">
        <span className="urgency-pulse"></span>
        <span><strong>3 interventions sous 24h</strong> déjà réservées aujourd'hui dans votre zone — il reste 2 créneaux.</span>
      </div>
      <div className="choice-grid">
        {URGENCES.map(u => (
          <button
            key={u.id}
            type="button"
            className={'choice-card' + (u.urgent ? ' urgent' : '') + (value === u.id ? ' selected' : '')}
            onClick={() => onChange(u.id)}
          >
            <div className="choice-text">
              <div className="choice-title">{u.label}</div>
              <div className="choice-desc">{u.desc}</div>
              <div className="choice-meta">{u.meta}</div>
            </div>
            <div className="choice-check"></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================================
// Step 3 — Type de logement
// ===========================================================
function StepLogement({ value, onChange }) {
  // value is an array of logement ids; first item is primary
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  function toggle(id) {
    if (selected.includes(id)) {
      // can't unselect last one — must always have at least one location
      if (selected.length === 1) return;
      onChange(selected.filter(x => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }
  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 2 · Lieu d'intervention</div>
      <h1 className="headline">Quel type de <em>local</em> à traiter ?</h1>
      <p className="subhead">Vous pouvez sélectionner <strong>plusieurs lieux</strong> si l'infestation s'étend (ex: appartement + cave). Le technicien adapte le traitement à l'ensemble.</p>
      <div className="choice-grid">
        {LOGEMENTS.map(l => {
          const isSel = selected.includes(l.id);
          return (
            <button
              key={l.id} type="button"
              className={'choice-card' + (isSel ? ' selected' : '')}
              onClick={() => toggle(l.id)}
              style={{position:'relative'}}
            >
              <div className="choice-emoji">{l.emoji}</div>
              <div className="choice-text">
                <div className="choice-title">{l.label}</div>
                <div className="choice-desc">{l.desc}</div>
              </div>
              <div className="choice-check"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================
// Step 4 — Surface
// ===========================================================
function StepSurface({ surface, onSurface }) {
  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 3 · Surface</div>
      <h1 className="headline">Quelle <em>surface</em> à traiter ?</h1>
      <p className="subhead">Estimation suffisante — pas besoin d'être au m² près. Cela nous permet de doser le traitement.</p>

      <div className="field">
        <label className="field-label">Surface totale</label>
        <div className="counter">
          <div className="counter-label">
            Surface <small>en mètres carrés (m²)</small>
          </div>
          <div className="counter-ctrl">
            <button className="counter-btn" onClick={()=>onSurface(Math.max(10, surface-10))} disabled={surface<=10}>−</button>
            <div className="counter-value">{surface} m²</div>
            <button className="counter-btn" onClick={()=>onSurface(Math.min(500, surface+10))}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// Step 5 — Statut
// ===========================================================
function StepStatut({ value, logement, onChange }) {
  // logement is an array; use the first (primary) for the headline phrase
  const primaryId = Array.isArray(logement) ? logement[0] : logement;
  // Build a grammatically-correct phrase per logement type — "dans cet appartement", "dans cette maison", etc.
  const phrase = ({
    appart: <>cet <em>appartement</em></>,
    maison: <>cette <em>maison</em></>,
    pro:    <>ce <em>local pro</em></>,
    cave:   <>cette <em>cave</em></>,
    jardin: <>cet <em>extérieur</em></>,
    autre:  <>ce <em>logement</em></>,
  })[primaryId] || <>ce <em>logement</em></>;
  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 4 · Votre statut</div>
      <h1 className="headline">Dans {phrase} vous êtes ?</h1>
      <p className="subhead">Selon votre statut, vos obligations diffèrent. Rassurez-vous : nous gérons tout.</p>
      <div className="choice-grid">
        {STATUTS.map(s => (
          <button
            key={s.id} type="button"
            className={'choice-card' + (value === s.id ? ' selected' : '')}
            onClick={() => onChange(s.id)}
          >
            <div className="choice-emoji">{s.emoji}</div>
            <div className="choice-text">
              <div className="choice-title">{s.label}</div>
              <div className="choice-desc">{s.desc}</div>
            </div>
            <div className="choice-check"></div>
          </button>
        ))}
      </div>
      {value === 'locataire' && (
        <div className="urgency" style={{marginTop:14}}>
          <span className="urgency-pulse" style={{background:'var(--c-p600)',boxShadow:'0 0 0 5px rgba(99,93,221,.18)'}}></span>
          <span>Bon à savoir : <strong>en cas d'infestation préexistante,</strong> le coût peut être à la charge du propriétaire. Nous vous fournissons une attestation si besoin.</span>
        </div>
      )}
    </div>
  );
}

// ===========================================================
// Step 6 — Adresse (autocomplete via API BAN officielle française)
//   https://api-adresse.data.gouv.fr/search/?q=...&limit=5
// ===========================================================
function StepAdresse({ adresse, onChange }) {
  const [q, setQ]         = useState(adresse.line || '');
  const [open, setOpen]   = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef       = useRef(null);
  const abortRef          = useRef(null);

  // Recherche débounced sur l'API BAN
  useEffect(() => {
    if (!q || q.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q.trim())}&limit=6&autocomplete=1`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        const features = (data.features || []).map(f => ({
          label: f.properties.label,
          name: f.properties.name,
          housenumber: f.properties.housenumber,
          street: f.properties.street,
          postcode: f.properties.postcode,
          city: f.properties.city,
          context: f.properties.context,
          type: f.properties.type,
        }));
        setResults(features);
      } catch (e) {
        if (e.name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  function pick(a) {
    // L'API renvoie name = "12 rue de Rivoli" (avec numéro si type=housenumber, sinon juste la rue)
    const line = a.name || a.label.split(',')[0].trim();
    onChange({ ...adresse, line, cp: a.postcode || '', city: a.city || '' });
    setQ(line);
    setOpen(false);
    setResults([]);
  }

  return (
    <div>
      <div className="eyebrow"><span className="dot"></span>Étape 5 · Adresse</div>
      <h1 className="headline"><em>Adresse</em> de l'intervention</h1>

      <div className="field" style={{marginTop:18, marginBottom:14, position:'relative'}}>
        <label className="field-label" htmlFor="addr-input">Adresse <span className="req">*</span></label>
        <div className="input-wrap">
          <Ic.Pin className="lead"/>
          <input
            id="addr-input"
            className="input with-icon"
            placeholder="Tapez votre adresse…"
            value={q}
            onChange={e => { setQ(e.target.value); setOpen(true); onChange({ ...adresse, line: e.target.value }); }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {loading && (
            <span className="addr-spinner" aria-hidden="true">
              <span className="addr-spinner-dot"/>
            </span>
          )}
          {open && q.trim().length >= 3 && (results.length > 0 || (!loading && results.length === 0)) && (
            <div className="addr-suggest">
              {results.length > 0 ? results.map((a, i) => (
                <div key={i} className="addr-suggest-item" onMouseDown={e => { e.preventDefault(); pick(a); }}>
                  <div className="addr-suggest-pin"><Ic.Pin width={14} height={14}/></div>
                  <div>
                    <div className="addr-suggest-main">{a.name}</div>
                    <div className="addr-suggest-sub">{a.postcode} · {a.city}</div>
                  </div>
                </div>
              )) : (
                <div className="addr-suggest-empty">Aucune adresse trouvée — vous pouvez la saisir manuellement.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Code postal <span className="req">*</span></label>
          <input className="input" placeholder="75001" value={adresse.cp || ''} onChange={e => onChange({ ...adresse, cp: e.target.value })} autoComplete="postal-code"/>
        </div>
        <div className="field">
          <label className="field-label">Ville <span className="req">*</span></label>
          <input className="input" placeholder="Paris" value={adresse.city || ''} onChange={e => onChange({ ...adresse, city: e.target.value })} autoComplete="address-level2"/>
        </div>
      </div>
      <div className="spacer"></div>
      <div className="field">
        <label className="field-label">Complément <span className="opt">facultatif</span></label>
        <input className="input" placeholder="Bâtiment B, 3ème étage, code 1234A…" value={adresse.extra || ''} onChange={e => onChange({ ...adresse, extra: e.target.value })}/>
      </div>
    </div>
  );
}

Object.assign(window, {
  Ic, StepNuisible, StepUrgence, StepLogement, StepSurface, StepStatut, StepAdresse,
});

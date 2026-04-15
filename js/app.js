/* ============================================
   SANALIA — Main App JS
   Component loader, mobile menu, toggle, accordion, form prefill
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initAccordions();
  initFormPrefill();
  initToggle();
  initProcessTabs();
});

/* ── Mobile Menu ── */
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.header-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
}

/* ── Accordions (event delegation — works regardless of page-level init order or errors) ──
   Uses delegation on document so it survives any DOMContentLoaded handler that throws
   before reaching initAccordions(). Also stops other handlers (e.g. duplicate page-level
   initAccordions) from racing the toggle and immediately closing the item. */
function initAccordions() {
  if (window.__accordionDelegationAttached) return;
  window.__accordionDelegationAttached = true;
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion-header');
    if (!header) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    const item = header.closest('.accordion-item');
    if (!item) return;
    const list = item.parentElement;
    const wasOpen = item.classList.contains('open');
    // Close siblings within the same accordion list (exclusive open)
    if (list) list.querySelectorAll(':scope > .accordion-item.open').forEach(i => {
      if (i !== item) {
        i.classList.remove('open');
        const t = i.querySelector('.icon-toggle');
        if (t) t.textContent = '+';
      }
    });
    if (wasOpen) {
      item.classList.remove('open');
    } else {
      item.classList.add('open');
    }
    const toggle = header.querySelector('.icon-toggle');
    if (toggle) toggle.textContent = item.classList.contains('open') ? '−' : '+';
  }, true); // capture phase — runs before any handler that page-level scripts attached on the button
}
// Attach immediately — independent of any other DOMContentLoaded handler that may throw
initAccordions();

/* ── Form Prefill from URL params ── */
function initFormPrefill() {
  const params = new URLSearchParams(window.location.search);
  const nuisible = params.get('nuisible');
  const ville = params.get('ville');
  const type = params.get('type'); // particulier or pro

  if (nuisible) {
    const el = document.querySelector('[name="nuisible"]');
    if (el) el.value = nuisible;
  }
  if (ville) {
    const el = document.querySelector('[name="ville"]');
    if (el) el.value = ville;
  }
  if (type === 'pro') {
    document.querySelectorAll('.devis-pro-only').forEach(el => el.style.display = 'block');
    const title = document.querySelector('.devis-title');
    if (title) title.textContent = 'Demandez votre devis professionnel';
  }
}

/* ── Toggle Particulier / Pro (tabs style) ── */
function initToggle() {
  const tabs = document.querySelectorAll('.toggle-tab');
  if (!tabs.length) return;

  const currentPath = window.location.pathname;
  const isPro = currentPath.startsWith('/professionnel') || currentPath.includes('/pro/');

  tabs.forEach(tab => {
    tab.classList.remove('active');
    if ((tab.dataset.mode === 'pro' && isPro) || (tab.dataset.mode === 'particulier' && !isPro)) {
      tab.classList.add('active');
    }
    tab.addEventListener('click', () => {
      if (tab.dataset.mode === 'pro' && !isPro) {
        window.location.href = '/professionnel' + currentPath;
      } else if (tab.dataset.mode === 'particulier' && isPro) {
        const equivPath = currentPath.replace('/professionnel/', '/').replace('/pro/', '/');
        window.location.href = equivPath === currentPath ? '/' : equivPath;
      }
    });
  });
}

/* ── Process Tabs (auto-rotate) ── */
function initProcessTabs() {
  const tabs = document.querySelectorAll('.process-tab');
  const panels = document.querySelectorAll('.process-panel');
  const dots = document.querySelectorAll('.process-dot');
  if (!tabs.length) return;

  let current = 0;
  let interval;

  function activate(index) {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    tabs[index].classList.add('active');
    panels[index].classList.add('active');
    dots[index].classList.add('active');
    current = index;
  }

  function startAutoRotate() {
    interval = setInterval(() => {
      activate((current + 1) % tabs.length);
    }, 5000);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      clearInterval(interval);
      activate(parseInt(tab.dataset.tab));
      startAutoRotate();
    });
  });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(interval);
      activate(parseInt(dot.dataset.dot));
      startAutoRotate();
    });
  });

  startAutoRotate();
}


/* ── Helper: get base path depth for relative URLs ── */
function getBasePath() {
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  return depth === 0 ? './' : '../'.repeat(depth);
}

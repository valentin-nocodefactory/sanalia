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
  initStickyCtaScrollAware();
});

/* ── Mobile sticky CTA : show on scroll up, hide on scroll down ──
   - Always visible near top of page (< 120px)
   - Hides when user scrolls down (reading mode)
   - Reappears immediately on scroll up (intent to act) */
function initStickyCtaScrollAware() {
  const bar = document.querySelector('.mobile-sticky-cta-v2');
  if (!bar) return;

  let lastY = window.scrollY || 0;
  let ticking = false;
  const DELTA = 6;           // minimum scroll distance to trigger change
  const TOP_THRESHOLD = 120; // always show near top
  const DOWN_THRESHOLD = 160; // require some scroll before hiding

  function update() {
    const y = window.scrollY || 0;
    const diff = y - lastY;

    // Near top : always visible
    if (y < TOP_THRESHOLD) {
      bar.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
      return;
    }

    if (Math.abs(diff) < DELTA) { ticking = false; return; }

    if (diff > 0 && y > DOWN_THRESHOLD) {
      // scrolling down → hide
      bar.classList.add('is-hidden');
    } else if (diff < 0) {
      // scrolling up → show
      bar.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

/* ── Mobile Menu (premium full-screen slide-in) ── */
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.header-nav');
  if (!btn || !nav) return;

  // Inject sticky CTA at the bottom of the mobile menu (once)
  if (!nav.querySelector('.mobile-menu-cta')) {
    const cta = document.createElement('div');
    cta.className = 'mobile-menu-cta';
    cta.innerHTML =
      '<a href="/devis/" class="btn btn-primary">Demander mon devis' +
      '<span class="btn-arrow"></span></a>' +
      '<a href="tel:0667464897" class="btn btn-outline">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
      '06&nbsp;67&nbsp;46&nbsp;48&nbsp;97</a>';
    nav.appendChild(cta);
  }

  function closeMenu() {
    nav.classList.remove('open');
    document.body.classList.remove('mobile-menu-open');
    btn.setAttribute('aria-expanded', 'false');
    // Reset all open submenus
    nav.querySelectorAll('.nav-item.is-open').forEach(i => i.classList.remove('is-open'));
  }

  function openMenu() {
    nav.classList.add('open');
    document.body.classList.add('mobile-menu-open');
    btn.setAttribute('aria-expanded', 'true');
  }

  btn.addEventListener('click', () => {
    if (nav.classList.contains('open')) closeMenu();
    else openMenu();
  });

  // Mobile: handle clicks inside nav — toggle top-level, close on leaf
  nav.addEventListener('click', (e) => {
    if (window.innerWidth > 1024) return;
    const link = e.target.closest('a');
    if (!link) return;

    // Case 1 : top-level link inside .nav-item > a (direct child) with a mega-menu
    // → intercept and toggle submenu instead of navigating
    const navItem = link.closest('.nav-item');
    if (navItem && link.parentElement === navItem && navItem.querySelector('.mega-menu')) {
      e.preventDefault();
      e.stopPropagation();
      // Exclusive open: close siblings
      nav.querySelectorAll('.nav-item.is-open').forEach(i => {
        if (i !== navItem) i.classList.remove('is-open');
      });
      navItem.classList.toggle('is-open');
      return;
    }

    // Case 2 : any other link (leaf link inside submenu, CTA at bottom)
    // → let it navigate, but close the menu for next time
    closeMenu();
  }, true); // capture to run before default navigation

  // Close menu on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu();
  });

  // Close menu on window resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && nav.classList.contains('open')) closeMenu();
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

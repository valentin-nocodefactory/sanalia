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

/* ── Mobile sticky CTA : hidden at top, appears once user has scrolled ──
   - Hidden by default (top of page = hero, CTAs already visible there)
   - Appears once user has scrolled past SHOW_THRESHOLD
   - While scrolled: hide on scroll down (reading mode), show on scroll up (intent to act) */
function initStickyCtaScrollAware() {
  const bar = document.querySelector('.mobile-sticky-cta-v3');
  if (!bar) return;

  // Start hidden : the bar only shows after the user has scrolled
  bar.classList.add('is-hidden');

  let lastY = window.scrollY || 0;
  let ticking = false;
  const DELTA = 6;             // minimum scroll distance to trigger change
  const SHOW_THRESHOLD = 240;  // only reveal after this much scroll

  function update() {
    const y = window.scrollY || 0;
    const diff = y - lastY;

    // Near top : always hidden (hero already has CTAs)
    if (y < SHOW_THRESHOLD) {
      bar.classList.add('is-hidden');
      lastY = y;
      ticking = false;
      return;
    }

    if (Math.abs(diff) < DELTA) { ticking = false; return; }

    if (diff > 0) {
      // scrolling down → hide
      bar.classList.add('is-hidden');
    } else {
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

/* ── Mobile Menu (right-slide drawer with accordion) ──
   Uses document-level event delegation so the burger works even if the header
   is replaced/re-rendered after DOMContentLoaded (runtime robustness). */
function initMobileMenu() {
  if (window.__mobileMenuInit) return;
  window.__mobileMenuInit = true;

  function getNav()  { return document.querySelector('.header-nav'); }
  function getBtn()  { return document.querySelector('.mobile-menu-btn'); }

  function ensureDrawerChrome() {
    const nav = getNav();
    if (!nav) return;

    // Inject drawer header (title + close button) at the top of the nav
    if (!nav.querySelector('.mnav-head')) {
      const head = document.createElement('div');
      head.className = 'mnav-head';
      head.innerHTML =
        '<span class="mnav-head-title">Menu</span>' +
        '<button type="button" class="mnav-close" aria-label="Fermer le menu">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>';
      nav.insertBefore(head, nav.firstChild);
    }

    // Inject sticky CTA bar at the bottom of the nav
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
  }

  function closeMenu() {
    const nav = getNav(), btn = getBtn();
    if (!nav) return;
    nav.classList.remove('open');
    document.body.classList.remove('mobile-menu-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    // Reset accordion state so next open starts clean
    nav.querySelectorAll('.nav-item.is-open').forEach(i => i.classList.remove('is-open'));
  }

  function openMenu() {
    const nav = getNav(), btn = getBtn();
    if (!nav) return;
    ensureDrawerChrome();
    nav.classList.add('open');
    document.body.classList.add('mobile-menu-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  ensureDrawerChrome();

  // Delegation : single document-level click handler
  document.addEventListener('click', (e) => {
    // 1) Burger toggle
    if (e.target.closest('.mobile-menu-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const nav = getNav();
      if (!nav) return;
      if (nav.classList.contains('open')) closeMenu();
      else openMenu();
      return;
    }

    // 2) Close button inside drawer
    if (e.target.closest('.mnav-close')) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      return;
    }

    // 3) Backdrop click (anywhere outside the drawer when open)
    const nav = getNav();
    if (nav && nav.classList.contains('open') && window.innerWidth <= 1024) {
      if (!nav.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
        closeMenu();
        return;
      }
    }

    // 4) Clicks inside the open mobile nav
    if (window.innerWidth > 1024) return;
    if (!nav || !nav.classList.contains('open')) return;
    if (!nav.contains(e.target)) return;

    const link = e.target.closest('a');
    if (!link) return;

    const navItem = link.closest('.nav-item');
    // Top-level accordion trigger → toggle submenu (don't navigate)
    if (navItem && link.parentElement === navItem && navItem.querySelector('.mega-menu')) {
      e.preventDefault();
      e.stopPropagation();
      // Close other open items (single-open accordion)
      nav.querySelectorAll('.nav-item.is-open').forEach(i => {
        if (i !== navItem) i.classList.remove('is-open');
      });
      navItem.classList.toggle('is-open');
      // Scroll the opened item into view
      if (navItem.classList.contains('is-open')) {
        setTimeout(() => {
          navItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
      }
      return;
    }

    // Leaf link (or CTA) → navigate, close menu for next time
    closeMenu();
  }, true);

  // Close menu on ESC
  document.addEventListener('keydown', (e) => {
    const nav = getNav();
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) closeMenu();
  });

  // Close menu on resize to desktop
  window.addEventListener('resize', () => {
    const nav = getNav();
    if (window.innerWidth > 1024 && nav && nav.classList.contains('open')) closeMenu();
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

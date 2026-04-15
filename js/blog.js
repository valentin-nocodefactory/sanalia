/* ============================================================
   Sanalia — Blog interactions
   Module IIFE sans framework.
   Gère : TOC, reading progress, share bar, floating CTA,
   FAQ accordion, newsletter, tracking dataLayer.
   ============================================================ */
(function () {
  'use strict';

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  function push(event, data) {
    window.dataLayer = window.dataLayer || [];
    var payload = Object.assign({ event: event }, data || {});
    window.dataLayer.push(payload);
  }

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);
  }

  function throttle(fn, wait) {
    var last = 0, timer;
    return function () {
      var now = Date.now(), ctx = this, args = arguments;
      var remaining = wait - (now - last);
      if (remaining <= 0) {
        clearTimeout(timer); timer = null;
        last = now;
        fn.apply(ctx, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          last = Date.now(); timer = null;
          fn.apply(ctx, args);
        }, remaining);
      }
    };
  }

  // ------------------------------------------------------------
  // 1. Table of Contents : génération auto + highlight scroll
  // ------------------------------------------------------------
  function initTOC() {
    var toc = $('.toc-sticky') || $('.blog-toc');
    var article = $('.blog-body') || $('.blog-content') || $('.blog-article-content') || $('.blog-prose') || $('[data-article]');
    if (!toc || !article) return;

    var headings = $$('h2, h3', article);
    if (!headings.length) { toc.style.display = 'none'; return; }

    var preExisting = toc.querySelectorAll('a[href^="#"]');
    var useExisting = preExisting.length >= Math.max(headings.length - 2, 1);

    if (!useExisting) {
      var list = toc.querySelector('.toc-sticky__list') || toc.querySelector('ul');
      if (!list) {
        list = document.createElement('ul');
        list.className = 'toc-sticky__list';
        toc.appendChild(list);
      }
      list.innerHTML = '';

      headings.forEach(function (h) {
        if (!h.id) h.id = slugify(h.textContent);
        var li = document.createElement('li');
        li.className = h.tagName.toLowerCase() === 'h3' ? 'toc-h3' : 'toc-h2';
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        a.setAttribute('data-toc-target', h.id);
        li.appendChild(a);
        list.appendChild(li);
      });
    } else {
      preExisting.forEach(function (a) {
        var id = (a.getAttribute('href') || '').replace(/^#/, '');
        if (id) a.setAttribute('data-toc-target', id);
      });
    }

    // Smooth scroll au clic
    $$('a[data-toc-target]', toc).forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('data-toc-target');
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var offset = 130;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      });
    });

    // Highlight section active via IntersectionObserver
    if ('IntersectionObserver' in window) {
      var links = {};
      $$('a[data-toc-target]', toc).forEach(function (a) {
        links[a.getAttribute('data-toc-target')] = a;
      });

      // Accordéon : afficher uniquement les h3 du h2 actif
      function updateTocH3Visibility() {
        var items = Array.prototype.slice.call(toc.querySelectorAll('.toc-h2, .toc-h3'));
        // Trouver l'index du h2 actif (le dernier h2 actif OU le h2 parent d'un h3 actif)
        var activeH2Index = -1;
        for (var i = 0; i < items.length; i++) {
          var li = items[i];
          var link = li.querySelector('a');
          if (!link) continue;
          if (li.classList.contains('toc-h2') && link.classList.contains('is-active')) {
            activeH2Index = i;
          }
          if (li.classList.contains('toc-h3') && link.classList.contains('is-active')) {
            // remonter vers le dernier h2 avant ce h3
            for (var j = i - 1; j >= 0; j--) {
              if (items[j].classList.contains('toc-h2')) {
                if (activeH2Index === -1 || j > activeH2Index) activeH2Index = j;
                break;
              }
            }
          }
        }
        // Toggle h3 visibility
        for (var k = 0; k < items.length; k++) {
          var item = items[k];
          if (!item.classList.contains('toc-h3')) continue;
          var belongs = false;
          if (activeH2Index !== -1 && k > activeH2Index) {
            var hasH2Between = false;
            for (var m = activeH2Index + 1; m < k; m++) {
              if (items[m].classList.contains('toc-h2')) { hasH2Between = true; break; }
            }
            if (!hasH2Between) belongs = true;
          }
          item.classList.toggle('toc-visible', belongs);
        }
      }

      var visibleIds = new Set();

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.id;
          if (entry.isIntersecting) visibleIds.add(id);
          else visibleIds.delete(id);
        });

        // Premier id visible dans l'ordre du DOM
        var activeId = null;
        for (var i = 0; i < headings.length; i++) {
          if (visibleIds.has(headings[i].id)) { activeId = headings[i].id; break; }
        }

        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle('is-active', id === activeId);
        });
        updateTocH3Visibility();
      }, {
        rootMargin: '-130px 0px -70% 0px',
        threshold: 0
      });

      headings.forEach(function (h) { observer.observe(h); });
      updateTocH3Visibility();
    }
  }

  // ------------------------------------------------------------
  // 2. Reading progress bar + scroll depth tracking
  // ------------------------------------------------------------
  function initReadingProgress() {
    var bar = $('.reading-progress');
    var article = $('.blog-body') || $('.blog-content') || $('[data-article]') || $('.blog-article');
    if (!article) return;

    // Auto-création de la barre si absente
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'reading-progress';
      document.body.prepend(bar);
    }

    var milestonesHit = { 25: false, 50: false, 75: false, 100: false };

    function update() {
      var rect = article.getBoundingClientRect();
      var articleHeight = article.offsetHeight;
      var viewport = window.innerHeight;
      var scrolled = -rect.top;
      var total = Math.max(articleHeight - viewport, 1);
      var pct = Math.min(Math.max((scrolled / total) * 100, 0), 100);
      bar.style.width = pct + '%';

      [25, 50, 75, 100].forEach(function (m) {
        if (!milestonesHit[m] && pct >= m) {
          milestonesHit[m] = true;
          push('blog_scroll_depth', { depth: m });
        }
      });
    }

    var throttled = throttle(update, 80);
    window.addEventListener('scroll', throttled, { passive: true });
    window.addEventListener('resize', throttled);
    update();
  }

  // ------------------------------------------------------------
  // 3. Share bar : LinkedIn / X / Facebook / Copy link
  // ------------------------------------------------------------
  function initShareBar() {
    var bar = $('.share-bar');
    if (!bar) return;

    var cleanUrl = window.location.href.split('#')[0].split('?')[0];
    var title = (document.querySelector('meta[property="og:title"]') || {}).content
      || document.title;

    function withUtm(baseUrl, platform) {
      var u = new URL(baseUrl);
      u.searchParams.set('utm_source', platform);
      u.searchParams.set('utm_medium', 'social');
      u.searchParams.set('utm_campaign', 'blog');
      return u.toString();
    }

    function openShare(platform) {
      var shareUrl = withUtm(cleanUrl, platform);
      var encoded = encodeURIComponent(shareUrl);
      var encodedTitle = encodeURIComponent(title);
      var target = '';

      if (platform === 'linkedin') {
        target = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encoded;
      } else if (platform === 'twitter' || platform === 'x') {
        target = 'https://twitter.com/intent/tweet?url=' + encoded + '&text=' + encodedTitle;
      } else if (platform === 'facebook') {
        target = 'https://www.facebook.com/sharer/sharer.php?u=' + encoded;
      }

      push('blog_share_click', { platform: platform, url: cleanUrl });
      if (target) window.open(target, '_blank', 'noopener,noreferrer,width=640,height=520');
    }

    $$('[data-share]', bar).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var platform = btn.getAttribute('data-share');
        if (platform === 'copy') return copyLink();
        openShare(platform);
      });
    });

    function copyLink() {
      var copyUrl = withUtm(cleanUrl, 'copy');
      var done = function () {
        push('blog_share_click', { platform: 'copy', url: cleanUrl });
        showToast('Lien copié !');
      };
      var fallback = function () {
        try {
          var ta = document.createElement('textarea');
          ta.value = copyUrl;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        } catch (e) {
          showToast('Impossible de copier');
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyUrl).then(done).catch(fallback);
      } else {
        fallback();
      }
    }
  }

  function showToast(message) {
    var toast = $('.share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'share-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  // ------------------------------------------------------------
  // 4. Floating CTA mobile : apparaît >30% scroll, disparaît si scroll up rapide
  // ------------------------------------------------------------
  function initFloatingCTA() {
    var cta = $('.cta-floating-mobile');
    if (!cta) return;

    var lastY = window.pageYOffset;
    var lastT = Date.now();
    var visible = false;

    function setVisible(v) {
      if (v === visible) return;
      visible = v;
      cta.classList.toggle('is-visible', v);
    }

    function update() {
      var y = window.pageYOffset;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? (y / docH) * 100 : 0;

      var now = Date.now();
      var dy = y - lastY;
      var dt = Math.max(now - lastT, 1);
      var velocity = dy / dt; // px/ms

      if (pct >= 30 && velocity > -0.5) {
        setVisible(true);
      } else if (velocity < -0.8) {
        setVisible(false); // scroll up rapide
      } else if (pct < 25) {
        setVisible(false);
      }

      lastY = y;
      lastT = now;
    }

    window.addEventListener('scroll', throttle(update, 100), { passive: true });

    cta.addEventListener('click', function () {
      push('blog_cta_click', {
        cta_type: 'floating_mobile',
        label: cta.dataset.ctaLabel || 'devis'
      });
    });
  }

  // ------------------------------------------------------------
  // 5. FAQ accordion éditorial (tracking des ouvertures)
  // ------------------------------------------------------------
  function initFaqAccordion() {
    $$('.faq-accordion-blog details').forEach(function (el) {
      el.addEventListener('toggle', function () {
        if (el.open) {
          var q = el.querySelector('summary');
          push('blog_faq_open', { question: q ? q.textContent.trim() : '' });
        }
      });
    });
  }

  // ------------------------------------------------------------
  // 6. Newsletter form (validation email + fake submit)
  // ------------------------------------------------------------
  function initNewsletter() {
    $$('.newsletter-cta__form, .newsletter-cta .newsletter-form').forEach(function (form) {
      var input = form.querySelector('input[type="email"]');
      var parent = form.parentNode;
      var feedback = parent.querySelector('.newsletter-cta__feedback');
      if (!feedback) {
        feedback = document.createElement('p');
        feedback.className = 'newsletter-cta__feedback';
        parent.insertBefore(feedback, form.nextSibling);
      }

      var started = false;
      if (input) {
        input.addEventListener('focus', function () {
          if (started) return;
          started = true;
          push('blog_form_start', { form_name: 'newsletter' });
        });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        feedback.className = 'newsletter-cta__feedback';
        feedback.textContent = '';
        var value = input ? input.value.trim() : '';
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!emailOk) {
          feedback.classList.add('is-error');
          feedback.textContent = 'Veuillez entrer une adresse email valide.';
          return;
        }
        // Fake submission (remplacer par vrai endpoint plus tard)
        console.log('[Sanalia Newsletter] signup:', value);
        push('blog_newsletter_signup', {
          email_domain: value.split('@')[1] || ''
        });
        feedback.classList.add('is-success');
        feedback.textContent = 'Merci ! Votre inscription est bien prise en compte.';
        if (input) input.value = '';
      });
    });
  }

  // ------------------------------------------------------------
  // 7. CTA tracking (view via IO + click)
  // ------------------------------------------------------------
  function initCtaTracking() {
    var ctas = $$('.cta-inline-blog');

    if ('IntersectionObserver' in window) {
      var viewed = new WeakSet();
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !viewed.has(entry.target)) {
            viewed.add(entry.target);
            var variant = (entry.target.className.match(/variant-(\w+)/) || [])[1] || 'default';
            push('blog_cta_view', {
              cta_type: 'inline',
              variant: variant,
              position: entry.target.dataset.ctaPosition || ''
            });
          }
        });
      }, { threshold: 0.5 });
      ctas.forEach(function (c) { observer.observe(c); });
    }

    ctas.forEach(function (cta) {
      var link = cta.querySelector('a, button');
      if (!link) return;
      link.addEventListener('click', function () {
        var variant = (cta.className.match(/variant-(\w+)/) || [])[1] || 'default';
        push('blog_cta_click', {
          cta_type: 'inline',
          variant: variant,
          href: link.getAttribute('href') || ''
        });
      });
    });

    // Sidebar widget
    $$('.cta-sidebar-widget a, .cta-sidebar-widget button').forEach(function (el) {
      el.addEventListener('click', function () {
        push('blog_cta_click', {
          cta_type: 'sidebar_widget',
          href: el.getAttribute('href') || ''
        });
      });
    });
  }

  // ------------------------------------------------------------
  // 8. Internal link cards (encarts programmatiques)
  // ------------------------------------------------------------
  function initInternalLinks() {
    $$('.internal-link-card').forEach(function (card) {
      card.addEventListener('click', function () {
        push('blog_internal_link_click', {
          href: card.getAttribute('href') || '',
          label: (card.querySelector('.internal-link-card__title') || {}).textContent || ''
        });
      });
    });
  }

  // ------------------------------------------------------------
  // 9. Phone click tracking
  // ------------------------------------------------------------
  function initPhoneTracking() {
    $$('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () {
        var location = 'other';
        if (a.closest('.cta-sidebar-widget')) location = 'sidebar';
        else if (a.closest('.cta-floating-mobile')) location = 'floating';
        else if (a.closest('.blog-body') || a.closest('.blog-content')) location = 'body';
        push('blog_phone_click', {
          phone: a.getAttribute('href').replace('tel:', ''),
          location: location
        });
      });
    });
  }

  // ------------------------------------------------------------
  // 10. Article view (fire au load)
  // ------------------------------------------------------------
  function trackArticleView() {
    var article = $('.blog-article') || $('.blog-body') || $('.blog-content') || $('[data-article]');
    if (!article) return;
    var category = (document.querySelector('meta[name="article:section"]') || {}).content || '';
    push('blog_article_view', {
      title: document.title,
      category: category,
      slug: location.pathname
    });
  }

  // ------------------------------------------------------------
  // 11. Blog search autocomplete (hub)
  // ------------------------------------------------------------
  var searchSuggestions = [
    // Articles blog
    {type:'article', title:'Comment se débarrasser des rats dans un appartement', url:'/blog/rats-souris/comment-se-debarrasser-rats-appartement/', tag:'Rats & Souris', category:'rats'},
    {type:'article', title:'Les 7 signes précoces d\'une infestation de punaises de lit', url:'/blog/punaises-de-lit/detecter-precocement/', tag:'Punaises', category:'punaises'},
    {type:'article', title:'Cycle de vie du cafard : pourquoi ils reviennent', url:'/blog/cafards-insectes/cycle-vie-cafard/', tag:'Cafards', category:'cafards'},
    {type:'article', title:'Rat ou souris ? 9 différences pour les reconnaître', url:'/blog/rats-souris/difference-rat-souris/', tag:'Rats & Souris', category:'rats'},
    {type:'article', title:'Comment boucher durablement les entrées des rongeurs', url:'/blog/rats-souris/boucher-entrees-rongeurs/', tag:'Prévention', category:'prevention'},
    {type:'article', title:'Maladies transmises par les rats : leptospirose, hantavirus', url:'/blog/rats-souris/maladies-transmises-rats/', tag:'Santé', category:'rats'},
    {type:'article', title:'Thermique ou chimique ? Traitements des punaises de lit', url:'/blog/punaises-de-lit/traitement-thermique-vs-chimique/', tag:'Traitement', category:'punaises'},
    {type:'article', title:'Voyage et hôtel : ne pas ramener de punaises de lit', url:'/blog/punaises-de-lit/punaises-voyage-hotel/', tag:'Prévention', category:'punaises'},
    {type:'article', title:'Piqûres de punaises de lit : les identifier', url:'/blog/punaises-de-lit/piqures-identifier/', tag:'Punaises', category:'punaises'},
    {type:'article', title:'Frelon asiatique ou européen : 5 critères', url:'/blog/guepes-frelons/frelon-asiatique-reconnaitre/', tag:'Guêpes', category:'guepes'},
    {type:'article', title:'Nid de guêpes dans la toiture : ne pas le déloger soi-même', url:'/blog/guepes-frelons/nid-guepes-toiture/', tag:'Guêpes', category:'guepes'},
    {type:'article', title:'Piqûre de guêpe et allergie : réagir dans les 15 minutes', url:'/blog/guepes-frelons/piqure-allergie-reagir/', tag:'Santé', category:'guepes'},
    {type:'article', title:'Cafards en cuisine professionnelle : risques HACCP', url:'/blog/cafards-insectes/cafards-cuisine-restaurant/', tag:'Pro', category:'cafards'},
    {type:'article', title:'Fourmis dans la maison : remonter à la colonie', url:'/blog/cafards-insectes/fourmis-maison-colonies/', tag:'Fourmis', category:'fourmis'},
    {type:'article', title:'Moustique tigre : 12 gestes pour protéger votre jardin', url:'/blog/cafards-insectes/moustique-tigre-jardin/', tag:'Moustiques', category:'moustiques'},
    // Pillars
    {type:'pillar', title:'Rats & Souris : Guide complet 2026', url:'/nuisibles/rats/', tag:'Dossier', category:'rats'},
    {type:'pillar', title:'Punaises de lit : Guide complet', url:'/nuisibles/punaises-de-lit/', tag:'Dossier', category:'punaises'},
    {type:'pillar', title:'Cafards & Insectes : Guide complet', url:'/nuisibles/cafards/', tag:'Dossier', category:'cafards'},
    {type:'pillar', title:'Guêpes & Frelons : Guide complet', url:'/nuisibles/guepes-frelons/', tag:'Dossier', category:'guepes'},
    {type:'pillar', title:'Prévention & Réglementation', url:'/reglementation/', tag:'Dossier', category:'prevention'},
    // Fiches nuisibles
    {type:'nuisible', title:'Rats — Fiche complète', url:'/nuisibles/rats/', tag:'Fiche nuisible', category:'rats'},
    {type:'nuisible', title:'Souris — Fiche complète', url:'/nuisibles/souris/', tag:'Fiche nuisible', category:'souris'},
    {type:'nuisible', title:'Punaises de lit — Fiche complète', url:'/nuisibles/punaises-de-lit/', tag:'Fiche nuisible', category:'punaises'},
    {type:'nuisible', title:'Cafards — Fiche complète', url:'/nuisibles/cafards/', tag:'Fiche nuisible', category:'cafards'},
    {type:'nuisible', title:'Guêpes & Frelons — Fiche complète', url:'/nuisibles/guepes-frelons/', tag:'Fiche nuisible', category:'guepes'},
    {type:'nuisible', title:'Fourmis — Fiche complète', url:'/nuisibles/fourmis/', tag:'Fiche nuisible', category:'fourmis'},
    {type:'nuisible', title:'Moustiques — Fiche complète', url:'/nuisibles/moustiques/', tag:'Fiche nuisible', category:'moustiques'},
    {type:'nuisible', title:'Pigeons — Fiche complète', url:'/nuisibles/pigeons/', tag:'Fiche nuisible', category:'pigeons'},
    // Réglementation
    {type:'reglementation', title:'Obligations du locataire face aux nuisibles', url:'/reglementation/', tag:'Réglementation', category:'prevention'},
    {type:'reglementation', title:'Réglementation copropriété et dératisation', url:'/reglementation/', tag:'Réglementation', category:'prevention'},
    {type:'reglementation', title:'Punaises de lit : qui paie, locataire ou propriétaire', url:'/blog/prevention-reglementation/loi-punaises-locataires/', tag:'Réglementation', category:'prevention'},
    {type:'reglementation', title:'Certibiocide : que vérifier avant de choisir', url:'/blog/prevention-reglementation/certibiocide-artisans/', tag:'Réglementation', category:'prevention'},
    {type:'reglementation', title:'Calendrier 2026 des nuisibles en France', url:'/blog/prevention-reglementation/calendrier-nuisibles-france/', tag:'Saisonnalité', category:'prevention'},
    // Services
    {type:'service', title:'Dératisation à Lyon', url:'/deratisation/lyon/', tag:'Service', category:'rats'},
    {type:'service', title:'Dératisation à Paris', url:'/deratisation/paris/', tag:'Service', category:'rats'},
    {type:'service', title:'Traitement punaises de lit', url:'/desinsectisation/punaises-de-lit/', tag:'Service', category:'punaises'},
    {type:'service', title:'Traitement des cafards', url:'/desinsectisation/cafards/', tag:'Service', category:'cafards'},
    {type:'service', title:'Dépigeonnage', url:'/depigeonnage/', tag:'Service', category:'pigeons'},
    {type:'service', title:'Devis gratuit', url:'/devis/', tag:'Service', category:'general'}
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function initBlogSearch() {
    var input = document.querySelector('.blog-search input');
    if (!input) return;
    var form = input.closest('.blog-search');
    if (!form) return;

    var dropdown = document.createElement('div');
    dropdown.className = 'blog-search-dropdown';
    dropdown.setAttribute('role', 'listbox');
    form.appendChild(dropdown);

    function render(q) {
      var query = q.trim().toLowerCase();
      if (query.length < 2) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        return;
      }
      var normalized = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var results = searchSuggestions.filter(function (s) {
        var hay = (s.title + ' ' + s.tag + ' ' + s.category).toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return hay.indexOf(normalized) !== -1;
      }).slice(0, 8);

      if (results.length === 0) {
        dropdown.innerHTML = '<div class="blog-search-empty">Aucun résultat pour « ' + escapeHtml(q) + ' »</div>';
      } else {
        dropdown.innerHTML = results.map(function (r) {
          return '<a href="' + r.url + '" class="blog-search-result" data-type="' + r.type + '" role="option">' +
            '<span class="blog-search-tag tag-' + r.category + '">' + escapeHtml(r.tag) + '</span>' +
            '<span class="blog-search-title">' + escapeHtml(r.title) + '</span>' +
          '</a>';
        }).join('');
      }
      dropdown.style.display = 'block';
    }

    input.addEventListener('input', function (e) { render(e.target.value); });
    input.addEventListener('focus', function () {
      if (input.value.length >= 2) render(input.value);
    });
    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) dropdown.style.display = 'none';
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { dropdown.style.display = 'none'; input.blur(); }
    });
    dropdown.addEventListener('click', function (e) {
      var result = e.target.closest('.blog-search-result');
      if (result) {
        push('blog_search_click', {
          query: input.value,
          destination: result.getAttribute('href'),
          type: result.getAttribute('data-type')
        });
      }
    });
  }

  // ------------------------------------------------------------
  // Init global
  // ------------------------------------------------------------
  function init() {
    trackArticleView();
    initTOC();
    initReadingProgress();
    initShareBar();
    initFloatingCTA();
    initFaqAccordion();
    initNewsletter();
    initCtaTracking();
    initInternalLinks();
    initPhoneTracking();
    initBlogSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

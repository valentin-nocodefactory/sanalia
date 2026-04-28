/* ═══════════════════════════════════════════════════════════
   SANALIA — Address autocomplete widget
   API : Base Adresse Nationale française (api-adresse.data.gouv.fr)
   Couvre toutes les adresses françaises, gratuit, sans clé.
   Auto-init sur tout [data-addr-widget] dans la page.
   ═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var BAN_ENDPOINT = 'https://api-adresse.data.gouv.fr/search/';

  function debounce(fn, delay) {
    var t;
    return function() {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  }

  function init(widget) {
    if (widget.__addrInit) return;
    widget.__addrInit = true;

    var input = widget.querySelector('[data-addr-input]');
    var dropdown = widget.querySelector('[data-addr-dropdown]');
    var spinner = widget.querySelector('[data-addr-spinner]');
    var cpInput = document.querySelector(widget.getAttribute('data-fill-cp') || '#addr-cp');
    var cityInput = document.querySelector(widget.getAttribute('data-fill-city') || '#addr-city');
    if (!input || !dropdown) return;

    var currentCtrl = null;
    var lastResults = [];

    function setLoading(b) {
      if (spinner) spinner.style.display = b ? 'grid' : 'none';
    }
    function closeDropdown() {
      dropdown.innerHTML = '';
      dropdown.style.display = 'none';
    }
    function renderEmpty() {
      dropdown.innerHTML = '<div class="addr-suggest-empty">Aucune adresse trouvée — vous pouvez la saisir manuellement.</div>';
      dropdown.style.display = 'block';
    }
    function renderResults(features) {
      lastResults = features;
      if (!features.length) { renderEmpty(); return; }
      dropdown.innerHTML = features.map(function(f, i) {
        return '<button type="button" class="addr-suggest-item" data-idx="' + i + '">' +
          '<span class="addr-suggest-pin" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
          '</span>' +
          '<span class="addr-suggest-text">' +
            '<span class="addr-suggest-main">' + escapeHtml(f.name) + '</span>' +
            '<span class="addr-suggest-sub">' + escapeHtml(f.postcode || '') + ' · ' + escapeHtml(f.city || '') + '</span>' +
          '</span>' +
        '</button>';
      }).join('');
      dropdown.style.display = 'block';

      // Click handlers
      dropdown.querySelectorAll('.addr-suggest-item').forEach(function(el) {
        el.addEventListener('mousedown', function(e) {
          e.preventDefault(); // évite le blur du input avant le click
          var idx = parseInt(el.getAttribute('data-idx'), 10);
          var pick = lastResults[idx];
          if (!pick) return;
          input.value = pick.name || (pick.label || '').split(',')[0].trim();
          if (cpInput) { cpInput.value = pick.postcode || ''; cpInput.dispatchEvent(new Event('input', { bubbles: true })); }
          if (cityInput) { cityInput.value = pick.city || ''; cityInput.dispatchEvent(new Event('input', { bubbles: true })); }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          closeDropdown();
        });
      });
    }
    function escapeHtml(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
      });
    }

    var search = debounce(function(q) {
      if (!q || q.trim().length < 3) { closeDropdown(); setLoading(false); return; }
      if (currentCtrl) currentCtrl.abort();
      currentCtrl = new AbortController();
      setLoading(true);
      fetch(BAN_ENDPOINT + '?q=' + encodeURIComponent(q.trim()) + '&limit=6&autocomplete=1', { signal: currentCtrl.signal })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var features = (data.features || []).map(function(f) {
            return {
              label: f.properties.label,
              name: f.properties.name,
              postcode: f.properties.postcode,
              city: f.properties.city,
              type: f.properties.type,
            };
          });
          renderResults(features);
        })
        .catch(function(err) {
          if (err && err.name === 'AbortError') return;
          renderEmpty();
        })
        .finally(function() { setLoading(false); });
    }, 250);

    input.addEventListener('input', function() { search(input.value); });
    input.addEventListener('focus', function() {
      if (lastResults.length > 0) dropdown.style.display = 'block';
    });
    document.addEventListener('mousedown', function(e) {
      if (!widget.contains(e.target)) closeDropdown();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeDropdown();
    });
  }

  function initAll() {
    document.querySelectorAll('[data-addr-widget]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  window.initAddrWidgets = initAll;
})();

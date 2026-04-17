/* ═══════════════════════════════════════════════════════════
   SANALIA — Phone widget
   Country picker (flag + dial code) + live input mask
   Auto-initializes every [data-phone-widget] in the page.
   ═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── Country catalog (priority order: FR default, then EU / world commonly used) ───
  // mask: groups of digits (space-separated); # = a digit.
  // national lengths = total digits WITHOUT the leading 0 (and without the +X country code).
  var COUNTRIES = [
    { iso: 'FR', name: 'France',           flag: '🇫🇷', dial: '+33', mask: '# ## ## ## ##', len: 9 },
    { iso: 'BE', name: 'Belgique',         flag: '🇧🇪', dial: '+32', mask: '### ## ## ##',  len: 9 },
    { iso: 'CH', name: 'Suisse',           flag: '🇨🇭', dial: '+41', mask: '## ### ## ##',  len: 9 },
    { iso: 'LU', name: 'Luxembourg',       flag: '🇱🇺', dial: '+352', mask: '### ### ###',  len: 9 },
    { iso: 'MC', name: 'Monaco',           flag: '🇲🇨', dial: '+377', mask: '## ## ## ##',  len: 8 },
    { iso: 'DE', name: 'Allemagne',        flag: '🇩🇪', dial: '+49', mask: '### #######',  len: 10 },
    { iso: 'GB', name: 'Royaume-Uni',      flag: '🇬🇧', dial: '+44', mask: '#### ######',   len: 10 },
    { iso: 'IT', name: 'Italie',           flag: '🇮🇹', dial: '+39', mask: '### ### ####',  len: 10 },
    { iso: 'ES', name: 'Espagne',          flag: '🇪🇸', dial: '+34', mask: '### ### ###',   len: 9 },
    { iso: 'PT', name: 'Portugal',         flag: '🇵🇹', dial: '+351', mask: '### ### ###',  len: 9 },
    { iso: 'NL', name: 'Pays-Bas',         flag: '🇳🇱', dial: '+31', mask: '## ### ####',   len: 9 },
    { iso: 'IE', name: 'Irlande',          flag: '🇮🇪', dial: '+353', mask: '## ### ####',  len: 9 },
    { iso: 'AT', name: 'Autriche',         flag: '🇦🇹', dial: '+43', mask: '### #######',   len: 10 },
    { iso: 'DK', name: 'Danemark',         flag: '🇩🇰', dial: '+45', mask: '## ## ## ##',   len: 8 },
    { iso: 'SE', name: 'Suède',            flag: '🇸🇪', dial: '+46', mask: '## ### ## ##',  len: 9 },
    { iso: 'NO', name: 'Norvège',          flag: '🇳🇴', dial: '+47', mask: '### ## ###',    len: 8 },
    { iso: 'FI', name: 'Finlande',         flag: '🇫🇮', dial: '+358', mask: '## ### ####',  len: 9 },
    { iso: 'PL', name: 'Pologne',          flag: '🇵🇱', dial: '+48', mask: '### ### ###',   len: 9 },
    { iso: 'CZ', name: 'Tchéquie',         flag: '🇨🇿', dial: '+420', mask: '### ### ###',  len: 9 },
    { iso: 'US', name: 'États-Unis',       flag: '🇺🇸', dial: '+1',  mask: '### ### ####',  len: 10 },
    { iso: 'CA', name: 'Canada',           flag: '🇨🇦', dial: '+1',  mask: '### ### ####',  len: 10 },
    { iso: 'MA', name: 'Maroc',            flag: '🇲🇦', dial: '+212', mask: '### ### ###',  len: 9 },
    { iso: 'DZ', name: 'Algérie',          flag: '🇩🇿', dial: '+213', mask: '### ### ###',  len: 9 },
    { iso: 'TN', name: 'Tunisie',          flag: '🇹🇳', dial: '+216', mask: '## ### ###',   len: 8 },
    { iso: 'SN', name: 'Sénégal',          flag: '🇸🇳', dial: '+221', mask: '## ### ## ##', len: 9 },
    { iso: 'CI', name: 'Côte d\'Ivoire',   flag: '🇨🇮', dial: '+225', mask: '## ## ## ## ##', len: 10 },
    { iso: 'CM', name: 'Cameroun',         flag: '🇨🇲', dial: '+237', mask: '### ### ###',  len: 9 }
  ];

  function findByIso(iso) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].iso === iso) return COUNTRIES[i];
    return COUNTRIES[0];
  }

  // ─── Apply mask: takes raw digits, returns formatted string ───
  function applyMask(mask, digits) {
    var out = '';
    var di = 0;
    for (var i = 0; i < mask.length && di < digits.length; i++) {
      var ch = mask.charAt(i);
      if (ch === '#') {
        out += digits.charAt(di);
        di++;
      } else {
        out += ch;
      }
    }
    return out;
  }

  // ─── Widget factory ───
  function init(widget) {
    if (widget.__initialized) return;
    widget.__initialized = true;

    var toggle = widget.querySelector('.phone-country-toggle');
    var dropdown = widget.querySelector('.phone-country-dropdown');
    var input = widget.querySelector('[data-phone-input]');
    var countryInput = widget.querySelector('[data-phone-country]');
    var dialInput = widget.querySelector('[data-phone-dial]');
    var flagEl = widget.querySelector('[data-flag]');
    var codeEl = widget.querySelector('[data-code]');
    if (!toggle || !dropdown || !input) return;

    var current = findByIso(countryInput ? countryInput.value : 'FR');

    // Render dropdown
    function renderDropdown(filter) {
      filter = (filter || '').trim().toLowerCase();
      var list = COUNTRIES.filter(function(c) {
        if (!filter) return true;
        return c.name.toLowerCase().indexOf(filter) !== -1 ||
               c.dial.indexOf(filter) !== -1 ||
               c.iso.toLowerCase().indexOf(filter) !== -1;
      });

      var html = '<div class="phone-country-search"><input type="text" placeholder="Rechercher un pays…" autocomplete="off"></div>';
      if (list.length === 0) {
        html += '<div class="phone-country-empty">Aucun pays trouvé</div>';
      } else {
        html += list.map(function(c) {
          var active = c.iso === current.iso ? ' is-active' : '';
          return '<div class="phone-country-option' + active + '" role="option" data-iso="' + c.iso + '">' +
            '<span class="phone-flag">' + c.flag + '</span>' +
            '<span class="option-name">' + c.name + '</span>' +
            '<span class="option-code">' + c.dial + '</span>' +
            '</div>';
        }).join('');
      }
      dropdown.innerHTML = html;

      // Search input
      var searchEl = dropdown.querySelector('.phone-country-search input');
      if (searchEl) {
        searchEl.addEventListener('input', function(e) { renderDropdown(e.target.value); });
        searchEl.addEventListener('click', function(e) { e.stopPropagation(); });
        setTimeout(function() { searchEl.focus(); }, 30);
      }

      // Options
      dropdown.querySelectorAll('.phone-country-option').forEach(function(opt) {
        opt.addEventListener('click', function(e) {
          e.stopPropagation();
          var iso = opt.getAttribute('data-iso');
          setCountry(iso);
          closeDropdown();
          input.focus();
        });
      });
    }

    function setCountry(iso) {
      current = findByIso(iso);
      if (flagEl) flagEl.textContent = current.flag;
      if (codeEl) codeEl.textContent = current.dial;
      if (countryInput) countryInput.value = current.iso;
      if (dialInput) dialInput.value = current.dial;
      // Update placeholder to show the expected mask
      input.placeholder = current.mask.replace(/#/g, '_');
      input.setAttribute('inputmode', 'tel');
      // Re-format current value according to new mask
      var digits = (input.value || '').replace(/\D/g, '');
      // Strip leading 0 (French-style national prefix) if we have a dial code
      if (digits.charAt(0) === '0') digits = digits.slice(1);
      digits = digits.slice(0, current.len);
      input.value = applyMask(current.mask, digits);
    }

    // Input mask
    input.addEventListener('input', function() {
      var digits = input.value.replace(/\D/g, '');
      if (digits.charAt(0) === '0') digits = digits.slice(1);
      digits = digits.slice(0, current.len);
      input.value = applyMask(current.mask, digits);
    });
    input.addEventListener('keydown', function(e) {
      // Allow controls
      if (e.ctrlKey || e.metaKey) return;
      if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].indexOf(e.key) !== -1) return;
      // Block non-digits (except for select-all, copy, paste)
      if (e.key && e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
    });

    // Dropdown toggle
    function openDropdown() {
      widget.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      renderDropdown('');
    }
    function closeDropdown() {
      widget.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (widget.classList.contains('is-open')) closeDropdown(); else openDropdown();
    });
    document.addEventListener('click', function(e) {
      if (!widget.contains(e.target)) closeDropdown();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && widget.classList.contains('is-open')) closeDropdown();
    });

    // Initial render
    setCountry(current.iso);
  }

  function initAll() {
    document.querySelectorAll('[data-phone-widget]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-init on dynamic insertion (e.g. callback modal is already in DOM, but defensive)
  window.initPhoneWidgets = initAll;
})();

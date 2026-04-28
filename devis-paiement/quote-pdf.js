/* =========================================================
   Sanalia — Quote PDF generator (vectoriel jsPDF)
   ---------------------------------------------------------
   Police : Helvetica uniquement (font standard PDF, support garanti
   des accents français en WinAnsiEncoding). Pas de superscripts ni
   de symboles Unicode exotiques (point médian, em-dash, ʳᵉ, ᵉ) qui
   ne s'affichent pas dans Helvetica par défaut.
   ========================================================= */

(function() {
  'use strict';

  var C_TEXT  = [14, 5, 42];
  var C_MUT   = [102, 102, 102];
  var C_MUT2  = [153, 153, 153];
  var C_VIO   = [99, 93, 221];
  var C_ACC   = [246, 108, 36];
  var C_LINE  = [229, 229, 229];
  var C_BG    = [246, 245, 240];

  // Formatte un nombre en EUR sans le symbole (utilise " EUR" en suffixe pour éviter
  // tout souci d'encodage du caractère € sur certaines configurations Helvetica).
  function fmtMoney(n) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toFixed(2).replace('.', ',') + ' EUR';
  }
  function dayLabel(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  var SLOTS_LABELS = {
    '08-10': '08:00 - 10:00',
    '10-12': '10:00 - 12:00',
    '12-14': '12:00 - 14:00',
    '14-16': '14:00 - 16:00',
    '16-18': '16:00 - 18:00',
    '18-20': '18:00 - 20:00',
  };
  var NUISIBLE_LABELS = {
    rat: 'Rats', souris: 'Souris', cafard: 'Cafards', punaise: 'Punaises',
    fourmi: 'Fourmis', moustique: 'Moustiques', guepe: 'Guepes', pigeon: 'Pigeons',
  };

  function generateQuotePDF(state, quote, quoteRef, leadId) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.warn('[quote-pdf] jsPDF non charge');
      return null;
    }
    var jsPDFCtor = window.jspdf.jsPDF;
    var doc = new jsPDFCtor({ unit: 'mm', format: 'a4', compress: true });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();

    var marginX = 18;
    var contentW = W - marginX * 2;
    var y = 18;

    // ============ HEADER ============
    doc.setFillColor.apply(doc, C_BG);
    doc.rect(0, 0, W, 38, 'F');

    // Pastille violette + wordmark
    doc.setFillColor.apply(doc, C_VIO);
    doc.circle(marginX + 4, 14, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor.apply(doc, C_TEXT);
    doc.text('sanalia', marginX + 11, 16);

    // Brand mention société
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, C_MUT);
    doc.text('Sanalia - Deratisation en ligne', marginX, 24);
    doc.text('12 rue des Innovateurs, 75011 Paris', marginX, 28);
    doc.text('SIRET 891 234 567 00012  -  TVA FR 98 891 234 567', marginX, 32);

    // Bloc meta à droite — stack vertical (label petit au-dessus, value bold en dessous)
    var metaX = W - marginX;
    var metaY = 11;
    var validUntil = new Date(Date.now() + 7 * 86400000).toLocaleDateString('fr-FR');
    var metaRows = [
      { label: 'DEVIS',           value: quoteRef || '-' },
      { label: 'DATE',            value: new Date().toLocaleDateString('fr-FR') },
      { label: 'VALABLE JUSQUAU', value: validUntil },
    ];
    if (leadId) {
      metaRows.push({ label: 'REFERENCE LEAD', value: String(leadId) });
    }
    metaRows.forEach(function(row) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor.apply(doc, C_MUT2);
      doc.text(row.label, metaX, metaY, { align: 'right' });
      metaY += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, C_TEXT);
      doc.text(row.value, metaX, metaY, { align: 'right' });
      metaY += 5.5;
    });

    y = 50;

    // ============ TITRE ============
    var nuisibleLabel = (NUISIBLE_LABELS[state.nuisible] || state.nuisible || 'nuisibles').toLowerCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor.apply(doc, C_TEXT);
    doc.text('Traitement ' + nuisibleLabel + (state.audience === 'pro' ? ' - Pro' : ''), marginX, y);
    y += 9;

    // ============ PARTIES ============
    var leftColX = marginX;
    var rightColX = marginX + contentW / 2 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, C_MUT2);
    doc.text('PRESTATAIRE', leftColX, y);
    doc.text('CLIENT', rightColX, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor.apply(doc, C_TEXT);
    doc.text('Sanalia', leftColX, y);
    var clientName = ((state.coords && state.coords.first) || '') + ' ' + ((state.coords && state.coords.last) || '');
    doc.text(clientName.trim() || '-', rightColX, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor.apply(doc, C_MUT);
    doc.text('12 rue des Innovateurs', leftColX, y);
    var addrLine = (state.adresse && state.adresse.line) || '-';
    doc.text(addrLine, rightColX, y, { maxWidth: contentW / 2 - 4 });
    y += 4.5;

    doc.text('75011 Paris', leftColX, y);
    var addrCity = ((state.adresse && state.adresse.cp) || '') + ' ' + ((state.adresse && state.adresse.city) || '');
    doc.text(addrCity.trim() || '-', rightColX, y);
    y += 4.5;

    if (state.coords && state.coords.email) {
      doc.text('contact@sanalia.fr', leftColX, y);
      doc.text(state.coords.email, rightColX, y);
      y += 4.5;
    }
    y += 5;

    // Séparateur
    doc.setDrawColor.apply(doc, C_LINE);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, W - marginX, y);
    y += 8;

    // ============ TABLEAU DES LIGNES ============
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, C_MUT2);
    var colDescX = marginX;
    var colQtyX = W - marginX - 70;
    var colPuX = W - marginX - 38;
    var colTotalX = W - marginX;
    doc.text('DESIGNATION', colDescX, y);
    doc.text('QTE', colQtyX, y, { align: 'right' });
    doc.text('PU HT', colPuX, y, { align: 'right' });
    doc.text('TOTAL HT', colTotalX, y, { align: 'right' });
    y += 3;
    doc.line(marginX, y, W - marginX, y);
    y += 5;

    function drawLine(opts) {
      var color = opts.color || C_TEXT;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, color);
      doc.text(opts.title, colDescX, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, opts.color === C_ACC ? C_ACC : C_MUT);
      var subLines = doc.splitTextToSize(opts.sub || '', colQtyX - colDescX - 6);
      var subY = y + 4;
      subLines.forEach(function(sl) { doc.text(sl, colDescX, subY); subY += 4; });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, color);
      doc.text(String(opts.qty), colQtyX, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor.apply(doc, opts.color === C_ACC ? C_ACC : C_MUT);
      doc.text(opts.pu, colPuX, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor.apply(doc, color);
      doc.text(opts.total, colTotalX, y, { align: 'right' });

      y = subY + 1.5;
      doc.setDrawColor.apply(doc, C_LINE);
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(marginX, y, W - marginX, y);
      doc.setLineDashPattern([], 0);
      y += 5;
    }

    var rdv1 = dayLabel(state.creneau && state.creneau.day) + '  -  ' + (SLOTS_LABELS[state.creneau && state.creneau.slot] || '-');
    var rdv2 = dayLabel(state.creneau && state.creneau.day2) + '  -  ' + (SLOTS_LABELS[state.creneau && state.creneau.slot2] || '-');

    drawLine({
      title: 'Diagnostic + deplacement',
      sub: 'Examen sur place, identification du foyer, plan de traitement',
      qty: 1, pu: fmtMoney(quote.diag), total: fmtMoney(quote.diag),
    });
    drawLine({
      title: 'Intervention n.1 - traitement ' + nuisibleLabel,
      sub: rdv1 + '  -  produits Certibiocide, sans danger pour vos animaux',
      qty: 1, pu: fmtMoney(quote.intervention1), total: fmtMoney(quote.intervention1),
    });
    drawLine({
      title: 'Intervention n.2 - controle et finition',
      sub: rdv2 + "  -  verification de l'efficacite, complement si necessaire",
      qty: 1, pu: fmtMoney(quote.intervention2), total: fmtMoney(quote.intervention2),
    });
    drawLine({
      title: 'Produits et materiels',
      sub: "Biocides Certibiocide TP14/TP18, pieges, postes d'appatage securises",
      qty: 1, pu: fmtMoney(quote.products || 32), total: fmtMoney(quote.products || 32),
    });
    drawLine({
      title: 'Remise - 1ere intervention offerte',
      sub: 'Offre de bienvenue Sanalia, valable sur le 1er passage',
      qty: 1, pu: '-' + fmtMoney(quote.discount), total: '-' + fmtMoney(quote.discount),
      color: C_ACC,
    });

    y += 4;

    // ============ TOTAUX ============
    var totalsX = W - marginX;
    var totalsLabelX = totalsX - 70;

    function drawTotalRow(label, value, opts) {
      opts = opts || {};
      var lblColor = opts.lblColor || C_MUT;
      var valColor = opts.valColor || C_TEXT;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, lblColor);
      doc.text(label, totalsLabelX, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor.apply(doc, valColor);
      doc.text(value, totalsX, y, { align: 'right' });
      y += 5.5;
    }

    drawTotalRow('Sous-total HT', fmtMoney(quote.subtotalBefore));
    drawTotalRow('Remise 1ere intervention', '-' + fmtMoney(quote.discount), { lblColor: C_ACC, valColor: C_ACC });
    drawTotalRow('Total HT', fmtMoney(quote.ht));
    if (state.audience !== 'pro') {
      drawTotalRow('TVA 20%', fmtMoney(quote.tva));
    }

    // Total grand
    y += 1.5;
    doc.setDrawColor.apply(doc, C_TEXT);
    doc.setLineWidth(0.4);
    doc.line(totalsLabelX, y, totalsX, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, C_TEXT);
    doc.text(state.audience === 'pro' ? 'Total HT' : 'Total TTC', totalsLabelX, y);
    doc.setFontSize(16);
    doc.text(fmtMoney(state.audience === 'pro' ? quote.ht : quote.ttc), totalsX, y, { align: 'right' });
    y += 12;

    // ============ FOOTER ============
    var footerY = H - 30;
    doc.setFillColor.apply(doc, C_BG);
    doc.rect(0, footerY - 4, W, 34, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    var perks = [
      "Annulation gratuite jusqu'a 48 h avant",
      '1ere intervention offerte',
      'Devis valable 7 jours',
      'Techniciens certifies Certibiocide',
    ];
    var perkY = footerY + 1;
    var GREEN = [34, 197, 94];
    perks.forEach(function(p) {
      // Petite pastille verte vectorielle (cercle plein)
      doc.setFillColor.apply(doc, GREEN);
      doc.circle(marginX + 1.4, perkY - 0.9, 0.9, 'F');
      // Texte
      doc.setTextColor.apply(doc, C_MUT);
      doc.text(p, marginX + 5, perkY);
      perkY += 5;
    });

    doc.setFontSize(7);
    doc.setTextColor.apply(doc, C_MUT2);
    doc.text('Devis emis le ' + new Date().toLocaleDateString('fr-FR') + ' - Sanalia, SIRET 891 234 567 00012',
      W / 2, H - 6, { align: 'center' });

    var dataUri = doc.output('datauristring');
    var base64 = dataUri.split(',')[1];
    var blob = doc.output('blob');
    var filename = 'devis-' + (quoteRef || 'sanalia') + '.pdf';

    return { base64: base64, blob: blob, filename: filename, dataUri: dataUri };
  }

  function downloadQuotePDF(state, quote, quoteRef) {
    var pdf = generateQuotePDF(state, quote, quoteRef);
    if (!pdf) return null;
    var url = URL.createObjectURL(pdf.blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = pdf.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    return pdf;
  }

  window.generateQuotePDF = generateQuotePDF;
  window.downloadQuotePDF = downloadQuotePDF;
})();

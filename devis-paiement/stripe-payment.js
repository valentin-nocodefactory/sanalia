/* =========================================================
   Sanalia — Stripe Payment Element integration
   ---------------------------------------------------------
   Pattern : SetupFutureUsage off_session (acompte maintenant + solde plus tard).
   Le 1er paiement (49 € acompte) sauvegarde la carte sur le Customer Stripe ;
   le solde sera capturé via API n8n après l'intervention sans nouvelle saisie.

   API exposée :
     window.SanaliaStripe.init()                      → singleton Stripe.js
     window.SanaliaStripe.createIntent(payload)       → POST n8n, renvoie clientSecret
     window.SanaliaStripe.mountPaymentElement({ clientSecret, container })
                                                       → monte le Payment Element
     window.SanaliaStripe.confirmPayment(returnUrl)   → confirme le PI, gère 3DS
   ========================================================= */

(function() {
  'use strict';

  var stripeInstance = null;
  var elementsInstance = null;
  var paymentElement = null;

  function init() {
    if (stripeInstance) return stripeInstance;
    if (!window.Stripe) {
      console.error('[Sanalia Stripe] Stripe.js non chargé');
      return null;
    }
    if (!window.STRIPE_PUBLISHABLE_KEY) {
      console.error('[Sanalia Stripe] STRIPE_PUBLISHABLE_KEY manquant');
      return null;
    }
    stripeInstance = window.Stripe(window.STRIPE_PUBLISHABLE_KEY, {
      locale: 'fr',
    });
    return stripeInstance;
  }

  // POST au webhook n8n create-payment-intent.
  // Body attendu côté n8n : { lead_id, amount, currency, email, name, description, metadata }
  // Réponse attendue : { clientSecret, paymentIntentId, customerId }
  async function createIntent(payload) {
    if (!window.STRIPE_INTENT_WEBHOOK) {
      throw new Error('STRIPE_INTENT_WEBHOOK manquant');
    }
    var res = await fetch(window.STRIPE_INTENT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
    });
    if (!res.ok) {
      var errText = '';
      try { errText = await res.text(); } catch (e) {}
      throw new Error('Webhook intent failed (' + res.status + ') ' + errText);
    }
    var data = await res.json();
    // Tolérant aux différents formats : { clientSecret } ou { client_secret } ou n8n malformé
    var clientSecret = data.clientSecret || data.client_secret;
    var paymentIntentId = data.paymentIntentId || data.payment_intent_id || data.id;
    var customerId = data.customerId || data.customer_id || data.customer;
    // Cas n8n malformé : la clé est une string JSON
    if (!clientSecret && typeof data === 'object') {
      var keys = Object.keys(data);
      if (keys.length === 1) {
        var v = data[keys[0]];
        if (v && typeof v === 'object') {
          clientSecret = v.clientSecret || v.client_secret;
          paymentIntentId = paymentIntentId || v.paymentIntentId || v.payment_intent_id || v.id;
          customerId = customerId || v.customerId || v.customer_id || v.customer;
        }
        try {
          var parsed = JSON.parse(keys[0]);
          if (parsed) {
            clientSecret = clientSecret || parsed.clientSecret || parsed.client_secret;
            paymentIntentId = paymentIntentId || parsed.paymentIntentId || parsed.payment_intent_id || parsed.id;
            customerId = customerId || parsed.customerId || parsed.customer_id || parsed.customer;
          }
        } catch (e) {}
      }
    }
    if (!clientSecret) {
      throw new Error('Réponse webhook sans clientSecret : ' + JSON.stringify(data).substring(0, 200));
    }
    return { clientSecret: clientSecret, paymentIntentId: paymentIntentId, customerId: customerId, raw: data };
  }

  // Monte le Payment Element dans le container DOM passé.
  // À appeler après createIntent (on a besoin du clientSecret).
  function mountPaymentElement(opts) {
    var stripe = init();
    if (!stripe) return null;
    var clientSecret = opts.clientSecret;
    var container = opts.container;
    if (!clientSecret || !container) {
      console.error('[Sanalia Stripe] clientSecret + container requis pour mount');
      return null;
    }

    // Démonte l'ancien Element s'il existe (re-mount au changement de PaymentIntent)
    if (paymentElement) {
      try { paymentElement.unmount(); } catch (e) {}
      paymentElement = null;
    }

    // Appearance alignée sur le design system Sanalia
    elementsInstance = stripe.elements({
      clientSecret: clientSecret,
      locale: 'fr',
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#635DDD',
          colorBackground: '#FFFFFF',
          colorText: '#0E052A',
          colorTextSecondary: '#666666',
          colorDanger: '#DC2626',
          fontFamily: 'Uxum, system-ui, sans-serif',
          fontSizeBase: '15px',
          spacingUnit: '4px',
          borderRadius: '12px',
        },
        rules: {
          '.Input': {
            border: '1.5px solid #E5E5E5',
            boxShadow: 'none',
            padding: '13px 16px',
          },
          '.Input:focus': {
            border: '1.5px solid #635DDD',
            boxShadow: '0 0 0 4px rgba(99,93,221,0.12)',
          },
          '.Label': {
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#666',
            fontWeight: '400',
          },
        },
      },
    });

    paymentElement = elementsInstance.create('payment', {
      layout: { type: 'tabs', defaultCollapsed: false },
      // Wallets activés automatiquement (Apple Pay / Google Pay si dispo navigateur).
    });
    paymentElement.mount(container);
    return paymentElement;
  }

  // Confirme le PaymentIntent. Gère 3DS via redirect ou modale Stripe.
  // Renvoie { ok: true, paymentIntent } sur succès.
  // Renvoie { ok: false, error } sur échec (carte refusée, etc.).
  async function confirmPayment(opts) {
    var stripe = init();
    if (!stripe || !elementsInstance) {
      return { ok: false, error: 'Stripe Elements non initialisé' };
    }
    opts = opts || {};
    var result = await stripe.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        // Stripe redirige ici après 3DS si un challenge est nécessaire.
        // On utilise return_url : Stripe ajoute payment_intent + payment_intent_client_secret.
        return_url: opts.returnUrl || window.location.href,
        receipt_email: opts.email || undefined,
      },
      // Si pas de redirect nécessaire (carte sans 3DS), on reste sur la page.
      redirect: 'if_required',
    });

    if (result.error) {
      return { ok: false, error: result.error.message || 'Paiement refusé', code: result.error.code };
    }
    // Pas d'erreur + pas de redirect : succès direct
    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      return { ok: true, paymentIntent: result.paymentIntent };
    }
    // Statut pending (rare en mode test)
    return { ok: true, paymentIntent: result.paymentIntent };
  }

  // Helper pour extraire le PaymentIntent depuis l'URL au retour de 3DS.
  // À appeler au mount de la page paiement : si l'URL a payment_intent + payment_intent_client_secret,
  // on récupère le statut et on déclenche le succès.
  async function checkRedirectStatus() {
    var params = new URLSearchParams(window.location.search);
    var clientSecret = params.get('payment_intent_client_secret');
    if (!clientSecret) return null;
    var stripe = init();
    if (!stripe) return null;
    try {
      var result = await stripe.retrievePaymentIntent(clientSecret);
      // Nettoie l'URL (sans recharger)
      var url = new URL(window.location.href);
      ['payment_intent', 'payment_intent_client_secret', 'redirect_status'].forEach(function(k) {
        url.searchParams.delete(k);
      });
      window.history.replaceState(null, '', url.toString());
      return result.paymentIntent;
    } catch (err) {
      console.warn('[Sanalia Stripe] retrievePaymentIntent error:', err);
      return null;
    }
  }

  window.SanaliaStripe = {
    init: init,
    createIntent: createIntent,
    mountPaymentElement: mountPaymentElement,
    confirmPayment: confirmPayment,
    checkRedirectStatus: checkRedirectStatus,
  };
})();

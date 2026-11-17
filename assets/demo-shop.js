/* =============================================================================
 *  ELAY HORECA — aperçu statique : panier et demande de devis fonctionnels
 * =============================================================================
 *  GitHub Pages ne peut pas exécuter PHP : le panier WooCommerce réel est
 *  inopérant sur l'aperçu. Ce script ajoute un panier local (localStorage) et
 *  un envoi de demande de devis par e-mail, pour que la démonstration soit
 *  utilisable. Le site WordPress déployé sur le serveur reste la référence.
 * ========================================================================== */
(function () {
  'use strict';

  var CLE = 'elay_horeca_panier_v1';
  var EMAIL = 'contact@elay-groupe.fr';

  function charger() {
    try { return JSON.parse(localStorage.getItem(CLE)) || []; }
    catch (e) { return []; }
  }
  function enregistrer(p) {
    try { localStorage.setItem(CLE, JSON.stringify(p)); } catch (e) {}
  }
  function euros(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
  }
  function nombre(txt) {
    if (!txt) return 0;
    // Format français : « 6 139,99 » (espaces/insécables comme séparateurs de milliers).
    var m = String(txt).replace(/\u00a0/g, ' ').match(/(\d[\d ]*[.,]\d{2})/);
    if (!m) return 0;
    var v = parseFloat(m[1].replace(/ /g, '').replace(',', '.'));
    return isNaN(v) ? 0 : v;
  }

  /* ---------------------------------------------------------------- toast -- */
  function toast(message) {
    var d = document.getElementById('delay-toast');
    if (!d) {
      d = document.createElement('div');
      d.id = 'delay-toast';
      d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
        'background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;font:14px system-ui;' +
        'z-index:99999;opacity:0;transition:opacity .2s;box-shadow:0 6px 24px rgba(0,0,0,.25)';
      document.body.appendChild(d);
    }
    d.textContent = message;
    d.style.opacity = '1';
    clearTimeout(d._t);
    d._t = setTimeout(function () { d.style.opacity = '0'; }, 2400);
  }

  /* ---------------------------------------------------------------- badge -- */
  function majBadge() {
    var n = charger().reduce(function (s, x) { return s + (x.qty || 0); }, 0);
    var b = document.getElementById('delay-badge');
    if (!b) {
      b = document.createElement('a');
      b.id = 'delay-badge';
      b.href = 'panier.html';
      b.style.cssText = 'position:fixed;right:18px;bottom:18px;background:#b91c1c;color:#fff;' +
        'text-decoration:none;padding:12px 16px;border-radius:999px;font:600 14px system-ui;' +
        'z-index:99998;box-shadow:0 6px 20px rgba(0,0,0,.25)';
      document.body.appendChild(b);
    }
    b.textContent = '🛒 Panier (' + n + ')';
    b.style.display = n > 0 ? 'block' : 'none';
  }

  /* --------------------------------------------------------- ajout panier -- */
  function produitDepuis(el) {
    var form = el.tagName === 'FORM' ? el : el.closest('form');
    var carte = el.closest('.elay-product-card') ||
                (form && form.closest('.elay-product-card')) ||
                (form && form.closest('.product')) ||
                document;
    var champId = (form && form.querySelector('[name="add-to-cart"]')) ||
                  (form && form.querySelector('[name="product_id"]'));
    var id = champId ? champId.value : '';
    if (!id && carte.className) {
      var m = String(carte.className).match(/post-(\d+)/);
      if (m) id = m[1];
    }
    if (!id) id = 'p-' + (location.pathname.split('/').pop() || 'index');

    var titre = carte.querySelector('.product_title, .elay-product__title, h1, h2, h3');
    var nom = titre ? titre.textContent.trim() : document.title;

    // Le bloc prix contient l'ancien prix, le HT et le TTC : on prend le HT courant.
    var prixEl = carte.querySelector('.elay-price__ht') ||
                 carte.querySelector('.elay-product__price, .price');
    var prix = prixEl ? nombre(prixEl.textContent) : 0;

    var q = form && form.querySelector('[name="quantity"]');
    var qte = q ? Math.max(1, parseInt(q.value, 10) || 1) : 1;

    return { id: String(id), nom: nom, prix: prix, qty: qte };
  }

  function ajouter(p) {
    var panier = charger();
    var existant = null;
    for (var i = 0; i < panier.length; i++) if (panier[i].id === p.id) existant = panier[i];
    if (existant) existant.qty += p.qty;
    else panier.push(p);
    enregistrer(panier);
    majBadge();
    toast('« ' + p.nom + ' » ajouté au panier');
  }

  /* ------------------------------------------------------ page d'accueil -- */
  function brancherAjout() {
    document.addEventListener('submit', function (ev) {
      var f = ev.target;
      if (!f || f.tagName !== 'FORM') return;
      var bouton = f.querySelector('[name="add-to-cart"]');
      if (!bouton) return;
      ev.preventDefault();
      ajouter(produitDepuis(f));
    }, true);

    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a.add_to_cart_button, a.single_add_to_cart_button');
      if (!a) return;
      ev.preventDefault();
      ajouter(produitDepuis(a));
    }, true);
  }

  /* -------------------------------------------------------- page panier -- */
  function rendrePanier() {
    var vide = document.querySelector('.cart-empty');
    if (!vide) return;

    var panier = charger();
    var conteneur = vide.closest('form') || vide.closest('.woocommerce') || vide.parentNode;

    if (!panier.length) {
      var info = document.querySelector('.wc-empty-cart-message');
      if (info) info.textContent = "Votre panier est vide. Ajoutez un produit depuis la boutique pour l'essayer ici.";
      return;
    }

    var total = panier.reduce(function (s, x) { return s + (x.prix * x.qty); }, 0);
    var lignes = panier.map(function (x, i) {
      return '<tr>' +
        '<td style="padding:10px">' + x.nom + '</td>' +
        '<td style="padding:10px;text-align:center">' +
          '<button data-moins="' + i + '" style="padding:2px 8px">−</button> ' +
          '<strong>' + x.qty + '</strong> ' +
          '<button data-plus="' + i + '" style="padding:2px 8px">+</button>' +
        '</td>' +
        '<td style="padding:10px;text-align:right">' + euros(x.prix) + '</td>' +
        '<td style="padding:10px;text-align:right">' + euros(x.prix * x.qty) + '</td>' +
        '<td style="padding:10px;text-align:right">' +
          '<button data-suppr="' + i + '" style="color:#b91c1c;background:none;border:0;cursor:pointer">Retirer</button>' +
        '</td></tr>';
    }).join('');

    var bloc = document.createElement('div');
    bloc.innerHTML =
      '<h2 style="margin:18px 0 12px">Votre panier</h2>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:16px">' +
        '<thead><tr style="text-align:left;border-bottom:2px solid #e5e7eb">' +
          '<th style="padding:10px">Produit</th><th style="padding:10px;text-align:center">Quantité</th>' +
          '<th style="padding:10px;text-align:right">Prix unitaire</th>' +
          '<th style="padding:10px;text-align:right">Total</th><th></th>' +
        '</tr></thead><tbody>' + lignes + '</tbody>' +
      '</table>' +
      '<p style="text-align:right;font-size:1.25em;font-weight:600">Total HT : ' + euros(total) + '</p>' +
      '<p style="text-align:right">' +
        '<a href="devis.html" style="background:#b91c1c;color:#fff;padding:14px 26px;border-radius:6px;' +
        'text-decoration:none;font-weight:600;display:inline-block">Demander un devis pour ce panier</a>' +
      '</p>';

    conteneur.parentNode.insertBefore(bloc, conteneur);
    conteneur.style.display = 'none';

    bloc.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var p = charger();
      if (b.dataset.plus !== undefined) { p[+b.dataset.plus].qty++; }
      else if (b.dataset.moins !== undefined) {
        var i = +b.dataset.moins;
        if (p[i].qty > 1) p[i].qty--; else p.splice(i, 1);
      } else if (b.dataset.suppr !== undefined) { p.splice(+b.dataset.suppr, 1); }
      enregistrer(p);
      location.reload();
    });
  }

  /* -------------------------------------------------------- page devis -- */
  function textePanier() {
    var panier = charger();
    if (!panier.length) return '';
    var total = 0;
    var l = panier.map(function (x) {
      total += x.prix * x.qty;
      return '  • ' + x.nom + ' — ' + x.qty + ' × ' + euros(x.prix) + ' = ' + euros(x.prix * x.qty);
    }).join('\n');
    return '\n\nArticles de mon panier :\n' + l + '\n  TOTAL HT : ' + euros(total) + '\n';
  }

  function brancherDevis() {
    var f = document.querySelector('form.elay-devis__form');
    if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var vals = [];
      Array.prototype.forEach.call(f.querySelectorAll('input, textarea, select'), function (c) {
        if (c.type === 'hidden' || c.type === 'submit' || c.type === 'button') return;
        if (c.type === 'checkbox' || c.type === 'radio') {
          if (c.checked) vals.push(c.name + ' : ' + (c.value || 'oui'));
          return;
        }
        if (!c.value) return;
        var lab = c.closest('p, div, li');
        var lbl = '';
        if (lab) {
          var el = lab.querySelector('label');
          if (el) lbl = el.textContent.replace(/\s*\*$/, '').trim();
        }
        vals.push((lbl || c.name) + ' : ' + c.value);
      });

      var corps = 'Bonjour,\n\nJe souhaite recevoir un devis.\n\n' + vals.join('\n') + textePanier() +
        '\n\n— Demande envoyée depuis l\'aperçu du site ELAY HORECA.';
      var lien = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent('Demande de devis — ELAY HORECA') +
        '&body=' + encodeURIComponent(corps);

      toast('Ouverture de votre logiciel de messagerie…');
      // Point d'observation (diagnostic / tests automatisés).
      try { window.__elayDernierDevis = lien; } catch (e) {}
      window.location.href = lien;
    });
  }

  /* ------------------------------------------------------------- départ -- */
  document.addEventListener('DOMContentLoaded', function () {
    brancherAjout();
    rendrePanier();
    brancherDevis();
    majBadge();
  });
})();

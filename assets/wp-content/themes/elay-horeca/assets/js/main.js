/**
 * ELAY HORECA — interactions du thème.
 * Vanilla JS, sans dépendance.
 */
(function () {
	'use strict';

	var doc = document;

	function $(selector, ctx) {
		return (ctx || doc).querySelector(selector);
	}

	function $$(selector, ctx) {
		return Array.prototype.slice.call((ctx || doc).querySelectorAll(selector));
	}

	/* ------------------------------------------------------------------
	 * En-tête collant
	 * ------------------------------------------------------------------ */
	var header = $('#elay-header');
	var lastScroll = 0;

	function onScroll() {
		if (!header) {
			return;
		}
		var y = window.pageYOffset || doc.documentElement.scrollTop;
		header.classList.toggle('is-scrolled', y > 8);
		lastScroll = y;
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();

	/* ------------------------------------------------------------------
	 * Menu mobile + panneau de filtres
	 * ------------------------------------------------------------------ */
	var burger = $('.elay-burger');
	var mobileNav = $('#elay-mobile-nav');
	var overlay = $('.elay-overlay');
	var filters = $('#elay-filters');
	var filterToggle = $('.elay-filter-toggle');
	var mobileClose = $('.elay-mobile-nav__close');

	function setOverlay(show) {
		if (!overlay) {
			return;
		}
		if (show) {
			overlay.hidden = false;
			requestAnimationFrame(function () {
				overlay.classList.add('is-visible');
			});
		} else {
			overlay.classList.remove('is-visible');
			setTimeout(function () {
				if (!overlay.classList.contains('is-visible')) {
					overlay.hidden = true;
				}
			}, 240);
		}
	}

	function openMobileNav() {
		if (!mobileNav || !burger) {
			return;
		}
		mobileNav.hidden = false;
		requestAnimationFrame(function () {
			mobileNav.classList.add('is-open');
		});
		burger.setAttribute('aria-expanded', 'true');
		doc.body.style.overflow = 'hidden';
		setOverlay(true);
		var firstLink = mobileNav.querySelector('a, button');
		if (firstLink) {
			firstLink.focus({ preventScroll: true });
		}
	}

	function closeMobileNav() {
		if (!mobileNav || !burger) {
			return;
		}
		mobileNav.classList.remove('is-open');
		burger.setAttribute('aria-expanded', 'false');
		doc.body.style.overflow = '';
		setOverlay(false);
		setTimeout(function () {
			if (!mobileNav.classList.contains('is-open')) {
				mobileNav.hidden = true;
			}
		}, 240);
	}

	function openFilters() {
		if (!filters || !filterToggle) {
			return;
		}
		filters.classList.add('is-open');
		filterToggle.setAttribute('aria-expanded', 'true');
		doc.body.style.overflow = 'hidden';
		setOverlay(true);
		var el = filters.querySelector('a, input, button');
		if (el) {
			el.focus({ preventScroll: true });
		}
	}

	function closeFilters() {
		if (!filters || !filterToggle) {
			return;
		}
		filters.classList.remove('is-open');
		filterToggle.setAttribute('aria-expanded', 'false');
		doc.body.style.overflow = '';
		setOverlay(false);
	}

	if (burger) {
		burger.addEventListener('click', function () {
			if (burger.getAttribute('aria-expanded') === 'true') {
				closeMobileNav();
			} else {
				openMobileNav();
			}
		});
	}

	if (mobileClose) {
		mobileClose.addEventListener('click', closeMobileNav);
	}

	if (filterToggle) {
		filterToggle.addEventListener('click', function () {
			if (filterToggle.getAttribute('aria-expanded') === 'true') {
				closeFilters();
			} else {
				openFilters();
			}
		});
	}

	if (overlay) {
		overlay.addEventListener('click', function () {
			closeMobileNav();
			closeFilters();
		});
	}

	doc.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closeMobileNav();
			closeFilters();
		}
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth > 1024) {
			closeFilters();
		}
		if (window.innerWidth > 1024) {
			closeMobileNav();
		}
	});

	/* ------------------------------------------------------------------
	 * Bouton « ajouter au panier » : retour visuel
	 * ------------------------------------------------------------------ */
	doc.addEventListener('click', function (e) {
		var btn = e.target.closest('.add_to_cart_button');
		if (!btn) {
			return;
		}
		btn.classList.add('is-loading');
		setTimeout(function () {
			btn.classList.remove('is-loading');
			btn.classList.add('is-added');
			setTimeout(function () {
				btn.classList.remove('is-added');
			}, 1400);
		}, 900);
	});

	/* ------------------------------------------------------------------
	 * FAQ : une seule ouverte à la fois (confort de lecture)
	 * ------------------------------------------------------------------ */
	$$('.elay-faq').forEach(function (item) {
		item.addEventListener('toggle', function () {
			if (item.open) {
				$$('.elay-faq').forEach(function (other) {
					if (other !== item && other.open) {
						other.open = false;
					}
				});
			}
		});
	});
})();

/* SKMS — shared behaviour. Loaded with defer on every page. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Mobile navigation ---------------- */
  function initNav() {
    var toggle = document.querySelector('.mobile-menu');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var icon = toggle.querySelector('i');
      if (icon) icon.className = open ? 'fas fa-xmark' : 'fas fa-bars';
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains('is-open'));
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---------------- Header shadow on scroll ---------------- */
  function initHeader() {
    var header = document.querySelector('header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- One entrance animation ---------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Blog filtering and search ---------------- */
  function initBlogFilter() {
    var grid = document.getElementById('blogGrid');
    if (!grid) return;

    var buttons = document.querySelectorAll('.category-btn');
    var search = document.getElementById('searchInput');
    var empty = document.getElementById('noResults');
    var cards = grid.querySelectorAll('[data-category]');
    var category = 'all';

    function apply() {
      var term = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;

      cards.forEach(function (card) {
        var matchesCat = category === 'all' || card.dataset.category === category;
        var matchesTerm = !term || (card.dataset.search || '').indexOf(term) !== -1;
        var visible = matchesCat && matchesTerm;
        card.classList.toggle('is-filtered', !visible);
        if (visible) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        category = btn.dataset.category;
        apply();
      });
    });

    if (search) {
      var timer;
      search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 120);
      });
    }
  }

  /* ---------------- Contact form ---------------- */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');

    function show(kind, message) {
      if (!status) return;
      status.className = 'form-status is-visible ' + kind;
      status.textContent = message;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim()
      };

      if (!data.name || !data.email || !data.message) {
        show('error', 'Please complete your name, email address and message.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        show('error', 'That email address does not look right. Please check it.');
        return;
      }

      var original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json().catch(function () { return {}; });
      }).then(function () {
        form.reset();
        show('success', 'Thank you. Your message has been sent and we will respond within one business day.');
      }).catch(function () {
        show('error', 'That did not send. Please email anaidoo.skms@gmail.com or call +27 65 895 4832.');
      }).finally(function () {
        button.disabled = false;
        button.innerHTML = original;
      });
    });
  }

  function init() {
    initNav();
    initHeader();
    initReveal();
    initBlogFilter();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

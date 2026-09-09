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
        setOpen(false); toggle.focus();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---------------- Header state on scroll ---------------- */
  function initHeader() {
    var header = document.querySelector('header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- Scroll reveals ---------------- */
  var REVEAL = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade, .reveal-blur, .section-title';

  function initReveal() {
    var items = document.querySelectorAll(REVEAL);
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
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Counting stat numbers ---------------- */
  function countUp(el) {
    var target = el.dataset.count || el.textContent;
    var match = String(target).match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!match) return;

    var prefix = match[1];
    var suffix = match[3];
    var raw = match[2].replace(/,/g, '');
    var value = parseFloat(raw);
    var decimals = (raw.split('.')[1] || '').length;
    if (isNaN(value)) return;

    var duration = 1600;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + (value * eased).toFixed(decimals) + suffix;
      if (progress < 1) window.requestAnimationFrame(frame);
      else el.textContent = prefix + match[2] + suffix;
    }
    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var nums = document.querySelectorAll('.stat-number[data-count]');
    if (!nums.length) return;
    if (reduced || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Reading progress (article pages) ---------------- */
  function initReadingProgress() {
    var bar = document.getElementById('readingProgress');
    var article = document.querySelector('.post-content');
    if (!bar || !article) return;

    var ticking = false;
    function update() {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var scrolled = -rect.top;
      var pct = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
      bar.style.width = (pct * 100) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------- Share buttons ---------------- */
  function initShare() {
    var buttons = document.querySelectorAll('.share-btn[data-share]');
    if (!buttons.length) return;

    var url = window.location.href;
    var title = document.title;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.dataset.share;
        var target = '';

        if (kind === 'facebook') {
          target = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
        } else if (kind === 'twitter') {
          target = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) +
                   '&text=' + encodeURIComponent(title);
        } else if (kind === 'linkedin') {
          target = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
        } else if (kind === 'whatsapp') {
          target = 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url);
        }

        if (target) {
          window.open(target, '_blank', 'noopener,width=640,height=560');
          return;
        }

        // Copy link
        var done = function () {
          var icon = btn.querySelector('i');
          var prev = icon.className;
          icon.className = 'fas fa-check';
          btn.classList.add('is-copied');
          setTimeout(function () {
            icon.className = prev;
            btn.classList.remove('is-copied');
          }, 1800);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(done).catch(function () {});
        } else {
          var tmp = document.createElement('textarea');
          tmp.value = url;
          tmp.setAttribute('readonly', '');
          tmp.style.position = 'absolute';
          tmp.style.left = '-9999px';
          document.body.appendChild(tmp);
          tmp.select();
          try { document.execCommand('copy'); done(); } catch (err) {}
          document.body.removeChild(tmp);
        }
      });
    });
  }

  /* ---------------- Blog filtering and search ---------------- */
  function initBlogFilter() {
    var grid = document.getElementById('blogGrid');
    if (!grid) return;

    var buttons = document.querySelectorAll('.category-btn');
    var search = document.getElementById('searchInput');
    var empty = document.getElementById('noResults');
    var featured = document.querySelector('.featured-post');
    var cards = grid.querySelectorAll('[data-category]');
    var category = 'all';

    function apply() {
      var term = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;

      cards.forEach(function (card) {
        var okCat = category === 'all' || card.dataset.category === category;
        var okTerm = !term || (card.dataset.search || '').indexOf(term) !== -1;
        var visible = okCat && okTerm;
        card.classList.toggle('is-filtered', !visible);
        if (visible) shown++;
      });

      if (featured) {
        var fCat = category === 'all' || featured.dataset.category === category;
        var fTerm = !term || (featured.dataset.search || '').indexOf(term) !== -1;
        var fVisible = fCat && fTerm;
        featured.classList.toggle('is-filtered', !fVisible);
        if (fVisible) shown++;
      }

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
    initCounters();
    initReadingProgress();
    initShare();
    initBlogFilter();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

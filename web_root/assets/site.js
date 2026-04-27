// Hyams Auto — site JS (mobile menu, active link, lead form)
(function () {
  // ----- Mobile menu -----
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ----- Reviews carousel -----
  const RC_BRAND = {
    google: '<svg class="rc-brand" viewBox="0 0 18 18" aria-hidden="true"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" fill="#4285f4"/><path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34a853"/><path d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#fbbc05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#ea4335"/></svg>',
    facebook: '<svg class="rc-brand" viewBox="0 0 18 18" aria-hidden="true"><path d="M18 9a9 9 0 1 0-10.4 8.89v-6.29H5.31V9h2.29V7.01c0-2.27 1.35-3.52 3.41-3.52.99 0 2.02.18 2.02.18v2.22h-1.14c-1.12 0-1.47.7-1.47 1.41V9h2.5l-.4 2.6h-2.1v6.29A9 9 0 0 0 18 9z" fill="#1877f2"/></svg>',
  };
  const RC_LABEL = { google: 'Google', facebook: 'Facebook' };
  const rcEscape = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rcRelDate = (iso) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (!t) return '';
    const days = Math.floor((Date.now() - t) / 86400000);
    if (days < 14) return days <= 1 ? 'a day ago' : `${days} days ago`;
    if (days < 60) return `${Math.round(days / 7)} weeks ago`;
    const months = Math.round(days / 30);
    if (months < 12) return months === 1 ? 'a month ago' : `${months} months ago`;
    const years = Math.floor(days / 365);
    return years === 1 ? 'a year ago' : `${years} years ago`;
  };

  document.querySelectorAll('[data-reviews]').forEach((root) => {
    const track = root.querySelector('.rc-track');
    const prev = root.querySelector('.rc-prev');
    const next = root.querySelector('.rc-next');
    const dotsBox = root.querySelector('[data-rc-dots]');
    const searchInput = root.querySelector('[data-rc-search]');
    const chips = root.querySelectorAll('[data-rc-filter]');
    const sortBtn = root.querySelector('[data-rc-sort-btn]');
    const sortMenu = root.querySelector('[data-rc-sort-menu]');
    const sortLabel = root.querySelector('[data-rc-sort-label]');
    const sortOpts = root.querySelectorAll('[data-rc-sort-opt]');
    const empty = root.querySelector('[data-rc-empty]');
    const dataNode = root.querySelector('[data-rc-data]');
    if (!track) return;

    if (dataNode) {
      let reviews = [];
      try { reviews = JSON.parse(dataNode.textContent); } catch (e) { reviews = []; }
      const html = reviews.map((r) => {
        const src = (r.source || '').toLowerCase();
        const brand = RC_BRAND[src] || '';
        const label = RC_LABEL[src] || src;
        const rel = rcRelDate(r.date);
        const iso = r.date || '';
        const dateHTML = rel
          ? `<time class="rc-date" datetime="${rcEscape(iso)}">${rcEscape(rel)}</time>`
          : '';
        return `<article class="rc-card" data-source="${rcEscape(src)}" data-name="${rcEscape(r.name)}" data-date="${rcEscape(iso)}">`
          + `<span class="rc-source" title="${rcEscape(label)} review" aria-label="From ${rcEscape(label)}">${brand}</span>`
          + `<span class="rc-stars" aria-label="5 out of 5 stars">★★★★★</span>`
          + `<blockquote>${rcEscape(r.text)}</blockquote>`
          + `<footer><strong>${rcEscape(r.name)}</strong>${dateHTML}</footer>`
          + `</article>`;
      }).join('');
      if (empty) empty.insertAdjacentHTML('beforebegin', html);
      else track.insertAdjacentHTML('afterbegin', html);
    }

    const allCards = Array.from(track.querySelectorAll('.rc-card'));
    if (!allCards.length) return;

    const cardData = allCards.map((c, i) => ({
      el: c,
      order: i,
      source: (c.dataset.source || '').toLowerCase(),
      name: (c.dataset.name || '').toLowerCase(),
      date: c.dataset.date ? new Date(c.dataset.date).getTime() : 0,
      text: (c.querySelector('blockquote')?.textContent || '').toLowerCase(),
    }));

    // Populate counts on chips
    const counts = { all: cardData.length, google: 0, facebook: 0 };
    cardData.forEach((d) => { if (counts[d.source] !== undefined) counts[d.source]++; });
    root.querySelectorAll('[data-rc-count]').forEach((el) => {
      const k = el.dataset.rcCount;
      if (counts[k] !== undefined) el.textContent = counts[k];
    });

    let activeFilter = 'all';
    let query = '';
    let sortMode = 'featured';

    const visibleCards = () => allCards.filter((c) => !c.hidden);

    const step = () => {
      const vis = visibleCards();
      if (vis.length < 2) return track.clientWidth;
      const a = vis[0].getBoundingClientRect();
      const b = vis[1].getBoundingClientRect();
      return b.left - a.left;
    };

    const applySort = () => {
      const sorted = cardData.slice();
      if (sortMode === 'newest') sorted.sort((a, b) => b.date - a.date || a.order - b.order);
      else if (sortMode === 'oldest') sorted.sort((a, b) => a.date - b.date || a.order - b.order);
      else if (sortMode === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
      else sorted.sort((a, b) => a.order - b.order);
      sorted.forEach((d) => track.appendChild(d.el));
    };

    const applyFilter = () => {
      cardData.forEach((d) => {
        const matchSource = activeFilter === 'all' || d.source === activeFilter;
        const matchQuery = !query || d.text.includes(query) || d.name.includes(query);
        d.el.hidden = !(matchSource && matchQuery);
      });
      const has = visibleCards().length > 0;
      if (empty) empty.hidden = has;
      applySort();
      track.scrollTo({ left: 0, behavior: 'auto' });
      buildDots();
      update();
    };

    const buildDots = () => {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      visibleCards().forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to review ${i + 1}`);
        b.addEventListener('click', () => track.scrollTo({ left: step() * i, behavior: 'smooth' }));
        dotsBox.appendChild(b);
      });
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => {
          c.classList.remove('is-active');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('is-active');
        chip.setAttribute('aria-selected', 'true');
        activeFilter = chip.dataset.rcFilter;
        applyFilter();
      });
    });

    if (searchInput) {
      let t;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          query = searchInput.value.trim().toLowerCase();
          applyFilter();
        }, 120);
      });
    }

    if (sortBtn && sortMenu) {
      const closeMenu = () => {
        sortMenu.hidden = true;
        sortBtn.setAttribute('aria-expanded', 'false');
      };
      const openMenu = () => {
        sortMenu.hidden = false;
        sortBtn.setAttribute('aria-expanded', 'true');
      };
      sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sortMenu.hidden ? openMenu() : closeMenu();
      });
      document.addEventListener('click', (e) => {
        if (!sortMenu.hidden && !root.contains(e.target)) closeMenu();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sortMenu.hidden) {
          closeMenu();
          sortBtn.focus();
        }
      });
      sortOpts.forEach((opt) => {
        opt.addEventListener('click', () => {
          sortMode = opt.dataset.rcSortOpt;
          sortOpts.forEach((o) => o.setAttribute('aria-selected', o === opt ? 'true' : 'false'));
          if (sortLabel) sortLabel.textContent = opt.textContent.trim();
          closeMenu();
          applyFilter();
        });
      });
    }

    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 1;
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft >= max || max <= 0;
      if (dotsBox) {
        const idx = Math.round(track.scrollLeft / Math.max(step(), 1));
        dotsBox.querySelectorAll('button').forEach((d, i) => d.classList.toggle('is-active', i === idx));
      }
    };
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    buildDots();
    update();
  });

  // ----- Active nav link -----
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const target = href.replace(/\/$/, '') || '/';
    if (target === path) a.classList.add('active');
  });

  // ----- Lead form -----
  const form = document.getElementById('lead-form');
  if (!form) return;

  const tabs = form.parentElement.querySelectorAll('.form-tab');
  const submitBtn = form.querySelector('.form-submit');
  const submitLabel = form.querySelector('.btn-label');
  const spinner = form.querySelector('.spinner');
  const statusEl = form.querySelector('.form-status');
  const modeInput = form.querySelector('input[name="mode"]');
  const dateInput = form.querySelector('#f-date');
  const altDateInput = form.querySelector('#f-alt-date');

  // Default the date to tomorrow
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    dateInput.min = minDate;
    if (altDateInput) altDateInput.min = minDate;
  }

  // Read ?mode=message to deep-link from CTAs
  const params = new URLSearchParams(location.search);
  const initialMode = params.get('mode') === 'message' ? 'message' : 'appointment';
  setMode(initialMode);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  function setMode(mode) {
    form.dataset.mode = mode;
    modeInput.value = mode;
    tabs.forEach((t) => {
      const active = t.dataset.mode === mode;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    submitLabel.textContent = mode === 'appointment' ? 'Send request' : 'Send message';
  }

  // Phone formatting (US 10-digit)
  const phoneInput = form.querySelector('#f-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
      if (digits.length === 0) return (e.target.value = '');
      if (digits.length < 4) return (e.target.value = `(${digits}`);
      if (digits.length < 7) return (e.target.value = `(${digits.slice(0, 3)}) ${digits.slice(3)}`);
      e.target.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.className = 'form-status';
    statusEl.textContent = '';

    if (!validate()) return;

    setBusy(true);

    const data = Object.fromEntries(new FormData(form).entries());
    data.submittedAt = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    data.referrer = document.referrer || '';
    data.page = location.pathname;

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Server returned ${res.status}`);
      }
      let json = null;
      try { json = await res.clone().json(); } catch {}
      statusEl.classList.add('is-success');
      const mockBadge = json && json.mock
        ? '<div style="margin-top:8px;font-size:.82rem;color:#5b6056;">(demo mode — no email/SMS sent; lead saved for review)</div>'
        : '';
      statusEl.innerHTML = (data.mode === 'appointment'
        ? '<strong>Got it.</strong> We received your request and will call you back to confirm your slot, usually same business day.'
        : '<strong>Message received.</strong> We&rsquo;ll get back to you soon. For anything urgent, give us a ring at <a href="tel:+15137954171">(513) 795-4171</a>.'
      ) + mockBadge;
      form.reset();
      setMode(data.mode);
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sent';
      spinner.style.display = 'none';
      statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      statusEl.classList.add('is-error');
      statusEl.innerHTML = 'We couldn’t send that. Please try again, or call <a href="tel:+15137954171">(513) 795-4171</a>.';
      setBusy(false);
    }
  });

  function validate() {
    let ok = true;
    form.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));
    const required = ['name', 'phone'];
    required.forEach((n) => {
      const el = form.querySelector(`[name="${n}"]`);
      if (el && !el.value.trim()) {
        el.closest('.field').classList.add('invalid');
        ok = false;
      }
    });
    const phoneEl = form.querySelector('[name="phone"]');
    if (phoneEl && phoneEl.value && phoneEl.value.replace(/\D/g, '').length < 10) {
      phoneEl.closest('.field').classList.add('invalid');
      ok = false;
    }
    const notesEl = form.querySelector('[name="notes"]');
    if (form.dataset.mode === 'message' && notesEl && !notesEl.value.trim()) {
      notesEl.closest('.field').classList.add('invalid');
      ok = false;
    }
    if (!ok) {
      statusEl.classList.add('is-error');
      statusEl.textContent = 'Please fill in the highlighted fields.';
    }
    return ok;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    spinner.style.display = busy ? 'inline-block' : 'none';
  }
})();

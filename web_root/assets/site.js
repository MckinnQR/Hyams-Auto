// Hyams Auto — minimal site JS (mobile menu + active link highlight)
(function () {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const target = href.replace(/\/$/, '') || '/';
    if (target === path) a.classList.add('active');
  });
})();

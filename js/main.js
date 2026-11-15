const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ── hero intro + 3D logo ── */
requestAnimationFrame(() => root.classList.add('is-loaded'));

(async () => {
  const canvas = $('#logoCanvas');
  try {
    const { initLogo3D } = await import('./logo3d.js');
    await initLogo3D({ canvas, stage: $('#logoStage'), hero: $('#hero'), reduced });
    root.classList.add('gl-ready');
  } catch (err) {
    // No WebGL (or it failed): the flat logo already in the page stays visible.
    canvas.remove();
    console.warn('3D logo unavailable, showing the flat logo instead.', err);
  }
})();

/* ── nav ── */
const nav = $('#nav');
const toggle = $('#navToggle');
const links = $('#navLinks');
let lastY = 0;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-stuck', y > 40);
  const open = links.classList.contains('is-open');
  nav.classList.toggle('is-hidden', !open && y > lastY && y > window.innerHeight * 0.9);
  lastY = y;
  for (const el of parallax) {
    const r = el.parentElement.getBoundingClientRect();
    el.style.transform = `translate3d(0, ${(r.top * Number(el.dataset.parallax)).toFixed(1)}px, 0) rotate(${(r.top * 0.006).toFixed(2)}deg)`;
  }
}
const parallax = reduced ? [] : $$('[data-parallax]');
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  links.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.body.style.overflow = open ? 'hidden' : '';
}
toggle.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// highlight the section you are in
const navMap = new Map($$('a', links).map((a) => [a.getAttribute('href').slice(1), a]));
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navMap.forEach((a) => a.classList.remove('is-current'));
    navMap.get(e.target.id)?.classList.add('is-current');
  }
}, { rootMargin: '-45% 0px -50% 0px' });
navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

/* ── scroll reveals, staggered among siblings ── */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
for (const el of $$('[data-reveal]')) {
  const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--delay', `${Math.min(sibs.indexOf(el), 6) * 0.09}s`);
  io.observe(el);
}

/* ── count-up stats ── */
const counter = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    counter.unobserve(e.target);
    const end = Number(e.target.dataset.count);
    if (reduced) continue;
    const start = end > 100 ? end - 40 : 0;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 1600);
      e.target.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => counter.observe(el));

/* ── birria cards: glow follows the pointer ── */
for (const card of $$('.card')) {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

/* ── menu tabs ── */
const tabs = $$('.tab');
function selectTab(tab, focus = false) {
  for (const t of tabs) {
    const on = t === tab;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !on;
    panel.classList.toggle('is-active', on);
  }
  if (focus) tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    selectTab(tabs[(i + dir + tabs.length) % tabs.length], true);
  });
});
$$('.panel').forEach((p) => $$('.dish', p).forEach((d, i) => d.style.setProperty('--i', i)));

/* ── papel picado ── */
const picado = $('#picado');
if (picado) {
  const colors = ['var(--rosa)', 'var(--cobre)', 'var(--wine)', 'var(--oxblood)', 'var(--mauve)'];
  const n = Math.ceil(window.innerWidth / 72) + 2;
  picado.innerHTML = Array.from({ length: Math.min(n, 30) }, (_, i) =>
    `<i style="--c:${colors[i % colors.length]};--d:${(-(i * 0.37) % 4.6).toFixed(2)}s"></i>`).join('');
}

/* ── today's hours (restaurant local time) ── */
try {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Chicago' }).format(new Date());
  const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
  $$('#hours tr').forEach((tr) => tr.classList.toggle('is-today', tr.dataset.days.split(',').includes(String(idx))));
} catch { /* leave hours unhighlighted */ }

$('#year').textContent = new Date().getFullYear();

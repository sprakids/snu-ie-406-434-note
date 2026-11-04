/* Runs in the head so a saved theme is applied before the first paint. */
(() => {
  'use strict';
  const root = document.documentElement, key = 'snu-ie-theme-v1';
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let saved = null, timer;
  const valid = value => value === 'light' || value === 'dark';
  try { const value = localStorage.getItem(key); if (valid(value)) saved = value; } catch {}
  let initial = saved || (preference.matches ? 'dark' : 'light');
  try { if (window.parent !== window && valid(window.parent.document.documentElement.dataset.theme)) initial = window.parent.document.documentElement.dataset.theme; } catch {}
  function apply(theme, animate = false) {
    if (!valid(theme)) return;
    if (animate && root.dataset.theme !== theme && !reduced.matches) {
      root.classList.add('theme-changing'); clearTimeout(timer);
      timer = setTimeout(() => root.classList.remove('theme-changing'), 550);
    }
    root.dataset.theme = theme; root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141515' : '#19398a');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-checked', String(theme === 'dark'));
      button.title = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
    });
    for (const frame of document.querySelectorAll('iframe')) frame.contentWindow?.postMessage({ type: 'ie-theme', theme }, location.origin);
  }
  apply(initial);
  document.addEventListener('DOMContentLoaded', () => { apply(root.dataset.theme); root.classList.add('theme-ready'); });
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-theme-toggle]');
    if (!button) return;
    saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, saved); } catch {}
    apply(saved, true);
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    saved = valid(event.newValue) ? event.newValue : null;
    apply(saved || (preference.matches ? 'dark' : 'light'), true);
  });
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === window.parent && window.parent !== window && event.data?.type === 'ie-theme' && valid(event.data.theme)) apply(event.data.theme, true);
  });
  preference.addEventListener('change', () => { if (!saved) apply(preference.matches ? 'dark' : 'light', true); });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { const value = localStorage.getItem(key); saved = valid(value) ? value : null; } catch {}
    apply(saved || (preference.matches ? 'dark' : 'light'));
  });
})();

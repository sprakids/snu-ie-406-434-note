/* Decorative pointer effects only: no value, keyboard, focus or storage writes. */
(() => {
  'use strict';
  const selector = 'button:not([data-theme-toggle]),.book-button,.card-actions a,.site-header nav a,.chapter-tabs a,.info-nav a,.info-header nav a,.button-link,.campus-multi .statement';
  const groupSelector = '.tabs,.chapter-tabs,.info-nav,.campus-note .nav,.preset-list,.choices';
  const attached = new WeakSet();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  function attach(element) {
    if (attached.has(element)) return;
    attached.add(element);
    element.setAttribute('data-glass', '');
    element.addEventListener('pointerenter', event => {
      if (reduced.matches || !canHover.matches || event.pointerType !== 'mouse' || element.disabled || element.getAttribute('aria-disabled') === 'true') return;
      const bounds = element.getBoundingClientRect();
      element.style.setProperty('--water-x', (event.clientX - bounds.left) + 'px');
      element.style.setProperty('--water-y', (event.clientY - bounds.top) + 'px');
      element.classList.add('water-drop');
    }, { passive: true });
    element.addEventListener('pointerleave', () => element.classList.remove('water-drop'), { passive: true });
    element.addEventListener('animationend', event => {
      if (event.animationName === 'campus-water-drop') element.classList.remove('water-drop');
    });
  }
  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.matches(groupSelector)) root.setAttribute('data-glass-group', '');
    root.querySelectorAll(groupSelector).forEach(group => group.setAttribute('data-glass-group', ''));
    if (root.matches(selector)) attach(root);
    root.querySelectorAll(selector).forEach(attach);
  }
  scan(document.body);
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) scan(node);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

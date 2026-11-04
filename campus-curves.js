/* Native squircles when supported; G2 cubic outlines for other engines.
   Each cubic repeats the corner control point, making curvature zero where
   it joins a straight edge. Decoration never replaces a study/input node. */
(() => {
  'use strict';
  if (CSS.supports('corner-shape', 'squircle')) return;
  const selector = 'button:not([data-theme-toggle]),.book-button,.card-actions a,.site-header nav a,.chapter-tabs a,.info-nav a,.info-header nav a,.button-link,.campus-multi .statement,.tabs,.chapter-tabs,.info-nav,.campus-note .nav,.preset-list,.choices,.chapter-card,.shortcuts,.question-card,.settings,.answer-form,.feedback,.difficulty,.sheet,.info-content,.info-summary>div,.info-contact,.info-note,.campus-input-check section';
  const watched = new WeakSet(), pending = new Set(); let scheduled = false;
  function path(w, h, r, inset = 0) {
    const a = inset, b = w - inset, c = h - inset;
    r = Math.min(r, (b-a)/2, (c-a)/2);
    return `M${a+r} ${a}H${b-r}C${b} ${a} ${b} ${a} ${b} ${a+r}V${c-r}C${b} ${c} ${b} ${c} ${b-r} ${c}H${a+r}C${a} ${c} ${a} ${c} ${a} ${c-r}V${a+r}C${a} ${a} ${a} ${a} ${a+r} ${a}Z`;
  }
  function draw(element) {
    const w = element.offsetWidth, h = element.offsetHeight;
    if (!w || !h) return;
    const style = getComputedStyle(element), radius = parseFloat(style.getPropertyValue('--curve-radius')) || 16;
    const signature = [w,h,radius].join(':');
    if (element.dataset.curveSize === signature) return;
    element.dataset.curveSize = signature;
    element.style.setProperty('--curve-path', `path('${path(w,h,radius)}')`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${path(w,h,radius,.5)}" fill="none" stroke="white" stroke-width="1"/></svg>`;
    element.style.setProperty('--curve-outline', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
    element.style.setProperty('--curve-inset', -parseFloat(style.borderTopWidth || 0) + 'px');
    element.classList.add('squircle-fallback');
  }
  function queue(element) {
    pending.add(element);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; for (const item of pending) if (item.isConnected) draw(item); pending.clear(); });
  }
  const resize = new ResizeObserver(entries => entries.forEach(entry => queue(entry.target)));
  function attach(element) { if (!watched.has(element)) { watched.add(element); resize.observe(element); queue(element); } }
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches(selector)) attach(node);
    node.querySelectorAll(selector).forEach(attach);
  }
  scan(document.body);
  new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) scan(node); }).observe(document.body, { childList: true, subtree: true });
})();

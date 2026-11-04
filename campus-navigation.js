/* Logo navigation waits for active Korean input to settle before leaving. */
(() => {
  'use strict';
  if (window.self !== window.top) document.documentElement.classList.add('campus-embedded');
  document.addEventListener('click', async event => {
    const link = event.target.closest?.('a.campus-logo-link');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const note = document.querySelector('.chapter-panel:not([hidden]) iframe')?.contentWindow?.noteInputSafety || window.noteInputSafety;
    if (note) await note.settle();
    else {
      const field = document.activeElement;
      if (field?.matches('input,textarea,[contenteditable=true]')) field.blur();
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    location.assign(link.href);
  });
})();

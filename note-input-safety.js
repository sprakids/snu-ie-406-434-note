(function (host) {
  'use strict';
  function install(options) {
    const root = options.root;
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    const fields = new Map();
    const dirty = new Set();
    const now = () => win.performance.now();
    let lastInputAt = -Infinity, persistTimer, idleTimer, settling = null;
    function isField(field) {
      return !!(field && root.contains(field) && field.dataset?.id &&
        (field.tagName === 'TEXTAREA' || (field.tagName === 'INPUT' && field.type === 'text')));
    }
    function record(field) {
      if (!fields.has(field)) fields.set(field, { value: undefined, composing: false, endedAt: -Infinity, revision: 0, enter: null });
      return fields.get(field);
    }
    function editing() { return isField(doc.activeElement) && doc.hasFocus(); }
    function captureField(field) {
      if (!isField(field)) return;
      const item = record(field);
      if (item.value !== field.value) {
        item.value = field.value;
        item.revision++;
        dirty.add(field.dataset.id);
        options.onDraft(field);
      }
    }
    function capture() {
      for (const field of fields.keys()) {
        if (!root.contains(field)) fields.delete(field);
        else captureField(field);
      }
    }
    function persist() {
      win.clearTimeout(persistTimer);
      capture();
      options.onPersist();
    }
    function schedulePersist() {
      win.clearTimeout(persistTimer);
      persistTimer = win.setTimeout(persist, 250);
    }
    function flushUI() {
      if (!dirty.size) return;
      const ids = [...dirty];
      dirty.clear();
      options.onSettled(ids);
    }
    function focusStep(field, step) {
      function available(candidate) {
        if (!isField(candidate) || candidate.matches(':disabled') || candidate.readOnly || candidate.closest('[hidden],[inert]') ||
          !candidate.getClientRects().length || ['hidden', 'collapse'].includes(win.getComputedStyle(candidate).visibility)) return false;
        for (let parent = candidate.parentElement; parent && parent !== root; parent = parent.parentElement) {
          if (parent.tagName === 'DETAILS' && !parent.open) {
            const summary = [...parent.children].find(child => child.tagName === 'SUMMARY');
            if (!summary?.contains(candidate)) return false;
          }
        }
        return true;
      }
      const visible = [...root.querySelectorAll('input[data-id],textarea[data-id]')].filter(candidate =>
        available(candidate));
      const index = visible.indexOf(field);
      if (index < 0 || !visible[index + step]) return false;
      visible[index + step].focus();
      return true;
    }
    function scheduleIdle() {
      win.clearTimeout(idleTimer);
      idleTimer = win.setTimeout(() => {
        capture();
        // Korean on iPadOS may have no composition events. Keep all editing
        // DOM untouched while ANY answer field is focused, regardless of flags.
        if (editing()) return;
        flushUI();
        persist();
      }, 40);
    }
    root.addEventListener('focusin', event => {
      if (!isField(event.target)) return;
      const item = record(event.target);
      if (item.value === undefined) item.value = event.target.value;
    });
    root.addEventListener('beforeinput', event => {
      if (!isField(event.target)) return;
      const item = record(event.target);
      if (event.isComposing || /^(?:insert|delete)CompositionText$/.test(event.inputType || '')) item.composing = true;
    });
    root.addEventListener('compositionstart', event => {
      if (isField(event.target)) record(event.target).composing = true;
    });
    root.addEventListener('compositionend', event => {
      if (!isField(event.target)) return;
      const item = record(event.target);
      item.composing = false;
      item.endedAt = now();
      captureField(event.target);
      lastInputAt = now();
      schedulePersist();
      scheduleIdle();
    });
    root.addEventListener('input', event => {
      if (!isField(event.target)) return;
      const item = record(event.target);
      if (event.isComposing) item.composing = true;
      if (event.inputType === 'insertFromComposition') { item.composing = false; item.endedAt = now(); }
      captureField(event.target);
      lastInputAt = now();
      schedulePersist();
      // Drafts stay raw. No .value writes, DOM replacement, grading, or focus
      // changes occur here, including when composition events are absent.
    });
    root.addEventListener('focusout', event => {
      if (!isField(event.target)) return;
      const item = record(event.target);
      item.composing = false;
      item.enter = null;
      captureField(event.target);
      lastInputAt = now();
      schedulePersist();
      scheduleIdle();
    });
    root.addEventListener('keydown', event => {
      if (!isField(event.target)) return;
      const field = event.target, item = record(field);
      item.enter = null;
      if (event.key !== 'Enter' || event.repeat) return;
      if (event.isComposing || event.keyCode === 229 || item.composing || now() - item.endedAt < 80) return;
      const backward = options.retreatOnShiftEnter && event.shiftKey;
      if (field.tagName === 'TEXTAREA' && !backward && !event.ctrlKey && !event.metaKey) return;
      captureField(field);
      item.enter = { revision: item.revision, value: field.value, backward };
      event.preventDefault();
    });
    root.addEventListener('keyup', event => {
      if (!isField(event.target) || event.key !== 'Enter') return;
      const field = event.target, item = record(field), pending = item.enter;
      item.enter = null;
      if (!pending || event.isComposing || event.keyCode === 229 || item.composing) return;
      // Commit-Enter can be followed by a final input even with isComposing=false.
      // Grade only a separate Enter that changed no text through keyup/settling.
      win.setTimeout(() => {
        if (!isField(field) || doc.activeElement !== field || !doc.hasFocus() || item.composing ||
          item.revision !== pending.revision || field.value !== pending.value) return;
        captureField(field);
        flushUI();
        if (pending.backward) { focusStep(field, -1); return; }
        options.onEnter(field);
        if (options.advanceOnEnter && doc.activeElement === field && doc.hasFocus()) focusStep(field, 1);
      }, 40);
    });
    function settle() {
      if (settling) return settling;
      if (isField(doc.activeElement)) {
        captureField(doc.activeElement);
        doc.activeElement.blur();
      }
      capture();
      settling = new Promise(resolve => {
        let attempts = 0;
        const finish = () => {
          if (now() - lastInputAt < 40 && attempts++ < 20) { win.setTimeout(finish, 16); return; }
          capture();
          flushUI();
          persist();
          settling = null;
          resolve();
        };
        win.setTimeout(finish, 0);
      });
      return settling;
    }
    function deferAction(action) {
      if (!settling && !editing() && now() - lastInputAt >= 40) return false;
      settle().then(action);
      return true;
    }
    function reveal() {
      if (!options.onReveal) return;
      if (!deferAction(options.onReveal)) options.onReveal();
    }
    doc.addEventListener('keydown', event => {
      if (!options.onReveal || event.defaultPrevented || event.key.toLowerCase() !== 'c' || event.repeat ||
        event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.keyCode === 229) return;
      if (event.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
      event.preventDefault();
      reveal();
    });
    win.addEventListener('blur', scheduleIdle);
    win.addEventListener('pagehide', persist);
    doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden') persist(); });
    return { capture, settle, deferAction, reveal };
  }
  host.NoteInputSafety = { install };
  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
})(typeof window !== 'undefined' ? window : globalThis);

(function (host) {
  'use strict';
  const answered = (answers, id) => typeof answers[id] === 'boolean';
  function shuffle(ids, random = Math.random) {
    const result = [...ids];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    if (result.length > 1 && result.every((id, i) => id === ids[i])) result.push(result.shift());
    return result;
  }
  function eligible(bank, state) {
    return bank.questions.filter(q => (state.section === 'all' || q.sectionId === state.section) &&
      (state.scope === 'all' || (state.scope === 'unanswered' ? !answered(state.answers, q.id) :
        answered(state.answers, q.id) && state.answers[q.id] !== q.answer))).map(q => q.id);
  }
  function restore(bank, saved) {
    const state = { version: 1, bankVersion: bank.version, answers: {}, section: 'all', scope: 'all', order: 'textbook', deck: [], current: null };
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return state;
    for (const q of bank.questions) {
      if (saved.answers && typeof saved.answers[q.id] === 'boolean') state.answers[q.id] = saved.answers[q.id];
    }
    if (bank.sections.some(s => s.id === saved.section)) state.section = saved.section;
    if (['all', 'unanswered', 'wrong'].includes(saved.scope)) state.scope = saved.scope;
    if (['textbook', 'random'].includes(saved.order)) state.order = saved.order;
    const candidates = new Set(eligible(bank, state));
    if (saved.bankVersion === bank.version && Array.isArray(saved.deck)) {
      state.deck = [...new Set(saved.deck.filter(id => candidates.has(id)))];
    }
    if (candidates.has(saved.current)) state.current = saved.current;
    return state;
  }
  function rebuild(bank, state, fresh = false) {
    const ids = eligible(bank, state);
    if (state.order === 'textbook') state.deck = ids;
    else if (fresh || !state.deck.length) state.deck = shuffle(ids);
    else {
      const allowed = new Set(ids), old = new Set(state.deck);
      state.deck = [...state.deck.filter(id => allowed.has(id)), ...shuffle(ids.filter(id => !old.has(id)))];
    }
    if (!state.deck.includes(state.current)) state.current = state.deck[0] || null;
    return state;
  }
  function summary(bank, answers, ids = bank.questions.map(q => q.id)) {
    const map = new Map(bank.questions.map(q => [q.id, q]));
    let correct = 0, wrong = 0;
    for (const id of ids) {
      if (!map.has(id) || !answered(answers, id)) continue;
      if (answers[id] === map.get(id).answer) correct++;
      else wrong++;
    }
    return { total: ids.length, answered: correct + wrong, correct, wrong, unanswered: ids.length - correct - wrong };
  }
  function restartSection(bank, state) {
    const ids = bank.questions.filter(q => state.section === 'all' || q.sectionId === state.section).map(q => q.id);
    if (!ids.length) return state;
    for (const id of ids) delete state.answers[id];
    state.scope = 'all'; state.current = null;
    return rebuild(bank, state, true);
  }
  const api = { answered, shuffle, eligible, restore, rebuild, summary, restartSection };
  host.IEQuiz = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

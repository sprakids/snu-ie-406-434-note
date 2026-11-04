(function (host) {
  'use strict';
  const letters = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'];
  function parse(value) {
    const normalized = String(value ?? '').normalize('NFKC').replace(/[\s,，、·ㆍ.\/()[\]{}+]+/g, '');
    if (!normalized) return { error: '맞는 선지를 입력해 주세요. 예: ㄱㄴㄷ 또는 123' };
    let result = '';
    for (const c of normalized) {
      const index = ['ᄀ', 'ᄂ', 'ᄃ', 'ᄅ', 'ᄆ'].indexOf(c);
      const digit = index >= 0 ? String(index + 1) : c;
      if (!/^[1-5]$/.test(digit)) return { error: 'ㄱ·ㄴ·ㄷ·ㄹ·ㅁ 또는 1~5만 입력해 주세요.' };
      if (result.includes(digit)) return { error: '같은 선지는 한 번만 입력해 주세요.' };
      result += digit;
    }
    return { value: [...result].sort().join('') };
  }
  const correctAnswer = q => q.choices.map((c, i) => c.answer ? String(i + 1) : '').join('');
  const answered = (answers, id) => typeof answers[id] === 'string' && !parse(answers[id]).error;
  const isCorrect = (q, value) => parse(value).value === correctAnswer(q);
  function format(value, mode = 'letters') {
    return [...value].map(n => mode === 'numbers' ? n : letters[Number(n) - 1]).join('·');
  }
  function hydrate(data, ox) {
    if (data.chapter !== ox.chapter || !Array.isArray(data.questions) || !data.questions.length) throw Error('Invalid multi bank');
    const claims = new Map(ox.questions.filter(q => q.kind === 'concept').map(q => [q.id, { ...q, ...(data.overrides?.[q.id] || {}) }]));
    const questions = data.questions.map(q => {
      const primary = claims.get(q.primary), choices = q.choices.map(id => claims.get(id));
      if (!primary || choices.length !== 5 || choices.some(c => !c) || new Set(q.choices).size !== 5) throw Error('Invalid source references');
      if (choices.some(c => c.sectionId !== primary.sectionId) || !choices.some(c => c.itemId === primary.itemId && c.sourceRow === primary.sourceRow)) throw Error('Invalid concept coverage');
      const result = { ...primary, ...q, choices, topic: q.target };
      const answer = correctAnswer(result);
      if (!answer || answer.length === 5) throw Error('Unbalanced question');
      return result;
    });
    return { ...ox, ...data, questions };
  }
  function shuffle(ids, random = Math.random) {
    const result = [...ids];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    if (result.length > 1 && result.every((id, i) => id === ids[i])) result.push(result.shift());
    return result;
  }
  const identityOrder = () => [0, 1, 2, 3, 4];
  const validOrder = order => Array.isArray(order) && order.length === 5 && new Set(order).size === 5 && order.every(n => Number.isInteger(n) && n >= 0 && n < 5);
  const choiceOrder = (q, state) => validOrder(state.choiceOrders?.[q.id]) ? state.choiceOrders[q.id] : identityOrder();
  const orderedQuestion = (q, order) => ({ ...q, choices: order.map(index => q.choices[index]) });
  function toCanonical(value, order) {
    const parsed = parse(value);
    return parsed.error ? null : [...parsed.value].map(n => String(order[Number(n) - 1] + 1)).sort().join('');
  }
  function toDisplay(value, order) {
    const parsed = parse(value);
    return parsed.error ? '' : [...parsed.value].map(n => String(order.indexOf(Number(n) - 1) + 1)).sort().join('');
  }
  function remapDraft(raw, previous, next) {
    // Relabel recognized symbols only when a question is newly presented.
    // Separators, duplicate selections and invalid text remain available to edit.
    return [...raw].map(character => [...character.normalize('NFKC')].map(c => {
      const letter = ['ᄀ', 'ᄂ', 'ᄃ', 'ᄅ', 'ᄆ'].indexOf(c);
      const index = letter >= 0 ? letter : /^[1-5]$/.test(c) ? Number(c) - 1 : -1;
      if (index < 0) return c;
      const position = next.indexOf(previous[index]);
      return letter >= 0 ? letters[position] : String(position + 1);
    }).join('')).join('');
  }
  function present(q, state, random = Math.random) {
    if (!q) return;
    const previous = choiceOrder(q, state), next = shuffle(previous, random);
    if (typeof state.drafts[q.id] === 'string') state.drafts[q.id] = remapDraft(state.drafts[q.id], previous, next);
    state.choiceOrders[q.id] = next;
  }
  function eligible(bank, state) {
    return bank.questions.filter(q => (state.section === 'all' || q.sectionId === state.section) &&
      (state.scope === 'all' || (state.scope === 'unanswered' ? !answered(state.answers, q.id) :
        answered(state.answers, q.id) && !isCorrect(q, state.answers[q.id])))).map(q => q.id);
  }
  function restore(bank, saved) {
    const state = { version: 2, bankVersion: bank.version, answers: {}, drafts: {}, choiceOrders: {}, section: 'all', scope: 'all', order: 'textbook', labels: 'letters', deck: [], current: null };
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return state;
    for (const q of bank.questions) {
      if (saved.answers && typeof saved.answers[q.id] === 'string') {
        const parsed = parse(saved.answers[q.id]);
        if (!parsed.error) state.answers[q.id] = parsed.value;
      }
      if (saved.drafts && typeof saved.drafts[q.id] === 'string') state.drafts[q.id] = saved.drafts[q.id].slice(0, 80);
      if (validOrder(saved.choiceOrders?.[q.id])) state.choiceOrders[q.id] = [...saved.choiceOrders[q.id]];
    }
    if (bank.sections.some(s => s.id === saved.section)) state.section = saved.section;
    if (['all', 'unanswered', 'wrong'].includes(saved.scope)) state.scope = saved.scope;
    if (['textbook', 'random'].includes(saved.order)) state.order = saved.order;
    if (saved.labels === 'numbers') state.labels = 'numbers';
    const candidates = new Set(eligible(bank, state));
    if (saved.bankVersion === bank.version && Array.isArray(saved.deck)) state.deck = [...new Set(saved.deck.filter(id => candidates.has(id)))];
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
      if (isCorrect(map.get(id), answers[id])) correct++; else wrong++;
    }
    return { total: ids.length, answered: correct + wrong, correct, wrong, unanswered: ids.length - correct - wrong };
  }
  function restartSection(bank, state) {
    const ids = bank.questions.filter(q => state.section === 'all' || q.sectionId === state.section).map(q => q.id);
    if (!ids.length) return state;
    for (const id of ids) { delete state.answers[id]; delete state.drafts[id]; delete state.choiceOrders[id]; }
    state.scope = 'all'; state.current = null;
    return rebuild(bank, state, true);
  }
  const api = { letters, parse, correctAnswer, answered, isCorrect, format, hydrate, shuffle, choiceOrder, orderedQuestion, toCanonical, toDisplay, remapDraft, present, eligible, restore, rebuild, summary, restartSection };
  host.IEMulti = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ox = require('../quiz-core.js'), multi = require('../multi-core.js');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
for (const chapter of ['1-4', 7, '8-9', 10]) {
  const quizBank = read(`quiz-data-${chapter}.json`);
  for (const [kind, core, bank] of [['OX', ox, quizBank], ['다지선다', multi, multi.hydrate(read(`multi-data-${chapter}.json`), quizBank)]]) {
    function seeded() {
      const state = core.restore(bank);
      for (const q of bank.questions) {
        state.answers[q.id] = kind === 'OX' ? q.answer : core.correctAnswer(q);
        if (kind !== 'OX') { state.drafts[q.id] = '미완성 ㄱ'; state.choiceOrders[q.id] = [4, 3, 2, 1, 0]; }
      }
      state.labels = 'numbers'; return core.rebuild(bank, state);
    }
    test(`${chapter} ${kind}: 선택 단원만 초기화하고 오답 필터에서 전체 문제로 복귀`, () => {
      const state = seeded(), section = bank.sections[0].id;
      state.section = section; state.scope = 'wrong'; core.rebuild(bank, state);
      const outside = bank.questions.filter(q => q.sectionId !== section);
      const before = structuredClone(state);
      core.restartSection(bank, state);
      const inside = bank.questions.filter(q => q.sectionId === section);
      assert.deepEqual(state.deck, inside.map(q => q.id));
      assert.equal(state.current, inside[0].id); assert.equal(state.scope, 'all'); assert.equal(state.section, section);
      assert.equal(state.labels, 'numbers'); assert.equal(state.order, 'textbook');
      for (const q of inside) {
        assert.equal(core.answered(state.answers, q.id), false);
        if (kind !== 'OX') { assert.equal(state.drafts[q.id], undefined); assert.equal(state.choiceOrders[q.id], undefined); }
      }
      for (const q of outside) {
        assert.deepEqual(state.answers[q.id], before.answers[q.id]);
        if (kind !== 'OX') { assert.equal(state.drafts[q.id], before.drafts[q.id]); assert.deepEqual(state.choiceOrders[q.id], before.choiceOrders[q.id]); }
      }
    });
    test(`${chapter} ${kind}: 장 전체 재시작·무작위 설정·새로고침 후 첫 문제 유지`, () => {
      const state = seeded(); state.scope = 'unanswered'; state.order = 'random';
      core.restartSection(bank, state);
      assert.equal(state.scope, 'all'); assert.equal(state.order, 'random'); assert.equal(state.labels, 'numbers');
      assert.equal(core.summary(bank, state.answers).answered, 0);
      assert.deepEqual(new Set(state.deck), new Set(bank.questions.map(q => q.id)));
      assert.equal(state.current, state.deck[0]);
      if (kind !== 'OX') { assert.deepEqual(state.drafts, {}); assert.deepEqual(state.choiceOrders, {}); }
      const restored = core.rebuild(bank, core.restore(bank, JSON.parse(JSON.stringify(state))));
      assert.equal(restored.current, state.current); assert.deepEqual(restored.deck, state.deck);
    });
  }
}
for (const [kind, core] of [['OX', ox], ['다지선다', multi]]) {
  test(`${kind}: 유효하지 않은 단원으로 다른 기록을 지우지 않음`, () => {
    const quizBank = read('quiz-data-7.json'), bank = kind === 'OX' ? quizBank : multi.hydrate(read('multi-data-7.json'), quizBank);
    const state = core.rebuild(bank, core.restore(bank)); state.answers[bank.questions[0].id] = kind === 'OX' ? false : '12';
    state.section = 'missing-section'; const before = structuredClone(state);
    core.restartSection(bank, state); assert.deepEqual(state, before);
  });
}

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../quiz-core.js');
const root = path.resolve(__dirname, '..');
const banks = ['1-4', 7, '8-9', 10].map(chapter => JSON.parse(fs.readFileSync(path.join(root, `quiz-data-${chapter}.json`), 'utf8')));
const sourceItems = chapter => {
  const html = fs.readFileSync(path.join(root, `chapter-${chapter}.html`), 'utf8');
  const sections = JSON.parse(html.match(/<script id="content-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const items = [];
  const walk = nodes => nodes.forEach(node => node.children ? walk(node.children) : items.push(node));
  sections.forEach(s => walk(s.children));
  return items;
};
for (const bank of banks) {
  test(`${bank.chapter}장: 모든 학습 항목과 표시 키워드가 문제에 포함됨`, () => {
    const items = sourceItems(bank.chapter), expected = new Set();
    assert.equal(bank.itemCount, items.length);
    assert.deepEqual(new Set(bank.questions.map(q => q.itemId)), new Set(items.map(i => i.id)));
    for (const item of items) {
      [item.head, ...item.lines].forEach((row, index) => {
        const keywords = [...row.matchAll(/\[\[(.*?)\]\]/g)].map(match => match[1].split('|')[0]);
        if (!keywords.length) return;
        keywords.forEach(k => expected.add(k));
        const pair = bank.questions.filter(q => q.itemId === item.id && q.sourceRow === index);
        assert.equal(pair.length, 2, `${item.id} row ${index}`);
        assert.equal(pair.filter(q => q.answer).length, 1);
        for (const keyword of keywords) assert.ok(pair.find(q => q.answer).statement.includes(keyword), keyword);
      });
    }
    assert.equal(bank.keywordCount, expected.size);
  });
  test(`${bank.chapter}장: 문항·정답·해설·교재 페이지의 정합성`, () => {
    const items = new Map(sourceItems(bank.chapter).map(item => [item.id, item]));
    assert.equal(bank.questionCount, bank.questions.length);
    assert.equal(new Set(bank.questions.map(q => q.id)).size, bank.questions.length);
    assert.equal(new Set(bank.questions.map(q => q.statement)).size, bank.questions.length);
    assert.equal(bank.questions.filter(q => q.answer).length * 2, bank.questions.length);
    for (const [index, q] of bank.questions.entries()) {
      assert.equal(typeof q.answer, 'boolean');
      assert.equal(q.chapter, bank.chapter);
      assert.equal(q.order, index);
      assert.ok(q.statement.length > 8 && q.explanation.length > 8 && q.topic);
      assert.ok(!q.statement.includes('[[') && !q.statement.includes(']]'));
      assert.equal(q.page, items.get(q.itemId).page);
      assert.ok(q.explanation.includes(q.sourceText) || q.kind === 'application');
      for (const page of q.page.match(/\d+/g)) {
        assert.ok(fs.existsSync(path.join(root, `assets/pages/${bank.chapter}-${page}.webp`)), `missing page ${page}`);
      }
      if (index) assert.ok(q.itemOrder >= bank.questions[index - 1].itemOrder, '단원·학습 항목 순서 변경');
    }
    const variants = bank.questions.slice(0, 30).map(q => q.answer);
    assert.ok(variants.some((v, i) => i && v === variants[i - 1]), 'O/X 교대 패턴으로 정답이 드러남');
  });
  test(`${bank.chapter}장: 단원별 출제 범위가 섞이지 않음`, () => {
    for (const section of bank.sections) {
      const state = core.restore(bank);
      state.section = section.id;
      core.rebuild(bank, state);
      assert.ok(state.deck.length);
      const set = new Set(state.deck);
      assert.ok(bank.questions.filter(q => set.has(q.id)).every(q => q.sectionId === section.id));
    }
  });
  test(`${bank.chapter}장: 무작위 순서가 중복·누락 없이 장 전체를 섞음`, () => {
    const original = bank.questions.map(q => q.id), copy = [...original];
    const result = core.shuffle(original, () => 0.37);
    assert.deepEqual(original, copy);
    assert.equal(new Set(result).size, original.length);
    assert.deepEqual(new Set(result), new Set(original));
    assert.notDeepEqual(result, original);
  });
  test(`${bank.chapter}장: O와 X 응답 모두 저장·집계·오답 필터에 반영`, () => {
    const state = core.rebuild(bank, core.restore(bank));
    const [a, b, c] = bank.questions;
    state.answers[a.id] = a.answer;
    state.answers[b.id] = !b.answer;
    state.answers[c.id] = false;
    const counts = core.summary(bank, state.answers);
    assert.equal(counts.answered, 3);
    assert.equal(counts.correct + counts.wrong, 3);
    assert.equal(counts.correct, 1 + (c.answer === false ? 1 : 0));
    state.scope = 'wrong'; core.rebuild(bank, state);
    assert.ok(state.deck.includes(b.id));
    assert.ok(!state.deck.includes(a.id));
    state.scope = 'unanswered'; core.rebuild(bank, state);
    assert.ok(![a.id, b.id, c.id].some(id => state.deck.includes(id)));
    assert.equal(state.deck.length, bank.questions.length - 3);
  });
  test(`${bank.chapter}장: 새로고침해도 무작위 목록·현재 문항·답안 유지`, () => {
    const state = core.restore(bank);
    state.order = 'random'; core.rebuild(bank, state, true);
    state.current = state.deck[12]; state.answers[state.current] = false;
    const restored = core.rebuild(bank, core.restore(bank, JSON.parse(JSON.stringify(state))));
    assert.deepEqual(restored.deck, state.deck);
    assert.equal(restored.current, state.current);
    assert.equal(restored.answers[state.current], false);
  });
  test(`${bank.chapter}장: 잘못된 저장 데이터는 선택지나 집계를 오염시키지 않음`, () => {
    const q = bank.questions[0];
    const state = core.rebuild(bank, core.restore(bank, {
      bankVersion: bank.version, section: 'unknown', order: 'unknown', scope: 'unknown',
      answers: { unknown: true, [q.id]: 'false' }, deck: [q.id, q.id, 'unknown'], current: 'unknown'
    }));
    assert.equal(state.section, 'all'); assert.equal(state.order, 'textbook'); assert.equal(state.scope, 'all');
    assert.deepEqual(state.answers, {});
    assert.equal(new Set(state.deck).size, bank.questions.length);
    assert.equal(core.summary(bank, state.answers).answered, 0);
  });
  test(`${bank.chapter}장: 오답을 다시 맞혀도 피드백 전에 문항이 사라지지 않음`, () => {
    const q = bank.questions[0], state = core.restore(bank);
    state.answers[q.id] = !q.answer; state.scope = 'wrong'; core.rebuild(bank, state);
    state.answers[q.id] = q.answer;
    assert.equal(state.current, q.id);
    assert.deepEqual(state.deck, [q.id]);
    assert.equal(core.summary(bank, state.answers, state.deck).correct, 1);
    core.rebuild(bank, state);
    assert.deepEqual(state.deck, []); assert.equal(state.current, null);
  });
}
test('공식 적용 연습의 독립 계산 확인', () => {
  const find = (chapter, itemId, text) => banks.find(b => b.chapter === chapter).questions.find(q => q.kind === 'application' && q.itemId === itemId && q.answer && q.statement.includes(text));
  const checks = [
    [7, 'pv-formula', '121', 121 / 1.1 ** 2, 100],
    [7, 'weighted-additive', '80', 80 * 0.6 + 60 * 0.4, 72],
    [7, 'hurwicz', '0.25', 0.25 * 100 + 0.75 * 20, 40],
    [7, 'expected-return', '0.25', 40 * 0.25 + 80 * 0.75, 70],
    [7, 'variance', '2,500', 0.5 * (0 - 50) ** 2 + 0.5 * (100 - 50) ** 2, 2500],
    [7, 'npv', '120', 120 - 100, 20],
    [7, 'irr', '110', (110 / 100 - 1) * 100, 10],
    [10, 'work-time-study', '11분', 10 * 1.1, 11],
    [10, 'work-time-study', '12분', 10 * 1.2, 12],
    [10, 'work-work-sampling', '60%', 60 / 100 * 100, 60],
  ];
  for (const [chapter, id, text, computed, expected] of checks) {
    assert.ok(find(chapter, id, text), `${id} ${text}`);
    assert.ok(Math.abs(computed - expected) < 1e-9);
  }
});
test('두 장의 기록은 서로 가져와도 섞이지 않음', () => {
  const [a, b] = banks, answers = Object.fromEntries(a.questions.map(q => [q.id, true]));
  assert.deepEqual(core.restore(b, { answers }).answers, {});
});
test('문제가 하나이거나 없는 경우에도 섞기 안전', () => {
  assert.deepEqual(core.shuffle([]), []);
  assert.deepEqual(core.shuffle(['one']), ['one']);
});

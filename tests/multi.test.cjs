const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../multi-core.js');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const banks = ['1-4', 7, '8-9', 10].map(ch => core.hydrate(read(`multi-data-${ch}.json`), read(`quiz-data-${ch}.json`)));
for (const b of banks) {
  test(`${b.chapter}: 全 학습 항목과 각 표시 키워드의 명시적 출제`, () => {
    const html = fs.readFileSync(path.join(root, `chapter-${b.chapter}.html`), 'utf8');
    const sections = JSON.parse(html.match(/<script id="content-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    const items = [], walk = nodes => nodes.forEach(n => n.children ? walk(n.children) : items.push(n));
    sections.forEach(s => walk(s.children));
    assert.equal(b.questions.length, b.questionCount);
    assert.equal(new Set(b.questions.map(q => q.id)).size, b.questions.length);
    assert.equal(b.questions.filter(q => q.kind === 'concept').length, items.length);
    let targets = 0;
    for (const item of items) {
      assert.ok(b.questions.some(q => q.kind === 'concept' && q.itemId === item.id));
      const keys = new Set([item.head, ...item.lines].flatMap(row => [...row.matchAll(/\[\[(.*?)\]\]/g)].map(m => m[1].split('|')[0])));
      targets += keys.size;
      for (const keyword of keys) {
        const q = b.questions.find(q => q.kind === 'keyword' && q.itemId === item.id && q.target === keyword);
        assert.ok(q, `${item.id} ${keyword}`);
        assert.ok(q.choices.some(c => c.itemId === item.id && c.keywords.includes(keyword)));
      }
    }
    assert.equal(b.keywordTargetCount, targets);
  });
  test(`${b.chapter}: 다섯 선지의 교재 근거·참거짓 혼합·서로 다른 논점`, () => {
    const counts = new Set();
    for (const q of b.questions) {
      assert.equal(q.choices.length, 5);
      assert.equal(new Set(q.choices.map(c => c.itemId + ':' + c.sourceRow)).size, 5, '한 사실의 정반대 선지 중복');
      assert.equal(new Set(q.choices.map(c => c.statement)).size, 5);
      const answer = core.correctAnswer(q); counts.add(answer.length);
      assert.ok(answer.length >= 1 && answer.length <= 4);
      for (const c of q.choices) {
        assert.equal(c.kind, 'concept', '교재 밖 수치 적용 문항 혼입');
        assert.equal(c.sectionId, q.sectionId, '다른 장·절 선지 혼입');
        assert.ok(c.statement && c.explanation && c.sourceText);
        assert.ok(c.explanation.includes(c.sourceText));
        for (const page of c.page.match(/\d+/g)) assert.ok(fs.existsSync(path.join(root, `assets/pages/${b.chapter}-${page}.webp`)));
      }
    }
    assert.deepEqual(counts, new Set([1, 2, 3, 4]));
  });
  test(`${b.chapter}: 가능한 31개 비어 있지 않은 조합을 전수 채점`, () => {
    for (const q of b.questions) {
      const expected = core.correctAnswer(q);
      for (let mask = 1; mask < 32; mask++) {
        const digits = [1, 2, 3, 4, 5].filter(n => mask & (1 << (n - 1))).join('');
        const letters = [...digits].reverse().map(n => core.letters[n - 1]).join(' ');
        assert.equal(core.isCorrect(q, digits), digits === expected);
        assert.equal(core.isCorrect(q, letters), digits === expected);
      }
    }
  });
  test(`${b.chapter}: 오답·미풀이·단원 필터와 무작위 저장 복원`, () => {
    const state = core.rebuild(b, core.restore(b)), [a, z] = b.questions;
    state.answers[a.id] = core.correctAnswer(a);
    state.answers[z.id] = '12345';
    state.drafts[z.id] = '1 2 3 4 5';
    assert.deepEqual(core.summary(b, state.answers), { total: b.questions.length, answered: 2, correct: 1, wrong: 1, unanswered: b.questions.length - 2 });
    state.scope = 'wrong'; core.rebuild(b, state); assert.deepEqual(state.deck, [z.id]);
    state.answers[z.id] = core.correctAnswer(z); assert.equal(state.current, z.id, '오답 수정 직후 화면 유지');
    core.rebuild(b, state); assert.deepEqual(state.deck, []);
    state.scope = 'unanswered'; core.rebuild(b, state); assert.equal(state.deck.length, b.questionCount - 2);
    state.scope = 'all'; state.order = 'random'; core.rebuild(b, state, true); state.current = state.deck[12];
    const restored = core.rebuild(b, core.restore(b, JSON.parse(JSON.stringify(state))));
    assert.deepEqual(restored, state);
    for (const section of b.sections) { state.section = section.id; core.rebuild(b, state); assert.ok(state.deck.length); assert.ok(state.deck.every(id => b.questions.find(q => q.id === id).sectionId === section.id)); }
  });
}
test('입력 표기·전각·원문자·순서·구분자와 잘못된 입력', () => {
  for (const s of ['ㄱㄷㅁ', '531', '５３１', '①③⑤', '㉠㉢㉤', 'ㄱ, ㄷ / ㅁ', '1 ㄷ 5']) assert.equal(core.parse(s).value, '135', s);
  for (const s of ['', ' ', '0', '6', '12a', 'ㄱㄱ', '11', '가나다', '-1', '1;3', 'ㄲ']) assert.ok(core.parse(s).error, s);
});
test('오염된 저장 데이터와 다른 장의 답안을 격리', () => {
  const b = banks[0], q = b.questions[0];
  const saved = { answers: { [q.id]: false, unknown: '123' }, drafts: { [q.id]: 7 }, deck: [q.id, q.id, 'unknown'], section: 'bad', scope: 'bad', order: 'bad', labels: 'bad' };
  const state = core.rebuild(b, core.restore(b, saved));
  assert.deepEqual(state.answers, {}); assert.deepEqual(state.drafts, {}); assert.equal(state.order, 'textbook'); assert.equal(state.labels, 'letters');
  assert.deepEqual(core.restore(banks[1], { answers: { [q.id]: '123' } }).answers, {});
});
test('실제 교재의 명확한 근거에 한정한 검토 수정', () => {
  const data = read('multi-data-8-9.json');
  assert.equal(data.overrides['ie8-9-c9-clt-0-a'].page, '273');
  assert.ok(data.overrides['ie8-9-c9-clt-1-a'].page.includes('275'));
  assert.equal(data.overrides['ie8-9-c9-least-squares-1-a'].page, '280, 286');
  assert.ok(!data.overrides['ie8-9-c9-mle-1-a'].statement.includes('일치할 가능성'));
});

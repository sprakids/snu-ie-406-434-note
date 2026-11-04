const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../multi-core.js');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
const banks = ['1-4', 7, '8-9', 10].map(ch => core.hydrate(read(`multi-data-${ch}.json`), read(`quiz-data-${ch}.json`)));
function permutations(values) {
  if (!values.length) return [[]];
  return values.flatMap((v, i) => permutations(values.filter((_, j) => j !== i)).map(rest => [v, ...rest]));
}
test('정답 개수 1~4의 모든 120가지 선지 배치와 31개 조합 채점', () => {
  const questions = [1, 2, 3, 4].map(n => banks[0].questions.find(q => core.correctAnswer(q).length === n));
  for (const q of questions) for (const order of permutations([0, 1, 2, 3, 4])) {
    const view = core.orderedQuestion(q, order);
    for (let mask = 1; mask < 32; mask++) {
      const displayed = [1, 2, 3, 4, 5].filter(n => mask & (1 << (n - 1))).join('');
      const canonical = core.toCanonical(displayed, order);
      assert.equal(core.isCorrect(q, canonical), displayed === core.correctAnswer(view));
      assert.equal(core.toDisplay(canonical, order), displayed);
      assert.equal(core.toCanonical([...displayed].map(n => core.letters[n - 1]).join(' '), order), canonical);
    }
  }
});
test('모든 문항은 재표시 때 직전과 다른 순서이며 선지·해설·쪽수를 함께 이동', () => {
  for (const bank of banks) {
    const state = core.restore(bank);
    for (const q of bank.questions) {
      const original = [...q.choices], first = core.choiceOrder(q, state);
      for (let attempt = 0; attempt < 3; attempt++) {
        const before = [...core.choiceOrder(q, state)];
        core.present(q, state, () => 0.999);
        const next = core.choiceOrder(q, state);
        assert.notDeepEqual(next, before);
        assert.deepEqual(new Set(next), new Set(first));
        assert.deepEqual(new Set(core.orderedQuestion(q, next).choices), new Set(original));
      }
      assert.deepEqual(q.choices, original, '원본 선지 순서 변경');
    }
  }
});
test('이전 버전의 정답·오답·초안을 유지하며 새 선지 위치로 환산', () => {
  const b = banks[0], [correct, wrong] = b.questions;
  const state = core.restore(b, { version: 1, answers: { [correct.id]: core.correctAnswer(correct), [wrong.id]: '12345' }, drafts: { [correct.id]: core.format(core.correctAnswer(correct)) }, current: correct.id });
  const counts = core.summary(b, state.answers), savedAnswers = JSON.stringify(state.answers);
  core.present(correct, state, () => 0.2);
  const order = core.choiceOrder(correct, state);
  assert.equal(core.toCanonical(state.drafts[correct.id], order), core.correctAnswer(correct));
  assert.equal(core.toDisplay(state.answers[correct.id], order), core.correctAnswer(core.orderedQuestion(correct, order)));
  assert.equal(JSON.stringify(state.answers), savedAnswers);
  assert.deepEqual(core.summary(b, state.answers), counts);
  assert.equal(counts.correct, 1); assert.equal(counts.wrong, 1);
});
test('다시 열어도 초안의 선택 내용과 제출 기록은 바뀌지 않음', () => {
  const b = banks[1], q = b.questions[0], state = core.restore(b);
  core.present(q, state, () => 0.1);
  const initialOrder = core.choiceOrder(q, state);
  state.drafts[q.id] = 'ㄷ ㄱ';
  const selected = core.toCanonical(state.drafts[q.id], initialOrder);
  state.answers[q.id] = selected;
  const saved = JSON.parse(JSON.stringify(state)), restored = core.restore(b, saved);
  assert.deepEqual(core.choiceOrder(q, restored), initialOrder);
  core.present(q, restored, () => 0.8);
  assert.notDeepEqual(core.choiceOrder(q, restored), initialOrder);
  assert.equal(core.toCanonical(restored.drafts[q.id], core.choiceOrder(q, restored)), selected);
  assert.equal(restored.answers[q.id], selected);
});
test('구분자·중복·입력 오류를 버리지 않고 인식 가능한 선지만 재배치', () => {
  const from = [0, 1, 2, 3, 4], to = [4, 3, 2, 1, 0];
  assert.equal(core.remapDraft('ㄱ, ㄷ / ㅁ', from, to), 'ㅁ, ㄷ / ㄱ');
  assert.equal(core.remapDraft('1 3 5', from, to), '5 3 1');
  assert.equal(core.remapDraft('ㄱㄱ?6', from, to), 'ㅁㅁ?6');
  assert.ok(core.parse(core.remapDraft('ㄱㄱ?6', from, to)).error);
  assert.equal(core.toCanonical('abc', to), null);
});
test('깨진 선지 배치 저장값은 기본 배치로 안전하게 대체', () => {
  const b = banks[2], q = b.questions[0];
  for (const order of [[0, 0, 1, 2, 3], [0, 1], [0, 1, 2, 3, 6], '01234']) {
    const state = core.restore(b, { choiceOrders: { [q.id]: order, unknown: [4, 3, 2, 1, 0] } });
    assert.deepEqual(state.choiceOrders, {});
    assert.deepEqual(core.choiceOrder(q, state), [0, 1, 2, 3, 4]);
    core.present(q, state); assert.equal(new Set(core.choiceOrder(q, state)).size, 5);
  }
});

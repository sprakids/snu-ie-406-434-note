const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'chapter-1-4.html'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const data = Object.fromEntries(scripts.filter(m => /id=/.test(m[1])).map(m => [m[1].match(/id="([^"]+)"/)[1], m[2]]));
const js = scripts.at(-1)[2];
const context = {document:{getElementById:id=>({textContent:data[id]})}};
vm.runInNewContext(js.slice(0, js.indexOf('function cleanState')) + '\nglobalThis.grading={isCorrect,allBlanks};})();', context);
test('1~4장 첨부의 모든 학습 내용·주석·정답 표현 유지', () => {
  const original = JSON.parse(fs.readFileSync(path.join(root, 'authoring/source-1-4.json'), 'utf8'));
  assert.deepEqual(JSON.parse(data['content-data']), original);
  assert.equal(original.length, 4);
  assert.ok(js.includes("const STORE='ie1-4-cloze-v1'"));
});
test('통합 노트의 모든 등록 정답을 채점하며 조사·어미·반대 개념 구분', () => {
  const {isCorrect, allBlanks} = context.grading;
  let checked = 0;
  for (const b of allBlanks) for (const answer of b.answers) {
    assert.equal(isCorrect(b, answer), true, b.id + ' ' + answer); checked++;
  }
  assert.ok(checked > 1000);
  for (const [answer, value, expected] of [
    ['산업공학','산업공학입니다.',true],['산업공학','Industrial Engineering이라고 합니다',true],
    ['시스템','시스템의',true],['후방통합','후방통합입니다',true],
    ['후방통합','전방통합',false],['규모의 경제','범위의 경제',false],
    ['보완재','대체재',false],['개방 시스템','폐쇄 시스템',false],
    ['산업공학','산업공학이 아닙니다',false],['SWOT 분석','BCG',false],
  ]) {
    const b = allBlanks.find(b => b.answers.includes(answer));
    assert.ok(b,answer);assert.equal(isCorrect(b,value),expected,answer+' ← '+value);
  }
});
test('통합 묶음 하나로 메인·OX·교재를 연결하고 기존 장 경로 유지', () => {
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for (const chapter of ['1-4','7','10']) {
    assert.ok(index.includes('id="tab-'+chapter+'"'));
    assert.ok(index.includes('data-src="/chapter-'+chapter+'.html"'));
  }
  for (const chapter of [1,2,3,4]) assert.ok(!index.includes('id="tab-'+chapter+'"'));
  assert.equal(new Set(context.grading.allBlanks.map(b=>b.id)).size, context.grading.allBlanks.length);
});

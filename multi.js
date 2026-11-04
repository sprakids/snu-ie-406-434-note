(() => {
  'use strict';
  const $ = id => document.getElementById(id), core = window.IEMulti;
  const requested = new URLSearchParams(location.search).get('chapter');
  const chapter = ['1-4', '8-9'].includes(requested) ? requested : requested === '10' ? 10 : requested === '7' ? 7 : '1-4';
  const chapterLabel = ({ '1-4': '1~4장 통합', '8-9': '8~9장 통합' })[chapter] || chapter + '장';
  const storageKey = 'snu-ie-multi-chapter-' + chapter + '-v1';
  const input = $('answer-input');
  let bank, state, byId, renderedId = null, composing = false, lastComposition = 0, enterTicket = null, transition = 0;
  let pendingChoices = null, choiceTimer = null;
  document.title = chapterLabel + ' 다지선다 · 산업공학의 이해';
  $('quiz-heading').textContent = chapterLabel + ' 다지선다';
  $('chapter-' + chapter).setAttribute('aria-current', 'page');
  $('notes-link').href = '/#' + chapter;
  $('ox-link').href = '/quiz.html?chapter=' + chapter;
  $('book-link').href = '/textbook.html?chapter=' + chapter + '&page=' + ({ '1-4': 23, 7: 195, '8-9': 249, 10: 303 })[chapter];
  function storageWarning() {
    $('save-status').textContent = '이 브라우저에서 기록을 저장하지 못했습니다. 학습은 계속할 수 있지만 새로고침하면 이번 기록이 사라질 수 있습니다.';
    $('save-status').classList.add('storage-warning');
  }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { storageWarning(); } }
  const current = () => state?.current ? byId.get(state.current) : null;
  function presentCurrent() { core.present(current(), state); renderedId = null; }
  function capture() {
    if (!state || !renderedId || input.readOnly) return;
    state.drafts[renderedId] = input.value;
    save();
  }
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function settle() {
    enterTicket = null;
    if (document.activeElement === input) input.blur();
    await delay(60);
    composing = false; flushChoices(); capture();
  }
  async function act(action) {
    const ticket = ++transition;
    await settle();
    if (ticket === transition) action();
  }
  function sourceLinks(page, target) {
    target.replaceChildren(...[...new Set(page.match(/\d+/g) || [])].map(number => {
      const a = document.createElement('a');
      a.href = '/textbook.html?chapter=' + chapter + '&page=' + number;
      a.target = '_blank'; a.rel = 'noopener'; a.textContent = '교재 ' + number + '쪽 ↗';
      a.setAttribute('aria-label', '교재 ' + number + '쪽 열기 (새 탭)');
      return a;
    }));
  }
  function stats() {
    const total = core.summary(bank, state.answers);
    $('progress-text').textContent = total.answered + ' / ' + total.total;
    $('progress').max = total.total || 1; $('progress').value = total.answered;
    for (const type of ['correct', 'wrong', 'unanswered']) $(type + '-count').textContent = total[type];
    const deck = core.summary(bank, state.answers, state.deck);
    $('completion').hidden = !deck.total || deck.unanswered > 0;
    $('completion-text').textContent = '이번 목록 ' + deck.total + '문항 중 정답 ' + deck.correct + '개, 오답 ' + deck.wrong + '개입니다.';
  }
  function clearInputError() {
    $('answer-error').hidden = true; input.removeAttribute('aria-invalid');
  }
  function syncChoices() {
    const q = current();
    if (!q) return;
    const done = core.answered(state.answers, q.id);
    const value = done ? core.toDisplay(state.answers[q.id], core.choiceOrder(q, state)) : core.parse(input.value).value || '';
    const selected = new Set(value);
    if (pendingChoices?.id === q.id) for (const [digit, checked] of pendingChoices.edits) {
      if (checked) selected.add(digit); else selected.delete(digit);
    }
    for (const checkbox of $('statements').querySelectorAll('.choice-checkbox')) {
      checkbox.checked = selected.has(checkbox.dataset.choice);
      checkbox.disabled = done;
      checkbox.closest('.statement').classList.toggle('answer-selected', checkbox.checked);
    }
  }
  function flushChoices() {
    if (!pendingChoices) return true;
    if (composing) return false;
    clearTimeout(choiceTimer); choiceTimer = null;
    const edits = pendingChoices; pendingChoices = null;
    const q = current();
    if (!q || q.id !== edits.id || core.answered(state.answers, q.id)) return false;
    const parsed = core.parse(input.value);
    if (input.value.trim() && parsed.error) {
      $('answer-error').textContent = parsed.error + ' 입력칸을 수정하거나 비운 뒤 선지를 선택해 주세요.';
      $('answer-error').hidden = false; input.setAttribute('aria-invalid', 'true'); syncChoices(); return false;
    }
    const selected = new Set(parsed.value || '');
    for (const [digit, checked] of edits.edits) {
      if (checked) selected.add(digit); else selected.delete(digit);
    }
    const value = [...selected].sort().join('');
    input.value = state.labels === 'numbers' ? value : [...value].map(n => core.letters[Number(n) - 1]).join('');
    capture(); clearInputError(); syncChoices(); return true;
  }
  function scheduleChoices() {
    clearTimeout(choiceTimer);
    choiceTimer = setTimeout(() => {
      if (document.activeElement !== input) composing = false;
      if (composing) return; // compositionend will schedule the pending clicks again.
      if (Date.now() - lastComposition < 60) { scheduleChoices(); return; }
      flushChoices();
    }, 60);
  }
  function choose(checkbox) {
    const q = current();
    if (!q || core.answered(state.answers, q.id)) return;
    if (pendingChoices?.id !== q.id) pendingChoices = { id: q.id, edits: new Map() };
    pendingChoices.edits.set(checkbox.dataset.choice, checkbox.checked);
    if (document.activeElement === input) input.blur();
    syncChoices(); scheduleChoices();
  }
  function render() {
    const q = current(), index = state.deck.indexOf(state.current);
    rangeRetry.refresh();
    stats(); $('question-card').hidden = !q; $('empty').hidden = !!q;
    $('order-note').textContent = (state.order === 'random' ? '선택한 범위 전체를 단원 경계 없이 섞습니다.' : '교재의 단원·학습 항목 순서대로 개념과 각 키워드를 확인합니다.') + ' 선지는 문제가 다시 나올 때마다 섞이며, 이전 선택은 바뀐 위치에 맞춰 표시됩니다.';
    $('reshuffle').disabled = state.order !== 'random' || state.deck.length < 2;
    if (!q) {
      $('empty-title').textContent = state.scope === 'wrong' ? '현재 범위에 남은 오답이 없습니다.' : state.scope === 'unanswered' ? '현재 범위의 문제를 모두 풀었습니다.' : '현재 범위에 문제가 없습니다.';
      renderedId = null; return;
    }
    const order = core.choiceOrder(q, state), view = core.orderedQuestion(q, order);
    const done = core.answered(state.answers, q.id), answer = done ? core.toDisplay(state.answers[q.id], order) : '', expected = core.correctAnswer(view);
    $('position-text').textContent = '문제 ' + (index + 1) + ' / ' + state.deck.length;
    $('question-kind').textContent = q.kind === 'keyword' ? '키워드 확인' : '핵심 개념 확인';
    $('question-path').textContent = [q.sectionTitle, ...q.path].join(' › ');
    $('question-topic').textContent = q.kind === 'keyword' ? '중심 키워드' : '중심 개념';
    $('question-statement').textContent = q.target;
    $('question-card').dataset.questionId = q.id;
    sourceLinks(q.page, $('source-links'));
    $('book-link').href = '/textbook.html?chapter=' + chapter + '&page=' + q.page.match(/\d+/)[0];
    $('statements').replaceChildren(...view.choices.map((choice, i) => {
      const li = document.createElement('li'), top = document.createElement('label'), label = document.createElement('span'), text = document.createElement('span'), checkbox = document.createElement('input'), links = document.createElement('div');
      li.className = 'statement'; li.classList.toggle('selection-locked', done); top.className = 'statement-top statement-choice'; label.className = 'choice-label';
      label.textContent = state.labels === 'numbers' ? String(i + 1) : core.letters[i];
      text.className = 'statement-text'; text.textContent = choice.statement;
      checkbox.type = 'checkbox'; checkbox.className = 'choice-checkbox'; checkbox.dataset.choice = String(i + 1); checkbox.disabled = done;
      checkbox.addEventListener('change', () => choose(checkbox));
      top.append(label, text, checkbox); links.className = 'source-links'; sourceLinks(choice.page, links); li.append(top, links);
      li.addEventListener('click', event => {
        if (done || event.target.closest('a,input,label,.statement-detail')) return;
        checkbox.click();
      });
      if (done) {
        const chosen = answer.includes(String(i + 1)), matched = chosen === choice.answer;
        li.classList.add(matched ? 'matched' : 'missed');
        const detail = document.createElement('div'), verdict = document.createElement('p'), evidence = document.createElement('p');
        detail.className = 'statement-detail'; verdict.className = 'statement-result';
        verdict.textContent = (choice.answer ? '참' : '거짓') + ' · ' + (chosen ? '선택함' : '선택하지 않음') + ' · ' + (matched ? '올바른 판단' : choice.answer ? '정답에서 빠뜨린 선지' : '정답에서 제외할 선지');
        evidence.textContent = (choice.answer ? '판정 근거: ' : '바로잡은 설명: ') + choice.explanation;
        detail.append(verdict, evidence); li.append(detail);
      }
      return li;
    }));
    if (renderedId !== q.id) {
      input.value = state.drafts[q.id] ?? (done ? answer : '');
      $('answer-error').hidden = true; input.removeAttribute('aria-invalid');
      renderedId = q.id;
    }
    input.readOnly = done; $('submit-answer').disabled = done;
    syncChoices();
    $('feedback').hidden = !done; $('feedback').classList.toggle('wrong', done && answer !== expected);
    $('feedback-topic').textContent = done ? chapterLabel + ' · ' + q.target : '';
    $('feedback-title').textContent = done ? (answer === expected ? '정답입니다.' : '다시 확인해 보세요.') + ' 정답 ' + core.format(expected) + ' (' + expected + ')' : '';
    const missed = [...expected].filter(n => !answer.includes(n)).join(''), extra = [...answer].filter(n => !expected.includes(n)).join('');
    $('answer-diff').textContent = done ? (answer === expected ? '옳은 선지와 틀린 선지를 모두 정확히 구별했습니다.' : [missed ? '빠뜨린 선지: ' + core.format(missed) + ' (' + missed + ')' : '', extra ? '제외할 선지: ' + core.format(extra) + ' (' + extra + ')' : ''].filter(Boolean).join('\n')) : '';
    $('position').value = index + 1; $('position').max = state.deck.length;
    $('previous').disabled = index <= 0; $('next').disabled = index >= state.deck.length - 1;
  }
  function submit() {
    const q = current();
    if (!q || core.answered(state.answers, q.id) || composing) return;
    if (!flushChoices()) return;
    capture();
    const parsed = core.parse(input.value);
    if (parsed.error) {
      $('answer-error').textContent = parsed.error; $('answer-error').hidden = false; input.setAttribute('aria-invalid', 'true'); return;
    }
    $('answer-error').hidden = true; input.removeAttribute('aria-invalid');
    state.answers[q.id] = core.toCanonical(parsed.value, core.choiceOrder(q, state)); save(); render();
    $('feedback').scrollIntoView({ block: 'nearest' });
  }
  input.addEventListener('compositionstart', () => { composing = true; enterTicket = null; });
  input.addEventListener('compositionend', () => { composing = false; lastComposition = Date.now(); capture(); syncChoices(); if (pendingChoices) scheduleChoices(); });
  input.addEventListener('input', event => {
    if (event.isComposing || /Composition/i.test(event.inputType || '')) lastComposition = Date.now();
    capture(); $('answer-error').hidden = true; input.removeAttribute('aria-invalid');
    if (!composing && !event.isComposing) syncChoices();
  });
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (event.isComposing || composing || event.keyCode === 229 || Date.now() - lastComposition < 60) { enterTicket = null; return; }
    event.preventDefault();
    if (!event.repeat) enterTicket = state?.current;
  });
  input.addEventListener('keyup', event => {
    if (event.key !== 'Enter' || !enterTicket) return;
    const ticket = enterTicket; enterTicket = null;
    window.setTimeout(() => { if (state?.current === ticket && !composing && document.activeElement === input) submit(); }, 50);
  });
  $('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (composing || Date.now() - lastComposition < 60) return;
    submit();
  });
  input.addEventListener('blur', capture);
  window.addEventListener('pagehide', () => { if (document.activeElement !== input) composing = false; flushChoices(); capture(); });
  function move(index) {
    if (!state || !Number.isInteger(index) || index < 0 || index >= state.deck.length) return;
    act(() => { state.current = state.deck[index]; presentCurrent(); save(); render(); $('question-statement').focus({ preventScroll: true }); $('question-card').scrollIntoView({ block: 'nearest' }); });
  }
  function changeSettings() {
    if (!state) return;
    act(() => {
      state.section = $('section').value; state.scope = $('scope').value; state.order = $('order').value; state.current = null;
      core.rebuild(bank, state, true); presentCurrent(); save(); render();
    });
  }
  $('previous').onclick = () => move(state.deck.indexOf(state.current) - 1);
  $('next').onclick = () => move(state.deck.indexOf(state.current) + 1);
  $('jump-form').onsubmit = event => { event.preventDefault(); move(Number($('position').value) - 1); };
  for (const id of ['section', 'scope', 'order']) $(id).onchange = changeSettings;
  $('labels').onchange = () => act(() => { state.labels = $('labels').value; save(); render(); });
  $('reshuffle').onclick = () => act(() => { state.deck = core.shuffle(state.deck); state.current = state.deck[0] || null; presentCurrent(); save(); render(); });
  $('retry-question').onclick = () => act(() => { const q = current(); if (!q) return; delete state.answers[q.id]; delete state.drafts[q.id]; presentCurrent(); save(); render(); input.focus(); });
  $('show-all').onclick = () => { $('section').value = 'all'; $('scope').value = 'all'; changeSettings(); };
  $('review-wrong').onclick = () => { $('section').value = 'all'; $('scope').value = 'wrong'; changeSettings(); };
  $('reload').onclick = () => location.reload();
  const rangeRetry = window.IEStudyRetry({
    open: show => act(show),
    describe: () => {
      if (!bank || !state) return null;
      const ids = bank.questions.filter(q => state.section === 'all' || q.sectionId === state.section).map(q => q.id);
      return { key: chapter + ':' + state.section, whole: state.section === 'all', title: chapterLabel + (state.section === 'all' ? '' : ' · ' + (bank.sections.find(s => s.id === state.section)?.title || '선택 단원')), total: ids.length, answered: core.summary(bank, state.answers, ids).answered, drafts: ids.filter(id => !core.answered(state.answers, id) && (state.drafts[id] || '').trim()).length };
    },
    restart: () => { core.restartSection(bank, state); $('scope').value = state.scope; presentCurrent(); save(); render(); },
    focus: () => { input.focus({ preventScroll: true }); $('question-card').scrollIntoView({ block: 'nearest' }); }
  });
  document.addEventListener('keydown', event => {
    if (!state || rangeRetry.isOpen() || event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.keyCode === 229 || event.target.closest?.('input,select,textarea,button,a,[contenteditable]:not([contenteditable="false"])')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(state.deck.indexOf(state.current) - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); move(state.deck.indexOf(state.current) + 1); }
  });
  (async () => {
    try {
      const responses = await Promise.all([fetch('/multi-data-' + chapter + '.json'), fetch('/quiz-data-' + chapter + '.json')]);
      if (responses.some(r => !r.ok)) throw Error('Question source HTTP error');
      const [data, ox] = await Promise.all(responses.map(r => r.json()));
      if (data.chapter !== chapter) throw Error('Wrong chapter');
      bank = core.hydrate(data, ox); byId = new Map(bank.questions.map(q => [q.id, q]));
      let saved; try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { storageWarning(); }
      state = core.rebuild(bank, core.restore(bank, saved));
      for (const section of bank.sections) {
        const option = document.createElement('option'); option.value = section.id;
        option.textContent = section.title + ' (' + bank.questions.filter(q => q.sectionId === section.id).length + '문항)'; $('section').append(option);
      }
      for (const id of ['section', 'scope', 'order', 'labels']) { $(id).value = state[id]; $(id).disabled = false; }
      $('bank-info').textContent = chapterLabel + ' · ' + bank.itemCount + '개 학습 항목 · ' + bank.keywordCount + '개 키워드 · ' + bank.questionCount + '문항';
      $('loading').hidden = true; presentCurrent(); save(); render();
    } catch (error) { $('loading').textContent = '문항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'; $('reload').hidden = false; console.error(error); }
  })();
})();

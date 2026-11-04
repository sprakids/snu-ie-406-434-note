(() => {
  'use strict';
  const $ = id => document.getElementById(id), core = window.IEQuiz;
  const requested = new URLSearchParams(location.search).get('chapter');
  const chapter = ['1-4','8-9'].includes(requested) ? requested : requested === '10' ? 10 : 7;
  const chapterLabel = ({'1-4':'1~4장 통합','8-9':'8~9장 통합'})[chapter] || chapter + '장';
  const storageKey = 'snu-ie-ox-chapter-' + chapter + '-v1';
  let bank, state, byId;
  document.title = chapterLabel + ' OX 퀴즈 · 산업공학의 이해';
  $('quiz-heading').textContent = chapterLabel + ' OX 퀴즈';
  $('chapter-' + chapter).setAttribute('aria-current', 'page');
  $('notes-link').href = '/#' + chapter;
  $('multi-link').href = '/multi.html?chapter=' + chapter;
  $('book-link').href = '/textbook.html?chapter=' + chapter + '&page=' + (chapter === '1-4' ? 23 : chapter === '8-9' ? 249 : chapter === 10 ? 303 : 195);
  function storageWarning() {
    $('save-status').textContent = '이 브라우저에서 기록을 저장하지 못했습니다. 퀴즈는 계속 풀 수 있지만 새로고침하면 이번 기록이 사라질 수 있습니다.';
    $('save-status').classList.add('storage-warning');
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageWarning(); }
  }
  function current() { return state?.current ? byId.get(state.current) : null; }
  function stats() {
    const total = core.summary(bank, state.answers);
    $('progress-text').textContent = total.answered + ' / ' + total.total;
    $('progress').max = total.total || 1; $('progress').value = total.answered;
    $('correct-count').textContent = total.correct;
    $('wrong-count').textContent = total.wrong;
    $('unanswered-count').textContent = total.unanswered;
    const deck = core.summary(bank, state.answers, state.deck);
    $('completion').hidden = !deck.total || deck.unanswered > 0;
    $('completion-text').textContent = '이번 목록 ' + deck.total + '문항 중 정답 ' + deck.correct + '개, 오답 ' + deck.wrong + '개입니다. 상단의 다시 풀기 버튼으로 처음부터 복습할 수 있습니다.';
  }
  function sources(q) {
    const pages = [...new Set(q.page.match(/\d+/g) || [])];
    $('source-links').replaceChildren(...pages.map(page => {
      const a = document.createElement('a');
      a.href = '/textbook.html?chapter=' + chapter + '&page=' + page;
      a.target = '_blank'; a.rel = 'noopener'; a.textContent = '교재 ' + page + '쪽 ↗';
      a.setAttribute('aria-label', '교재 ' + page + '쪽 열기 (새 탭)');
      return a;
    }));
    $('book-link').href = '/textbook.html?chapter=' + chapter + '&page=' + pages[0];
  }
  function render() {
    const q = current(), index = state.deck.indexOf(state.current);
    rangeRetry.refresh();
    stats();
    $('question-card').hidden = !q; $('empty').hidden = !!q;
    $('order-note').textContent = state.order === 'random' ? (['1-4','8-9'].includes(chapter) ? chapterLabel + ' 중 선택한 범위 전체를 장·단원 경계 없이 섞습니다.' : '선택한 범위 안에서 단원 경계 없이 섞습니다.') + '  “다시 섞기”는 풀이 기록을 유지합니다.' : '교재의 단원·학습 항목 순서를 따라 학습합니다. 같은 항목의 관련 문항은 함께 배치됩니다.';
    $('reshuffle').disabled = state.order !== 'random' || state.deck.length < 2;
    if (!q) {
      $('empty-title').textContent = state.scope === 'wrong' ? '현재 범위에 남은 오답이 없습니다.' : state.scope === 'unanswered' ? '현재 범위의 문제를 모두 풀었습니다.' : '현재 범위에 문제가 없습니다.';
      $('empty-text').textContent = '학습 단원이나 범위를 바꾸어 계속 공부할 수 있습니다.';
      return;
    }
    $('position-text').textContent = '문제 ' + (index + 1) + ' / ' + state.deck.length;
    $('question-kind').textContent = q.kind === 'application' ? '공식 적용 연습' : '개념 확인';
    $('question-path').textContent = [q.sectionTitle, ...q.path].join(' › ');
    $('question-topic').textContent = q.topic;
    $('question-statement').textContent = q.statement;
    $('question-card').dataset.questionId = q.id;
    $('question-card').dataset.chapter = chapter;
    $('keywords').replaceChildren(...q.keywords.map(keyword => { const span = document.createElement('span'); span.textContent = keyword; return span; }));
    sources(q);
    const done = core.answered(state.answers, q.id), choice = state.answers[q.id];
    for (const [id, value] of [['choose-o', true], ['choose-x', false]]) {
      $(id).disabled = done;
      $(id).classList.toggle('selected', done && choice === value);
      $(id).setAttribute('aria-pressed', String(done && choice === value));
    }
    $('feedback').hidden = !done;
    $('feedback').classList.toggle('wrong', done && choice !== q.answer);
    $('feedback-title').textContent = done ? (choice === q.answer ? '정답입니다.' : '다시 확인해 보세요.') + ' 정답 ' + (q.answer ? 'O' : 'X') : '';
    $('explanation').textContent = done ? q.explanation : '';
    $('application-note').hidden = q.kind !== 'application';
    $('position').value = index + 1; $('position').max = state.deck.length;
    $('previous').disabled = index <= 0; $('next').disabled = index >= state.deck.length - 1;
  }
  function move(index) {
    if (!state || !Number.isInteger(index) || index < 0 || index >= state.deck.length) return;
    state.current = state.deck[index]; save(); render();
    $('question-statement').focus({ preventScroll: true });
    $('question-card').scrollIntoView({ block: 'nearest' });
  }
  function answer(value) {
    const q = current();
    if (!q || core.answered(state.answers, q.id)) return;
    state.answers[q.id] = value; save(); render();
  }
  function changeSettings() {
    state.section = $('section').value; state.scope = $('scope').value; state.order = $('order').value;
    state.current = null;
    core.rebuild(bank, state, true); save(); render();
  }
  $('choose-o').onclick = () => answer(true); $('choose-x').onclick = () => answer(false);
  $('previous').onclick = () => move(state.deck.indexOf(state.current) - 1);
  $('next').onclick = () => move(state.deck.indexOf(state.current) + 1);
  $('jump-form').onsubmit = event => { event.preventDefault(); move(Number($('position').value) - 1); };
  for (const id of ['section', 'scope', 'order']) $(id).onchange = changeSettings;
  $('reshuffle').onclick = () => { state.deck = core.shuffle(state.deck); state.current = state.deck[0] || null; save(); render(); };
  $('retry-question').onclick = () => { const q = current(); if (!q) return; delete state.answers[q.id]; save(); render(); };
  $('show-all').onclick = () => { $('section').value = 'all'; $('scope').value = 'all'; changeSettings(); };
  $('review-wrong').onclick = () => { $('section').value = 'all'; $('scope').value = 'wrong'; changeSettings(); };
  $('reload').onclick = () => location.reload();
  const rangeRetry = window.IEStudyRetry({
    open: show => show(),
    describe: () => {
      if (!bank || !state) return null;
      const ids = bank.questions.filter(q => state.section === 'all' || q.sectionId === state.section).map(q => q.id);
      return { key: chapter + ':' + state.section, whole: state.section === 'all', title: chapterLabel + (state.section === 'all' ? '' : ' · ' + (bank.sections.find(s => s.id === state.section)?.title || '선택 단원')), total: ids.length, answered: core.summary(bank, state.answers, ids).answered, drafts: 0 };
    },
    restart: () => { core.restartSection(bank, state); $('scope').value = state.scope; save(); render(); },
    focus: () => { $('question-statement').focus({ preventScroll: true }); $('question-card').scrollIntoView({ block: 'nearest' }); }
  });
  document.addEventListener('keydown', event => {
    if (!state || rangeRetry.isOpen() || event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
      event.isComposing || event.keyCode === 229 || event.target.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"])')) return;
    const key = event.key.toLowerCase();
    if (key === 'o' || key === '1' || event.code === 'KeyO') { event.preventDefault(); answer(true); }
    else if (key === 'x' || key === '2' || event.code === 'KeyX') { event.preventDefault(); answer(false); }
    else if (key === 'arrowleft') { event.preventDefault(); move(state.deck.indexOf(state.current) - 1); }
    else if (key === 'arrowright') { event.preventDefault(); move(state.deck.indexOf(state.current) + 1); }
    else if (key === 'enter' && current() && core.answered(state.answers, state.current) && !event.target.closest?.('button,a')) {
      event.preventDefault(); move(state.deck.indexOf(state.current) + 1);
    }
  });
  (async () => {
    try {
      const response = await fetch('/quiz-data-' + chapter + '.json');
      if (!response.ok) throw Error('Quiz bank HTTP ' + response.status);
      bank = await response.json();
      if (bank.chapter !== chapter || !Array.isArray(bank.questions) || !bank.questions.length) throw Error('Invalid quiz bank');
      byId = new Map(bank.questions.map(q => [q.id, q]));
      let saved;
      try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { storageWarning(); }
      state = core.rebuild(bank, core.restore(bank, saved));
      for (const section of bank.sections) {
        const option = document.createElement('option'); option.value = section.id;
        option.textContent = section.title + ' (' + bank.questions.filter(q => q.sectionId === section.id).length + '문항)';
        $('section').append(option);
      }
      for (const id of ['section', 'scope', 'order']) { $(id).value = state[id]; $(id).disabled = false; }
      $('bank-info').textContent = bank.title + ' · ' + bank.itemCount + '개 학습 항목 · ' + bank.keywordCount + '개 키워드 · ' + bank.questionCount + '문항';
      $('loading').hidden = true; save(); render();
    } catch (error) {
      $('loading').textContent = '문항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      $('reload').hidden = false; console.error(error);
    }
  })();
})();

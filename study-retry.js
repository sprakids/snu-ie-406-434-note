/* Shared, explicitly scoped restart UI. Opening/cancelling never clears records. */
(() => {
  'use strict';
  window.IEStudyRetry = options => {
    const button = document.getElementById('restart-range');
    const dialog = document.createElement('dialog');
    dialog.id = 'restart-dialog'; dialog.className = 'retry-dialog';
    dialog.setAttribute('aria-labelledby', 'restart-title'); dialog.setAttribute('aria-describedby', 'restart-details restart-note');
    dialog.innerHTML = '<h2 id="restart-title">처음부터 다시 풀까요?</h2><p id="restart-details"></p><p id="restart-note">표시된 범위의 풀이 기록과 미제출 초안을 지우고 첫 문제로 돌아갑니다. 학습 범위는 전체 문제로 바뀌며, 문제 순서 설정은 유지됩니다. 표시된 범위 밖의 기록과 다른 학습 방식의 기록은 유지됩니다.</p><div class="retry-dialog-actions"><button id="cancel-restart" type="button" autofocus>취소</button><button id="confirm-restart" class="primary confirm-restart" type="button">기록 지우고 다시 풀기</button></div>';
    document.body.append(dialog);
    const cancel = dialog.querySelector('#cancel-restart'), confirm = dialog.querySelector('#confirm-restart');
    let target = null;
    function refresh() {
      const info = options.describe();
      button.disabled = !info || !info.total;
      if (info) {
        button.textContent = info.whole ? '전체 다시 풀기' : '선택 단원 다시 풀기';
        button.title = info.title + ' 전체 ' + info.total + '문항을 처음부터 다시 풉니다.';
      }
    }
    function finish() { options.restart(); options.focus(); }
    button.addEventListener('click', () => options.open(() => {
      target = options.describe();
      if (!target?.total || dialog.open) return;
      const text = target.title + ' · 전체 ' + target.total + '문항\n풀이 기록 ' + target.answered + '문항 · 미제출 초안 ' + target.drafts + '문항';
      dialog.querySelector('#restart-details').textContent = text;
      if (typeof dialog.showModal !== 'function') { if (window.confirm(text + '\n\n' + dialog.querySelector('#restart-note').textContent)) finish(); return; }
      dialog.returnValue = ''; dialog.showModal(); cancel.focus();
    }));
    cancel.addEventListener('click', () => dialog.close('cancel'));
    confirm.addEventListener('click', () => {
      const latest = options.describe();
      if (!latest || latest.key !== target?.key) { dialog.close('cancel'); return; }
      options.restart(); dialog.close('restart');
    });
    dialog.addEventListener('close', () => { if (dialog.returnValue === 'restart') options.focus(); else button.focus({ preventScroll: true }); });
    refresh();
    return { refresh, isOpen: () => dialog.open };
  };
})();

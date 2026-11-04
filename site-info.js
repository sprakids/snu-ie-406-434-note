(() => {
  'use strict';
  // Finish a note's composition before leaving its iframe through the footer.
  document.addEventListener('click', async event => {
    const link = event.target.closest?.('[data-policy-links] a');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const safety = window.noteInputSafety || document.querySelector('.chapter-panel:not([hidden]) iframe')?.contentWindow?.noteInputSafety;
    if (!safety) return;
    event.preventDefault();
    await safety.settle();
    (link.target === '_top' ? window.top : window).location.assign(link.href);
  });

  const download = document.getElementById('download-records');
  if (!download) return;
  const keys = [
    ['ie1-4-cloze-v1', '1~4장 키워드'], ['ie7-cloze-v1', '7장 키워드'], ['ie8-9-cloze-v1', '8~9장 키워드'], ['ie10-cloze-v1', '10장 키워드'],
    ['snu-ie-ox-chapter-1-4-v1', '1~4장 OX'], ['snu-ie-ox-chapter-7-v1', '7장 OX'], ['snu-ie-ox-chapter-8-9-v1', '8~9장 OX'], ['snu-ie-ox-chapter-10-v1', '10장 OX'],
    ['snu-ie-multi-chapter-1-4-v1', '1~4장 다지선다'], ['snu-ie-multi-chapter-7-v1', '7장 다지선다'], ['snu-ie-multi-chapter-8-9-v1', '8~9장 다지선다'], ['snu-ie-multi-chapter-10-v1', '10장 다지선다'],
  ];
  const status = document.getElementById('record-status');
  function snapshot() {
    const records = {};
    for (const [key] of keys) {
      const value = localStorage.getItem(key);
      if (value !== null) records[key] = value;
    }
    return records;
  }
  function refresh() {
    try {
      const records = snapshot();
      document.getElementById('record-list').replaceChildren(...keys.map(([key, name]) => {
        const row = document.createElement('tr'), title = document.createElement('th'), value = document.createElement('td');
        title.scope = 'row'; title.textContent = name;
        value.textContent = Object.hasOwn(records, key) ? '저장된 기록 있음' : '저장된 기록 없음';
        row.append(title, value); return row;
      }));
      status.textContent = '현재 주소의 이 브라우저에 ' + Object.keys(records).length + '개 학습 기록 묶음이 있습니다.';
      download.disabled = false;
    } catch {
      status.textContent = '브라우저가 저장소 접근을 허용하지 않아 기록을 확인할 수 없습니다. 학습 화면의 개별 저장 기능을 확인해 주세요.';
      download.disabled = true;
    }
  }
  download.addEventListener('click', () => {
    let url;
    try {
      const data = { app: 'snu-ie-note-local-records', version: 1, exportedAt: new Date().toISOString(), records: snapshot() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = '산업공학의_이해_전체학습기록_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.append(anchor); anchor.click(); anchor.remove();
      status.textContent = '기록 파일 다운로드를 요청했습니다. 브라우저의 다운로드 목록에서 파일이 저장되었는지 확인해 주세요. 사이트에 저장된 원본 기록은 유지됩니다.';
    } catch {
      status.textContent = '기록 파일을 만들지 못했습니다. 브라우저의 저장소·다운로드 설정을 확인해 주세요.';
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  });
  window.addEventListener('storage', refresh);
  refresh();
})();

"""Idempotent navigation and notice integration for the multi-select page."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent

p = ROOT / 'index.html'
s = p.read_text(encoding='utf-8')
if 'id="open-multi"' not in s:
    s = s.replace('      <a class="book-button" id="open-textbook"', '      <a class="book-button" id="open-multi" href="/multi.html?chapter=1-4">다지선다</a>\n      <a class="book-button" id="open-textbook"')
    s = s.replace("document.getElementById('open-quiz').href='/quiz.html?chapter='+selected;", "document.getElementById('open-quiz').href='/quiz.html?chapter='+selected;\n        document.getElementById('open-multi').href='/multi.html?chapter='+selected;")
    s = s.replace("document.querySelectorAll('a[href^=\"/quiz.html\"]')", "document.querySelectorAll('a[href^=\"/quiz.html\"],a[href^=\"/multi.html\"]')")
    s = s.replace('키워드와 OX 퀴즈로 개념을 확인하고,', '키워드·OX·다지선다로 개념을 확인하고,')
for chapter, label in [('1-4','1~4장'),('7','7장'),('8-9','8~9장'),('10','10장')]:
    marker = f'<a class="secondary" href="/textbook.html?chapter={chapter}&amp;page='
    if f'aria-label="{label} 다지선다"' not in s:
        count = json.loads((ROOT / f'multi-data-{chapter}.json').read_text(encoding='utf-8'))['questionCount']
        s = s.replace(marker, f'<a class="secondary" href="/multi.html?chapter={chapter}" aria-label="{label} 다지선다">다지선다 · {count}문항</a>' + marker)
p.write_text(s, encoding='utf-8')

p = ROOT / 'quiz.html'
s = p.read_text(encoding='utf-8')
if 'id="multi-link"' not in s:
    s = s.replace('<a id="book-link"', '<a id="multi-link" href="/multi.html?chapter=7">다지선다</a><a id="book-link"')
p.write_text(s, encoding='utf-8')
p = ROOT / 'quiz.js'
s = p.read_text(encoding='utf-8')
if "$('multi-link')" not in s:
    s = s.replace("$('notes-link').href = '/#' + chapter;", "$('notes-link').href = '/#' + chapter;\n  $('multi-link').href = '/multi.html?chapter=' + chapter;")
p.write_text(s, encoding='utf-8')

p = ROOT / 'authoring/build-site-info.py'
s = p.read_text(encoding='utf-8')
s = s.replace('OX 퀴즈, 교재 보기', 'OX 퀴즈, 다지선다, 교재 보기')
marker = '<tr><th scope="row">내보내기·불러오기</th>'
if '<th scope="row">다지선다</th>' not in s:
    row = '<tr><th scope="row">다지선다</th><td>입력한 선지 조합과 임시 답안, 채점 결과, 풀이 위치·목록·순서, 선택한 단원·범위·선지 표기. 풀이와 입력을 이어가기 위해 사용합니다.</td><td>같은 브라우저 저장소. 사이트 데이터를 삭제할 때까지 보관하며 서버에 동기화하지 않습니다.</td></tr>\n'
    s = s.replace(marker, row + marker)
s = s.replace('키워드와 OX 기록은 따로 저장됩니다.', '키워드·OX·다지선다 기록은 각각 따로 저장됩니다.')
s = s.replace('키워드·OX 기록을 함께 보관', '키워드·OX·다지선다 기록을 함께 보관')
s = s.replace('OX는 답을 고른 뒤', 'OX와 다지선다는 답을 제출한 뒤')
s = s.replace('키워드·OX·설정까지 삭제', '키워드·OX·다지선다·설정까지 삭제')
s = s.replace('OX의 순서 변경과 다시 섞기', 'OX와 다지선다의 순서 변경과 다시 섞기')
s = s.replace('<a href="/quiz.html?chapter=1-4">OX 퀴즈</a></nav></header>', '<a href="/quiz.html?chapter=1-4">OX 퀴즈</a><a href="/multi.html?chapter=1-4">다지선다</a></nav></header>')
if '<section id="multi-help">' not in s:
    marker = '<section id="records">'
    guide = '<section id="multi-help"><h2>다지선다 입력과 채점</h2><p>각 문제의 다섯 선지 중 옳은 것을 모두 입력합니다. ㄱㄴㄷ과 123은 같은 조합이며, ㄷ ㄱ처럼 순서를 바꾸거나 띄어 써도 됩니다. 선지 표기는 한글·숫자 중 바꿀 수 있습니다. 같은 선지의 중복 입력이나 1~5 밖의 기호는 입력 오류로 안내하며 풀이로 집계하지 않습니다.</p><p>입력칸에서 Enter 또는 채점하기를 누르면 정답 조합, 빠뜨린 선지, 제외할 선지와 다섯 선지의 참·거짓 및 교재 근거를 확인할 수 있습니다. 정답 개수는 1~4개이며 정확히 일치해야 정답입니다. 핵심 개념 및 키워드를 중심으로 같은 학습 항목·단원의 관련 개념을 함께 비교합니다. 선지별 출처가 다를 수 있으므로 각 쪽수를 확인하세요.</p><p>문제 순서와 선지 표기를 바꾸어도 풀이 기록은 유지됩니다. 한 문제의 선지 위치는 고정하므로 저장된 답의 의미가 달라지지 않습니다. 입력 중에는 답안을 가공하지 않으며 한글 조합 중 Enter는 채점에서 제외합니다.</p></section>\n'
    s = s.replace(marker, guide + marker)
s = s.replace("['index.html', 'quiz.html', 'textbook.html'", "['index.html', 'quiz.html', 'multi.html', 'textbook.html'")
s = s.replace('linked all seven study surfaces.', 'linked all eight study surfaces.')
p.write_text(s, encoding='utf-8')
print('Integrated multi-select navigation and local-record notices.')

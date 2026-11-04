"""Import learning data only; keep the site's tested input controller and grading UI."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r'C:\Users\김예준\.codex\codex-remote-attachments\01a16490-3745-7393-9de7-1dc2cef4484f\59E85335-9228-4D3C-BBF8-82A39DE4DFFB')
attachment = next(SOURCE.glob('*.html')).read_text(encoding='utf-8-sig')
sections = json.loads(re.search(r'<script id="content-data"[^>]*>(.*?)</script>', attachment, re.S)[1])
terms = re.search(r'<script id="explanation-data"[^>]*>(.*?)</script>', attachment, re.S)[1]
aliases = re.search(r'const aliasGroups=(\[.*?\])\.map\(g=>g\.map\(norm\)\);', attachment, re.S)[1]
template = (ROOT / 'chapter-10.html').read_text(encoding='utf-8-sig')
for chapter, section in [('1-4', {'title': '1~4장 통합', 'page': '23–127'})]:
    title = '기초 · 시스템 · 산업분석 · 경영설계'
    text = re.sub(r'(<script id="content-data"[^>]*>).*?(</script>)', lambda m: m[1] + json.dumps(sections, ensure_ascii=False, separators=(',', ':')) + m[2], template, flags=re.S)
    text = re.sub(r'(<script id="explanation-data"[^>]*>).*?(</script>)', lambda m: m[1] + terms + m[2], text, flags=re.S)
    text = re.sub(r'const synonymGroups=\[.*?\];', lambda m: 'const synonymGroups=' + aliases + ';', text, flags=re.S)
    text = re.sub(r'const authorNames=\{.*?\};', 'const authorNames={};', text)
    text = text.replace("view='psych'", "view='ch1'")
    text = text.replace('ie10-cloze-v1', f'ie{chapter}-cloze-v1').replace('chapter=10&amp;', f'chapter={chapter}&amp;')
    text = text.replace('10장 인적자원관리', section['title']).replace('CHAPTER 10 / 인적자원관리', f'CHAPTERS 01–04 / {title}')
    text = text.replace('<title>10장 키워드', '<title>1~4장 통합 키워드')
    text = text.replace('<div class="mark">10</div>', '<div class="mark">1–4</div>')
    text = text.replace('교재 303–353쪽', '교재 23–43 · 47–58 · 65–88 · 93–127쪽').replace('10장_빈칸노트_학습기록.json', '1~4장_빈칸노트_학습기록.json')
    text = text.replace('사진의 개념 트리 형식을 적용한', '첨부 노트의 개념 구조를 유지한')
    footnote = '<details class="footnote"><summary>자료 기준 · 채점 방식 · 저장 안내</summary>'
    footnote += '<p>사용자 제공 1~4장 키워드 빈칸노트의 내용과 개념 구조를 유지한 통합 노트입니다. 교재 『산업경영공학 시스템 접근』 1장 23–43쪽, 2장 47–58쪽, 3장 65–88쪽, 4장 93–127쪽의 학습용 요약입니다.</p>'
    footnote += '<p>등록된 동의어·약어와 일반적인 조사·서술 어미, 나열 순서 차이를 허용합니다. 의미가 다른 단어를 부분 일치로 인정하지 않습니다. 문장 전체와 긴 제목은 모범답안과 의미를 비교해 직접 평가할 수 있습니다.</p>'
    footnote += '<p>교재의 역사적 분류와 수치의 한계, 전방·후방통합 사례의 용어 혼동 등 첨부 노트의 주석을 유지했습니다. 항목의 쪽수를 눌러 교재와 비교할 수 있습니다.</p>'
    footnote += '<p>입력·채점·난도 기록은 1~4장을 묶어 이 브라우저에 저장됩니다. 학습기록을 JSON으로 저장하거나 불러올 수 있습니다. 전체 초기화는 1~4장 기록에 적용됩니다.</p></details>'
    text = re.sub(r'<details class="footnote">.*?</details>', lambda m: footnote, text, flags=re.S)
    # The shared implementation has no chapter-specific matching assumptions.
    text = text.replace('// Textbook English names: pp. 307-308, 313, 316, 324, 346, 351.', '// Registered aliases from the supplied 1–4 chapter notes.')
    (ROOT / f'chapter-{chapter}.html').write_text(text, encoding='utf-8')
    print(section['title'])

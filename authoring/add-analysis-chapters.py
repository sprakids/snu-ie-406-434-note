"""Import the supplied 8–9 chapter content into the site's IME-safe note UI."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r'C:\Users\김예준\.codex\codex-remote-attachments\01a16490-3745-7393-9de7-1dc2cef4484f\B6D40B5E-2779-4389-82AC-366DF5022158')
attachment = next(SOURCE.glob('*.html')).read_text(encoding='utf-8-sig')
sections = json.loads(re.search(r'<script id="content-data"[^>]*>(.*?)</script>', attachment, re.S)[1])
terms = re.search(r'<script id="explanation-data"[^>]*>(.*?)</script>', attachment, re.S)[1]
aliases = re.search(r'const aliasGroups=(\[.*?\])\.map\(g=>g\.map\(norm\)\);', attachment, re.S)[1]
text = (ROOT / 'chapter-1-4.html').read_text(encoding='utf-8')
text = re.sub(r'(<script id="content-data"[^>]*>).*?(</script>)', lambda m: m[1] + json.dumps(sections, ensure_ascii=False, separators=(',', ':')) + m[2], text, flags=re.S)
text = re.sub(r'(<script id="explanation-data"[^>]*>).*?(</script>)', lambda m: m[1] + terms + m[2], text, flags=re.S)
text = re.sub(r'const synonymGroups=\[.*?\];', lambda m: 'const synonymGroups=' + aliases + ';', text, flags=re.S)
text = text.replace('1~4장', '8~9장').replace('CHAPTERS 01–04 / 기초 · 시스템 · 산업분석 · 경영설계', 'CHAPTERS 08–09 / 수리적 분석 · 통계적 분석')
text = text.replace('<div class="mark">1–4</div>', '<div class="mark">8–9</div>').replace('ie1-4-cloze-v1', 'ie8-9-cloze-v1')
text = text.replace("view='ch1'", "view='ch8'").replace('chapter=1-4&amp;', 'chapter=8-9&amp;')
text = text.replace('교재 23–43 · 47–58 · 65–88 · 93–127쪽', '교재 249–262 · 267–295쪽')
start = text.index('const norm=')
end = text.index('\n', start)
# Preserve decimal points, negative signs, division and inequality directions.
# Avoid lookbehind, which is unavailable in some older iPad Safari versions.
text = text[:start] + r"const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[−–—]/g,'-').replace(/[\s·ㆍ,，:：;；()（）!?]/g,'').replace(/([a-z가-힣])-(?=[a-z가-힣])/g,'$1');" + text[end:]
text = text.replace("function listMatch(answer,value){", "function listMatch(answer,value){if(/[0-9+*/^²³=<>≤≥−±]/.test(answer))return false;")
text = text.replace('function surfaceForms(value){', 'function surfaceForms(value,preserveMath=false){').replace("const s=String(value).normalize('NFKC').trim()", "const s=(preserveMath?String(value):String(value).normalize('NFKC')).trim()")
text = text.replace('function isCorrect(b,value){', r'''function mathKey(value){const powers={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
 return String(value).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g,s=>'^'+[...s].map(c=>powers[c]).join('')).normalize('NFKC').toLowerCase().replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/\s/g,'');}
function isCorrect(b,value){''')
start = text.index(' if(/^\\d+(?:\\.\\d+)?$/.test(b.answers[0])){')
end = text.index(" if(b.answers[0].includes('±'))", start)
text = text[:start] + r''' const numeric=s=>/^[+-]?\d+(?:,\d{3})*(?:\.\d+)?$/.test(s);
 if(b.answers.some(a=>numeric(a))){
  return [...surfaceForms(value)].some(raw=>{const v=raw.normalize('NFKC').replace(/−/g,'-').trim();
   return numeric(v)?b.answers.some(a=>numeric(a)&&Number(a.replaceAll(',',''))===Number(v.replaceAll(',',''))):b.answers.some(a=>!numeric(a)&&matchesTerm(a,v));});
 }
''' + text[end:]
text = text.replace(" if(b.answers[0].includes('±'))", r" if(b.answers.some(a=>/[+*/^=<>≤≥−±⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/.test(a)||/\d.*-|-\d/.test(a)))return [...surfaceForms(value,true)].some(v=>b.answers.some(a=>mathKey(a)===mathKey(v)));" + '\n' + " if(b.answers[0].includes('±'))")
footnote = '''<details class="footnote"><summary>자료 기준 · 채점 방식 · 저장 안내</summary><p>사용자 제공 8·9장 키워드 빈칸노트의 내용과 개념 구조를 유지한 통합 노트입니다. 교재 『산업경영공학 시스템 접근』 8장 수리적 분석 249–262쪽, 9장 통계적 분석 267–295쪽의 학습용 요약입니다.</p><p>등록된 동의어·약어와 일반적인 조사·어미를 허용합니다. 숫자의 부호·소수점, 분수의 분자·분모, 부등호 방향은 구별합니다. 식의 임의 변형을 자동으로 증명하는 채점기는 아닙니다. 문장 전체와 긴 제목은 모범답안과 비교하여 직접 확인할 수 있습니다.</p><p>최적해의 존재 조건, 미분·최대우도·신뢰구간·중심극한정리·인과성·시뮬레이션 검증의 구분 등 첨부 자료의 주석을 유지했습니다. 항목의 교재 쪽수를 눌러 원문과 비교할 수 있습니다.</p><p>입력·채점·난도는 8~9장을 묶어 이 브라우저에 저장됩니다. ‘학습기록 저장’으로 개별 JSON을 보관할 수 있고, 전체 초기화는 두 장의 키워드 기록에 함께 적용됩니다.</p></details>'''
text = re.sub(r'<details class="footnote">.*?</details>', lambda m: footnote, text, flags=re.S)
text = text.replace('// Registered aliases from the supplied 1–4 chapter notes.', '// Registered aliases from the supplied 8–9 chapter notes.')
(ROOT / 'chapter-8-9.html').write_text(text, encoding='utf-8')
print('Imported both chapters with original content, aliases, and stable blank IDs.')

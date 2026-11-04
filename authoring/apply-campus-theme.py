"""Apply the shared visual layer without changing study data or input handlers."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
LOGO = '<img class="campus-brand-logo" src="/assets/snu-ie-logo.jpg" width="210" height="70" alt="서울대학교 산업공학과">'
LOGO_LINK = '<a class="campus-logo-link" href="/" aria-label="메인 화면으로 이동">' + LOGO + '</a>'
LOGO_ART = '<span class="campus-logo-art">' + LOGO + '<img class="campus-brand-logo campus-logo-dark" src="/assets/snu-ie-logo-dark.png" width="210" height="70" alt="" aria-hidden="true"></span>'
TOGGLE = '<button type="button" class="theme-toggle" role="switch" aria-checked="false" aria-label="다크 모드" data-theme-toggle title="다크 모드로 전환"><span class="theme-label" aria-hidden="true">다크 모드</span><span class="theme-track" aria-hidden="true"><span class="theme-knob"></span></span></button>'
for path in ROOT.glob('*.html'):
    source = path.read_text(encoding='utf-8')
    if path.name == 'index.html':
        classes = 'campus-home'
        logo = '<img class="campus-brand-logo" src="/assets/snu-ie-logo.jpg" width="210" height="70" alt="서울대학교 산업공학과">'
        source = source.replace('<h1>산업공학의 이해 빈칸노트</h1>', '<h1 aria-label="산업공학의 이해 빈칸노트">' + logo + '<span class="campus-brand-caption">개인 학습 노트</span></h1>')
        source = re.sub(r'<img class="campus-brand-logo"[^>]*>', logo, source)
    elif path.name.startswith('chapter-'):
        classes = 'campus-note'
    elif path.name in ('quiz.html', 'multi.html'):
        classes = 'campus-quiz' + (' campus-multi' if path.name == 'multi.html' else '')
    elif path.name == 'textbook.html':
        classes = 'campus-textbook'
    elif path.name == 'input-check.html':
        classes = 'campus-input-check'
    else:
        classes = 'campus-info'
    match = re.search(r'<body(?:\s+class="([^"]*)")?\s*>', source)
    assert match, path.name
    current = (match.group(1) or '').split()
    for value in classes.split():
        if value not in current:
            current.append(value)
    source = source[:match.start()] + '<body class="' + ' '.join(current) + '">' + source[match.end():]
    if 'class="campus-logo-link"' not in source and ' campus-logo-link"' not in source:
        if path.name == 'index.html':
            source = source.replace(LOGO, LOGO_LINK, 1)
        elif path.name in ('quiz.html', 'multi.html'):
            source = source.replace('<a class="site-name" href="/">산업공학의 이해 빈칸노트</a>', '<a class="site-name campus-logo-link" href="/" aria-label="메인 화면으로 이동">' + LOGO + '<span class="campus-brand-caption">개인 학습 노트</span></a>')
        elif path.name.startswith('chapter-'):
            source = re.sub(r'<div class="mark">.*?</div>', lambda _: LOGO_LINK, source, count=1)
        elif path.name == 'textbook.html':
            source = source.replace('<div class="title-row">', '<div class="title-row">' + LOGO_LINK, 1)
        elif path.name == 'input-check.html':
            source = re.sub(r'(<body[^>]*>)', lambda m: m[1] + '<header class="campus-utility-header">' + LOGO_LINK + '</header>', source, count=1)
        else:
            source = source.replace('<a class="brand" href="/">산업공학의 이해 빈칸노트</a>', '<a class="brand campus-logo-link" href="/" aria-label="메인 화면으로 이동">' + LOGO + '<span class="campus-brand-caption">개인 학습 노트</span></a>')
    assert source.count('class="campus-brand-logo"') == 1 and 'aria-label="메인 화면으로 이동"' in source, path.name
    if 'class="campus-logo-art"' not in source:
        source = source.replace(LOGO, LOGO_ART, 1)
    if 'data-theme-toggle' not in source:
        if path.name == 'index.html':
            source = re.sub(r'(<a class="book-button" id="open-textbook"[^>]*>.*?</a>)', lambda m: m[1] + TOGGLE, source, count=1)
        else:
            source = source.replace('</header>', TOGGLE + '</header>', 1)
    if 'src="/campus-theme.js"' not in source:
        source = source.replace('<head>', '<head><script src="/campus-theme.js"></script>', 1)
    if 'href="/campus-theme.css"' not in source:
        source = source.replace('</head>', '<link rel="stylesheet" href="/campus-theme.css"><script defer src="/campus-curves.js"></script></head>')
    if '<meta name="theme-color"' not in source:
        source = source.replace('</head>', '<meta name="theme-color" content="#19398a"></head>')
    assert source.count('data-theme-toggle') == 1 and source.count('class="campus-logo-art"') == 1, path.name
    if path.name == 'privacy.html' and 'id="theme-storage"' not in source:
        source = source.replace('<tr><th scope="row">OX 퀴즈</th>', '<tr id="theme-storage"><th scope="row">화면 설정</th><td>직접 선택한 라이트·다크 모드만 저장합니다. 선택 전에는 기기의 화면 모드를 따릅니다.</td><td>브라우저 저장소의 snu-ie-theme-v1 항목. 사이트 데이터를 삭제할 때까지 보관하며 서버로 전송하지 않습니다.</td></tr><tr><th scope="row">OX 퀴즈</th>')
        source = source.replace('버전 1.1', '버전 1.2')
    if path.name == 'help.html' and 'id="theme-help"' not in source:
        source = source.replace('<section id="records">', '<section id="theme-help"><h2>화면 모드</h2><p>상단의 다크 모드 스위치로 라이트·다크 모드를 바꿉니다. 처음에는 기기의 설정을 따르며, 직접 선택한 뒤에는 이 브라우저에서 선택을 유지합니다. 키워드·OX·다지선다·교재·안내 페이지에 같은 모드를 적용합니다. 교재 이미지는 원본 색상을 유지합니다. 기기의 동작 줄이기를 켜면 전환 애니메이션을 줄입니다.</p></section><section id="records">')
    if 'src="/campus-navigation.js"' not in source:
        source = source.replace('</head>', '<script defer src="/campus-navigation.js"></script></head>')
    if path.name == 'help.html' and 'id="multi-click-help"' not in source:
        source = source.replace('각 문제의 다섯 선지 중 옳은 것을 모두 입력합니다.', '각 문제의 다섯 선지 중 옳은 것을 모두 눌러 선택하거나 입력합니다.')
        source = source.replace('<section id="multi-help"><h2>다지선다 입력과 채점</h2>', '<section id="multi-help"><h2>다지선다 입력과 채점</h2><p id="multi-click-help">선지 카드나 체크칸을 누르면 선택·해제되며 입력칸에도 같은 조합이 표시됩니다. 직접 입력한 조합도 체크칸에 반영됩니다. 교재 쪽수 링크는 선택을 바꾸지 않고 교재를 엽니다. 선택 후 채점하기를 누르며, 채점한 선지는 다시 풀기를 누른 뒤 바꿀 수 있습니다. 키보드로는 Tab으로 체크칸에 이동한 뒤 Space로 선택할 수 있습니다.</p>')
    if 'href="/campus.css"' not in source:
        source = source.replace('</head>', '<link rel="stylesheet" href="/campus.css"></head>')
    if 'src="/campus-effects.js"' not in source:
        source = source.replace('</head>', '<link rel="stylesheet" href="/campus-effects.css"><script defer src="/campus-effects.js"></script></head>')
    if path.name == 'about.html' and 'id="design-sources"' not in source:
        section = '''<section id="design-sources"><h2>디자인과 글꼴 출처</h2><p>상단 메뉴와 글꼴은 <a href="https://cba.snu.ac.kr/" target="_blank" rel="noopener">서울대학교 경영대학 홈페이지</a>를 참고했습니다. 로고는 사용자가 제공한 <a href="https://ie.snu.ac.kr/" target="_blank" rel="noopener">서울대학교 산업공학과</a> 이미지를 사용하며, 이 사이트는 학생 개인이 운영하는 학습용 서비스입니다.</p><p>제목에는 Gmarket Sans Bold, 본문에는 Noto Sans KR, 일부 영문·숫자에는 Montserrat를 사용합니다. 글꼴은 사이트에서 직접 제공하며 외부 글꼴 서버로 접속하지 않습니다. Noto Sans KR은 한글 전체와 사이트에서 사용하는 문자 위주로 용량을 줄였습니다.</p><p class="small">글꼴 라이선스: <a href="/assets/fonts/GmarketSans-LICENSE.txt">Gmarket Sans</a> · <a href="/assets/fonts/NotoSansKR-OFL.txt">Noto Sans KR</a> · <a href="/assets/fonts/Montserrat-OFL.txt">Montserrat</a></p></section>'''
        source = source.replace('<section id="copyright">', section + '<section id="copyright">')
    if path.name == 'about.html':
        source = source.replace('로고는 <a href="https://ie.snu.ac.kr/" target="_blank" rel="noopener">서울대학교 산업공학과 홈페이지</a>의 자료이며,', '로고는 사용자가 제공한 <a href="https://ie.snu.ac.kr/" target="_blank" rel="noopener">서울대학교 산업공학과</a> 이미지를 사용하며,')
    # The menu/theme color should agree with the visible top navigation.
    source = re.sub(r'(<meta name="theme-color" content=")[^"]+', r'\g<1>#19398a', source)
    path.write_text(source, encoding='utf-8')
print('Applied shared typography and rounded theme to all study surfaces.')

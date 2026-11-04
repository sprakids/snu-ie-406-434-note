"""Site notices based on the static app's actual data flows, reviewed 2026-10-23."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATE = '2026년 10월 23일'
OPERATOR = '산업공학과 26학번 김예준'
EMAIL = 'sprakids@snu.ac.kr'
ROUTES = [('privacy.html', '개인정보처리방침'), ('terms.html', '이용안내·약관'), ('about.html', '자료 출처·운영자'), ('help.html', '학습기록 관리·도움말')]

def footer(top=False):
    links = ''.join(f'<a href="/{route}"' + (' target="_top"' if top else '') + (' class="privacy-link"' if route == 'privacy.html' else '') + f'>{label}</a>' for route, label in ROUTES)
    return f'<div class="policy-footer"><nav aria-label="사이트 안내" data-policy-links>{links}</nav><p class="operator">운영 · {OPERATOR} · <a href="mailto:{EMAIL}">{EMAIL}</a></p><p>개인 학습용 서비스 · 교재와 원자료의 권리는 각 권리자에게 있습니다.</p></div>'

def contact():
    return f'<div class="info-contact"><p><strong>운영자 · 개인정보 보호 담당자</strong></p><p>{OPERATOR}</p><p><a href="mailto:{EMAIL}">{EMAIL}</a></p></div>'

privacy = '''
<div class="info-summary"><div><strong>회원가입 없이 학습</strong><p>이름·학번·전화번호를 입력받는 가입 기능이 없습니다.</p></div><div><strong>학습 기록은 내 브라우저에</strong><p>답안·진도·난도는 기기에 저장되며 운영자 서버에 업로드하지 않습니다.</p></div><div><strong>접속 정보는 별도 안내</strong><p>페이지를 제공하는 Vercel은 네트워크·보안 정보를 처리할 수 있습니다.</p></div></div>
<div class="info-content">
<section id="scope"><h2>1. 적용 범위와 운영자</h2><p>이 방침은 ‘산업공학의 이해 빈칸노트’의 키워드 학습, OX 퀴즈, 다지선다, 교재 보기와 안내 페이지에 적용됩니다. 무료 개인 학습 서비스를 운영하면서 어떤 정보가 어디에 저장되는지 안내합니다.</p>''' + contact() + '''</section>
<section id="data"><h2>2. 처리하는 정보와 목적</h2>
<div class="info-table-wrap"><table><thead><tr><th scope="col">구분</th><th scope="col">항목·목적</th><th scope="col">처리 위치·보유 기준</th></tr></thead><tbody>
<tr><th scope="row">키워드 학습</th><td>입력한 답안, 채점·직접 확인·오답 기록, 난도와 빈칸 배치 설정. 이어서 학습하고 복습하기 위해 사용합니다.</td><td>현재 사이트 주소의 브라우저 저장소(localStorage). 초기화하거나 사이트 데이터를 삭제할 때까지 저장되며 브라우저 설정에 따라 먼저 지워질 수 있습니다.</td></tr>
<tr><th scope="row">OX 퀴즈</th><td>선택한 O/X, 풀이 위치, 문제 목록·순서, 선택한 장·단원·범위. 풀이 기록과 무작위 순서를 복원하기 위해 사용합니다.</td><td>같은 브라우저 저장소. 사이트 데이터를 삭제할 때까지 보관하며 서버에 동기화하지 않습니다.</td></tr>
<tr><th scope="row">다지선다</th><td>입력한 선지 조합과 임시 답안, 채점 결과, 풀이 위치·목록·순서·선지 배치, 선택한 단원·범위·선지 표기. 풀이와 입력을 이어가기 위해 사용합니다.</td><td>같은 브라우저 저장소. 사이트 데이터를 삭제할 때까지 보관하며 서버에 동기화하지 않습니다.</td></tr>
<tr><th scope="row">내보내기·불러오기</th><td>이용자가 저장·선택한 학습기록 JSON 파일. 학습 기록 보관·복원 또는 내용 확인에 사용합니다.</td><td>파일 처리는 브라우저 안에서 수행합니다. 다운로드한 파일은 이용자가 직접 삭제할 때까지 기기에 남습니다.</td></tr>
<tr><th scope="row">자발적인 이메일 문의</th><td>회신 이메일 주소, 보낸 사람이 제공한 이름·문의 내용·첨부파일. 문의·권리행사·오류 신고를 처리하기 위해 사용합니다.</td><td>운영자가 사용하는 이메일함. 문의 처리가 끝나면 지체 없이 삭제하며, 법령상 보관이 필요한 경우 해당 근거와 기간에 따라 구분하여 보관합니다.</td></tr>
<tr><th scope="row">웹 접속</th><td>IP 주소, 접속한 URL·시각, 브라우저·기기 정보 등 요청에 수반되는 기술 정보. 페이지 전송·보안·장애 대응에 사용될 수 있습니다.</td><td>호스팅 제공자 Vercel의 인프라. 아래 호스팅 안내와 제공자의 보관 기준을 확인해 주세요.</td></tr>
</tbody></table></div>
<p>사이트에는 회원가입, 결제, 댓글·게시판, 위치·카메라·마이크 요청 기능이 없습니다. 답안을 외부 AI에 보내거나 AI로 의미를 판단하는 기능도 없습니다. 채점은 브라우저에서 등록된 정답과 규칙을 비교하는 학습 보조 기능입니다.</p></section>
<section id="hosting"><h2>3. 호스팅·외부 서비스와 국외 처리</h2><p>사이트 파일과 교재 페이지는 <strong>Vercel Inc.</strong>를 통해 전송됩니다. 이 과정에서 접속 기술 정보가 Vercel에 전달됩니다. 브라우저 안에 저장된 답안·학습 기록은 이 전송에 포함하지 않습니다.</p>
<dl><dt>제공자·연락처</dt><dd>Vercel Inc. · 미국 소재 · <a href="mailto:privacy@vercel.com">privacy@vercel.com</a></dd><dt>처리 목적·시점·방법</dt><dd>사이트 접속 시 네트워크 요청을 통한 콘텐츠 제공, 서비스 운영·보안 및 장애 대응.</dd><dt>처리 국가</dt><dd>Vercel은 미국과 서비스를 운영하는 다른 국가에서 정보를 처리할 수 있다고 안내합니다. 실제 요청의 처리 위치는 제공자의 네트워크 운영에 따라 달라집니다.</dd><dt>보유·삭제 기준</dt><dd>Vercel은 서비스 제공·법적 의무 등 목적에 필요한 기간 동안 보관하고, 필요가 없어지면 삭제·익명화한다고 안내합니다. 모든 접속 정보에 동일하게 적용되는 고정 보관일수는 확인되지 않았으므로 임의의 일수를 약속하지 않습니다.</dd></dl>
<p>접속 정보 처리를 원하지 않으면 사이트 접속을 종료할 수 있습니다. 웹페이지 제공에 필요한 네트워크 전송만 따로 끄고 이 사이트를 이용하는 기능은 없습니다. 관련 요청은 운영자 또는 Vercel에 문의할 수 있습니다. <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel 개인정보 안내 ↗</a></p>
<p>운영자는 학습 기록을 광고·마케팅 목적으로 제3자에게 판매·제공하지 않습니다. 사이트에 별도의 광고, 방문 분석, 세션 녹화 SDK를 설치하지 않았습니다. 외부 링크나 이메일 앱을 직접 열면 해당 서비스의 개인정보 처리 기준이 적용됩니다.</p></section>
<section id="storage"><h2>4. 쿠키와 브라우저 저장소</h2><p>학습 기능은 쿠키를 직접 설정하는 대신 localStorage를 사용합니다. 이 저장소는 탭을 닫아도 남을 수 있습니다. 같은 주소·같은 브라우저 프로필에서 다시 열 때 기록을 읽으며, 다른 기기·브라우저·사이트 주소로 자동 이동하지 않습니다.</p><p>브라우저에서 저장소를 제한하면 자동 저장·복원이 동작하지 않을 수 있습니다. 현재 저장된 기록 확인과 파일 내려받기, 삭제 방법은 <a href="/help.html#records">학습기록 관리</a>에서 확인할 수 있습니다.</p></section>
<section id="rights"><h2>5. 확인·수정·삭제와 권리행사</h2><p>이용자는 답안을 직접 수정하고, 키워드 노트의 초기화 기능이나 브라우저의 사이트 데이터 삭제로 기록을 지울 수 있습니다. 현재 브라우저의 기록을 JSON으로 내려받을 수도 있습니다. 운영자는 기기 안의 기록에 원격으로 접근하거나 삭제·복구할 수 없습니다.</p><p>운영자가 받은 문의 등 보유 정보에 대해서는 열람, 정정·삭제, 처리정지 또는 동의 철회를 위 문의 이메일로 요청할 수 있습니다. 대리인을 통한 요청도 가능하며, 요청 확인에 필요한 최소한의 정보만 확인합니다. 법령에 따른 제한이나 보관 의무가 있다면 그 이유를 안내합니다.</p><p>브라우저 저장소의 항목을 제거하면 그 기록을 더 이상 읽지 않습니다. 내려받은 JSON 파일과 브라우저·기기 백업은 별도로 남을 수 있으므로 이용자가 함께 관리해야 합니다.</p></section>
<section id="security"><h2>6. 보호 조치</h2><p>공개 사이트는 HTTPS로 제공하며, 학습 기록용 서버 데이터베이스를 운영하지 않고 외부 전송을 줄이는 구조로 구성했습니다. 브라우저 기능 권한과 외부 사이트에 전달되는 참조 정보도 제한합니다.</p><p>브라우저 저장소 자체를 사이트가 별도로 암호화하지는 않습니다. 같은 기기·브라우저 프로필을 사용하는 사람은 기록에 접근할 수 있으므로 공용 기기에서는 학습을 마친 뒤 해당 사이트의 데이터를 삭제해 주세요.</p></section>
<section id="changes"><h2>7. 방침 변경과 문의</h2><p>이 방침은 2026년 10월 23일부터 적용됩니다. 처리 항목·외부 서비스·보관 방식이 바뀌면 이 페이지에 변경 내용과 시행일을 안내합니다. 필요한 동의가 있다면 새 처리를 시작하기 전에 별도로 받겠습니다.</p><p>개인정보 관련 문의는 <a href="mailto:sprakids@snu.ac.kr">sprakids@snu.ac.kr</a>로 보내 주세요. 공적 상담·권리행사 안내는 <a href="https://www.privacy.go.kr/" target="_blank" rel="noopener noreferrer">개인정보 포털 ↗</a>에서 확인할 수 있습니다.</p><p class="small">작성 참고: <a href="https://www.privacy.go.kr/front/bbs/bbsList.do?bbsNo=BBSMSTR_000000000049" target="_blank" rel="noopener noreferrer">개인정보보호위원회 안내서</a>, <a href="https://www.law.go.kr/법령/개인정보보호법/제30조" target="_blank" rel="noopener noreferrer">개인정보 보호법 제30조</a>. 실제 서비스의 동작과 제공자 공개 자료를 기준으로 작성했습니다.</p></section>
</div>'''

terms = '''<div class="info-content">
<section><h2>1. 서비스의 목적</h2><p>‘산업공학의 이해 빈칸노트’는 산업공학 개념을 복습하기 위한 무료 개인 학습 보조 서비스입니다. 키워드 빈칸 노트, OX 퀴즈, 다지선다, 교재 페이지 보기를 제공합니다. 학교·강의 담당자·출판사가 제공하거나 보증하는 공식 서비스가 아닙니다.</p></section>
<section><h2>2. 학습 자료와 채점</h2><p>노트와 퀴즈는 제공된 자료를 학습용으로 정리한 것입니다. 요약·채점 규칙에 오류나 누락이 있을 수 있으며, 시험 범위·출제 여부·성적을 보장하지 않습니다. 각 문항의 교재 쪽수와 원자료를 함께 확인해 주세요.</p><p>자동 채점은 등록된 정답·대체 표현과 규칙을 비교합니다. 표현이 다양할 수 있는 긴 답안은 모범답안과 비교하여 직접 판단할 수 있습니다. 역사적 분류, 예시 수치, 교재 문구의 주의사항은 해당 항목의 설명을 확인해 주세요.</p></section>
<section><h2>3. 학습기록 관리</h2><p>학습 기록은 현재 사이트 주소의 브라우저 저장소에 남습니다. 계정·클라우드 동기화·운영자 측 복구 기능은 없습니다. 브라우저 정리, 비공개 모드 종료, 주소·기기 변경 등에 따라 기록이 이어지지 않을 수 있으므로 필요한 기록은 파일로 보관해 주세요.</p><p>초기화 버튼은 화면에 안내된 범위의 기록을 지웁니다. ‘1~4장 통합’의 전체 초기화는 네 장의 키워드 기록을 함께 지웁니다. 자세한 방법은 <a href="/help.html#records">학습기록 관리</a>를 확인해 주세요.</p></section>
<section><h2>4. 자료의 권리와 이용</h2><p>교재 원문·이미지와 원자료의 권리는 각 권리자에게 있습니다. 출처 표시는 원자료의 이용·재배포 허락을 대신하지 않습니다. 이 사이트는 교재나 원자료에 대한 별도의 공개 재이용 라이선스를 부여하지 않습니다.</p><p>권리를 침해하는 재배포, 개인정보를 포함한 자료의 무단 공개, 서비스의 정상 동작을 방해하는 행위를 삼가 주세요. 저작권·삭제 요청은 <a href="/about.html#contact">운영자 문의</a>로 접수할 수 있습니다.</p></section>
<section><h2>5. 변경·중단과 책임</h2><p>자료 보완, 오류 수정, 호스팅 상황에 따라 서비스 내용이 변경되거나 일시 중단될 수 있습니다. 학습 기록이나 자료 이용에 영향을 주는 중요한 변경은 가능한 범위에서 사이트에 안내합니다.</p><p>이 안내는 관계 법령에 따른 이용자의 권리나 운영자의 책임을 배제하기 위한 것이 아닙니다. 서비스 이용 중 문제나 잘못된 설명을 발견하면 페이지 주소와 함께 알려 주세요.</p></section>
<section><h2>6. 운영자와 적용일</h2>''' + contact() + '''<p>이 안내·약관은 2026년 10월 23일부터 적용됩니다. 개정 시 적용일과 주요 변경 사항을 이 페이지에 표시합니다. 개인정보에 관한 사항은 <a href="/privacy.html">개인정보처리방침</a>에서 별도로 안내합니다.</p></section>
</div>'''

about = '''<div class="info-content">
<section id="operator"><h2>운영자 소개</h2><p><strong>산업공학과 26학번 김예준</strong>이 운영하는 개인 학습 사이트입니다. 개념을 읽고, 빈칸으로 떠올리고, OX·다지선다와 교재를 오가며 복습할 수 있도록 만들었습니다.</p><p>사이트 이름과 과목 번호는 학습 대상을 설명하기 위한 표기입니다. 학교·강의 담당자·출판사의 공식 서비스 또는 공식 교재 해설을 뜻하지 않습니다.</p></section>
<section id="sources"><h2>학습 자료의 출처</h2><p>사용자 제공 『산업경영공학 시스템 접근』 PDF와 장별 키워드 빈칸노트를 바탕으로 구성했습니다. 아래 쪽수는 PDF 파일 내 순번이 아니라 교재에 인쇄된 쪽수입니다.</p>
<div class="info-table-wrap"><table><thead><tr><th scope="col">학습 묶음</th><th scope="col">내용과 교재 범위</th></tr></thead><tbody>
<tr><th scope="row"><a href="/#1-4">1~4장 통합</a></th><td>1장 산업공학의 기본 23–43쪽 · 2장 산업공학과 시스템 접근 47–58쪽 · 3장 산업시스템의 구조와 분석 65–88쪽 · 4장 경영시스템의 구조와 설계 93–127쪽</td></tr>
<tr><th scope="row"><a href="/#7">7장</a></th><td>경제성 분석 · 195–241쪽</td></tr>
<tr><th scope="row"><a href="/#8-9">8~9장 통합</a></th><td>8장 수리적 분석 249–262쪽 · 9장 통계적 분석 267–295쪽</td></tr>
<tr><th scope="row"><a href="/#10">10장</a></th><td>인적자원관리 · 303–353쪽</td></tr>
</tbody></table></div>
<p>OX 문항과 해설은 키워드 노트의 개념·정의·구분을 학습하기 위해 재구성했습니다. 각 문항에는 교재 쪽수 링크가 있습니다. ‘공식 적용 연습’의 수치는 학습을 위해 새로 만든 조건이며 교재 사례의 원래 수치와 구별해 표시합니다.</p><p>다지선다는 각 학습 항목의 핵심 개념과 표시 키워드를 중심으로 다섯 설명의 참·거짓을 구별하는 문제입니다. 교재에 연결된 개념 선지를 사용하며 위의 별도 수치 적용 연습은 포함하지 않습니다. 설명이 짧은 개념은 같은 학습 항목·단원의 비교 개념을 함께 다루고, 선지마다 해당 교재 쪽수를 표시합니다. 선지는 원문을 재구성한 학습용 문장입니다. 교재의 일부 표현에 오류·해석상 주의가 있으면 명확한 정의·식·도표로 판정할 수 있는 범위에 한정하고 해설에 이유를 표시합니다.</p></section>
<section id="copyright"><h2>저작권과 정정 안내</h2><p>교재 원문·스캔 이미지와 원자료의 저작권은 각 권리자에게 있습니다. 이 사이트에 자료가 표시되어 있다는 사실만으로 복제·재배포·상업적 이용이 허용되는 것은 아닙니다.</p><p>권리자이거나 적법한 대리인으로서 수정·삭제를 요청하시려면 해당 페이지 주소, 대상 자료, 요청 사유와 회신 연락처를 알려 주세요. 확인 후 필요한 조치를 하겠습니다. 출처가 불분명하거나 설명이 잘못된 부분도 같은 경로로 알려 주세요.</p></section>
<section id="contact"><h2>문의·오류 신고</h2>''' + contact() + '''<p>개인정보 문의, 자료의 오류·정정, 저작권·삭제 요청을 위 이메일로 받습니다. 문제의 장·문항, 교재 쪽수, 페이지 주소를 함께 적어 주시면 확인에 도움이 됩니다.</p><p>입력 문제는 기기와 브라우저, 어떤 키를 눌렀을 때 발생했는지 알려 주세요. 이름·학번 등 추가 개인정보나 전체 학습기록 파일은 문제 확인에 필요하지 않다면 보내지 않으셔도 됩니다.</p><p class="small">이메일 링크는 이용자의 메일 앱을 엽니다. 사이트 안에서 문의 내용을 작성·전송하는 양식은 운영하지 않습니다.</p></section>
</div>'''

help_page = '''<div class="info-content">
<section id="start"><h2>학습을 시작하는 방법</h2><ol><li><a href="/">메인</a>에서 ‘1~4장 통합’, ‘7장’, ‘8~9장 통합’, ‘10장’ 중 하나를 선택합니다.</li><li>키워드 학습에서는 단원과 난도를, <a href="/quiz.html?chapter=1-4">OX 퀴즈</a>와 <a href="/multi.html?chapter=1-4">다지선다</a>에서는 학습 범위와 문제 순서를 선택합니다.</li><li>교재 쪽수 링크를 누르면 해당 페이지가 새 탭에 열립니다. 교재 배율은 1~200%로 조절할 수 있습니다.</li></ol></section>
<section id="keyboard"><h2>키보드 단축키</h2><div class="info-table-wrap"><table><thead><tr><th scope="col">화면</th><th scope="col">동작</th></tr></thead><tbody><tr><th scope="row">키워드 학습</th><td><kbd>Enter</kbd> 채점 후 다음 칸 · <kbd>Shift</kbd> + <kbd>Enter</kbd> 이전 칸 · 입력칸 밖의 <kbd>C</kbd> 정답 표시·숨김</td></tr><tr><th scope="row">긴 문장 입력</th><td><kbd>Enter</kbd> 줄바꿈 · <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Enter</kbd> 채점 후 다음 칸</td></tr><tr><th scope="row">OX 퀴즈</th><td><kbd>O</kbd> / <kbd>X</kbd> 또는 <kbd>1</kbd> / <kbd>2</kbd> 답 선택 · <kbd>←</kbd> / <kbd>→</kbd> 문제 이동 · 답 선택 후 <kbd>Enter</kbd> 다음 문제</td></tr></tbody></table></div><p>한글 조합 중으로 감지된 Enter는 이동·채점에서 제외합니다. 한글 조합이 끝난 뒤 별도의 Enter로 이동해 주세요. 키 입력이 다르게 동작하면 기기·브라우저와 재현 방법을 <a href="/about.html#contact">운영자에게 알려 주세요</a>.</p></section>
<section id="multi-help"><h2>다지선다 입력과 채점</h2><p>각 문제의 다섯 선지 중 옳은 것을 모두 입력합니다. ㄱㄴㄷ과 123은 같은 조합이며, ㄷ ㄱ처럼 순서를 바꾸거나 띄어 써도 됩니다. 선지 표기는 한글·숫자 중 바꿀 수 있습니다. 같은 선지의 중복 입력이나 1~5 밖의 기호는 입력 오류로 안내하며 풀이로 집계하지 않습니다.</p><p>입력칸에서 Enter 또는 채점하기를 누르면 정답 조합, 빠뜨린 선지, 제외할 선지와 다섯 선지의 참·거짓 및 교재 근거를 확인할 수 있습니다. 정답 개수는 1~4개이며 정확히 일치해야 정답입니다. 핵심 개념 및 키워드를 중심으로 같은 학습 항목·단원의 관련 개념을 함께 비교합니다. 선지별 출처가 다를 수 있으므로 각 쪽수를 확인하세요.</p><p>문제를 열거나 이전·다음 이동, 문제 번호 이동, 다시 풀기로 다시 표시할 때마다 선지를 새로 섞습니다. 채점 결과를 보거나 선지 표기만 바꾸는 동안에는 현재 배치를 유지합니다. 답안은 선지 내용에 연결해 저장하므로 순서가 바뀌어도 정답·오답 기록은 유지되며, 이전 선택과 초안은 새 번호에 맞춰 표시됩니다. 입력 중에는 답안을 가공하지 않으며 한글 조합 중 Enter는 채점에서 제외합니다.</p></section>
<section id="records"><h2>내 학습기록 확인·내려받기</h2><p>현재 주소의 이 브라우저에 저장된 기록만 확인합니다. 1~4장과 8~9장은 각각 한 묶음이며, 키워드·OX·다지선다 기록은 각각 따로 저장됩니다. 다른 기기나 다른 도메인에 남은 기록은 여기에서 조회하지 못합니다.</p><div class="info-table-wrap"><table><caption class="small">현재 브라우저의 저장 상태</caption><thead><tr><th scope="col">학습 기록</th><th scope="col">상태</th></tr></thead><tbody id="record-list"><tr><td colspan="2">JavaScript를 켜면 현재 저장 상태를 확인할 수 있습니다.</td></tr></tbody></table></div><button type="button" id="download-records" class="info-button" disabled>전체 학습기록 JSON 내려받기</button><p id="record-status" class="info-status" role="status" aria-live="polite">기록을 확인하고 있습니다.</p><p class="small">이 통합 파일은 키워드·OX·다지선다 기록을 함께 보관하고 내용을 확인하는 용도입니다. 현재 통합 파일 불러오기는 지원하지 않습니다. 키워드 노트에서 복원하려면 해당 노트 하단의 ‘학습기록 저장’으로 만든 개별 파일을 ‘학습기록 불러오기’에서 선택해 주세요.</p></section>
<section id="delete"><h2>기록 수정·삭제</h2><ul><li><strong>답안 수정:</strong> 키워드 입력칸에서 직접 고칩니다. OX와 다지선다는 답을 제출한 뒤 ‘이 문제 다시 풀기’로 해당 답을 지우고 다시 답할 수 있습니다.</li><li><strong>키워드 답안 초기화:</strong> 노트의 ‘현재 범위 비우기’ 또는 ‘처음부터 다시 연습’에서 삭제 범위를 확인하고 실행합니다. ‘1~4장 통합’ 전체 초기화는 네 장 답안에, ‘8~9장 통합’ 전체 초기화는 두 장 답안에 함께 적용됩니다. 난도 설정 등은 남을 수 있습니다.</li><li><strong>키워드·OX·다지선다·설정까지 삭제:</strong> 이 사이트가 열린 다른 탭을 먼저 닫고, 브라우저 설정의 사이트 데이터 관리에서 현재 도메인 <strong>snu-ie-406-434-note.vercel.app</strong>의 데이터를 삭제합니다. 브라우저와 버전에 따라 메뉴 이름이 다를 수 있습니다. 다른 사이트의 데이터까지 지울 필요는 없습니다.</li><li><strong>내려받은 파일:</strong> 사이트 데이터 삭제와 별개입니다. 다운로드 폴더·기기 백업에 남은 JSON 파일은 직접 삭제해 주세요.</li></ul><p>서버에 학습 기록 사본이 없으므로 운영자는 삭제한 기록을 복구할 수 없습니다. 공용 기기나 비공개 모드에서는 특히 필요한 기록을 먼저 파일로 보관해 주세요.</p></section>
<section id="faq"><h2>자주 묻는 질문</h2><details><summary>기기나 브라우저를 바꾸면 기록이 이어지나요?</summary><p>자동으로 이어지지 않습니다. 같은 기기라도 브라우저 프로필이나 사이트 주소가 다르면 저장 공간이 다릅니다. 예전 주소 ie-ch10-keyword-notes.vercel.app의 기록도 현재 주소와 별도입니다.</p></details><details><summary>무작위로 섞으면 풀이 기록이 사라지나요?</summary><p>OX와 다지선다의 순서 변경과 다시 섞기는 답안을 지우지 않습니다. 단원 순서 모드로 돌아가도 기존 풀이 기록은 유지됩니다.</p></details><details><summary>교재가 비어 보이면 어떻게 하나요?</summary><p>‘다시 시도’를 눌러 보고, 연결 상태를 확인해 주세요. 계속 열리지 않으면 ‘원본 화질 PDF로 열기’를 이용할 수 있습니다. 통합 교재의 다음·이전 쪽은 노트에 포함된 장 범위 사이를 이어서 이동합니다.</p></details><details><summary>개인정보나 자료 오류는 어디로 문의하나요?</summary><p><a href="mailto:sprakids@snu.ac.kr">sprakids@snu.ac.kr</a>로 문의해 주세요. 운영자는 산업공학과 26학번 김예준입니다.</p></details></section>
</div>'''

pages = {
    'privacy.html': ('개인정보처리방침', '학습 기록과 접속 정보가 어디에서 어떻게 처리되는지 안내합니다.', privacy),
    'terms.html': ('이용안내·약관', '학습 도구의 역할, 기록 관리와 자료 이용에 관한 기준입니다.', terms),
    'about.html': ('자료 출처·운영자', '이 사이트를 운영하는 사람과 학습 자료의 기준을 소개합니다.', about),
    'help.html': ('학습기록 관리·도움말', '입력 방법부터 기록 보관·삭제, 자주 묻는 질문까지 확인하세요.', help_page),
}
for route, (title, lead, body) in pages.items():
    nav = ''.join(f'<a href="/{r}"' + (' aria-current="page"' if r == route else '') + f'>{label}</a>' for r, label in ROUTES)
    html = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#246e9b"><meta name="description" content="{lead}"><title>{title} · 산업공학의 이해 빈칸노트</title><link rel="stylesheet" href="/site-info.css"><script defer src="/site-info.js"></script></head><body class="info-page"><a class="info-skip" href="#main-content">본문 바로가기</a><header class="info-header"><a class="brand" href="/">산업공학의 이해 빈칸노트</a><nav aria-label="학습 화면"><a href="/">메인</a><a href="/#1-4">키워드 학습</a><a href="/quiz.html?chapter=1-4">OX 퀴즈</a><a href="/multi.html?chapter=1-4">다지선다</a></nav></header><main class="info-main" id="main-content"><p class="info-eyebrow">STUDY WITH CLARITY</p><h1>{title}</h1><p class="info-lead">{lead}</p><p class="info-date">{'시행일' if route in ['privacy.html','terms.html'] else '안내 기준일'} · {DATE} · 버전 1.1</p><nav class="info-nav" aria-label="안내 페이지">{nav}</nav>{body}{footer()}</main></body></html>'''
    (ROOT / route).write_text(html + '\n', encoding='utf-8')

# Static footer links remain accessible even if scripts or local storage fail.
for name in ['index.html', 'quiz.html', 'multi.html', 'textbook.html', 'chapter-1-4.html', 'chapter-7.html', 'chapter-8-9.html', 'chapter-10.html']:
    p = ROOT / name
    html = p.read_text(encoding='utf-8-sig')
    if '/site-info.css' not in html:
        html = html.replace('</head>', '<link rel="stylesheet" href="/site-info.css"><script defer src="/site-info.js"></script></head>', 1)
    if 'data-policy-links' not in html:
        if name == 'index.html':
            marker = '<p class="home-footer">학습 기록은 이 브라우저에 자동 저장됩니다. 노트의 교재 쪽수를 누르면 해당 페이지가 열립니다.</p>'
            assert marker in html
            html = html.replace(marker, marker + footer())
        elif name in ['quiz.html', 'multi.html', 'textbook.html']:
            html = html.replace('</footer>', footer() + '</footer>', 1)
        else:
            marker = '</main></div><div id="toast"'
            assert marker in html
            html = html.replace(marker, footer(top=True) + marker, 1)
    p.write_text(html, encoding='utf-8')
print('Created four notice/help pages and linked all eight study surfaces.')

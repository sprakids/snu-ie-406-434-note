"""Build reviewed O/X contrasts against the existing, page-cited note data.

Each marked source row has one true item and one explicitly authored false item.
No arbitrary token substitutions or runtime generation are used for grading.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
TITLES = {'1-4': '1~4장 통합', 7: '경제성 분석', '8-9': '8~9장 통합', 10: '인적자원관리'}
TRUTHS = {}

def plain(text):
    return re.sub(r'\[\[(.*?)\]\]', lambda m: m[1].split('|')[0], text).replace(']]', '').strip()

def read_source(chapter):
    source = (ROOT / f'chapter-{chapter}.html').read_text(encoding='utf-8-sig')
    return json.loads(re.search(r'<script id="content-data" type="application/json">(.*?)</script>', source, re.S)[1])

def read_contrasts(chapter):
    result, item = {}, None
    for line in (ROOT / 'authoring' / f'quiz-false-{chapter}.txt').read_text(encoding='utf-8-sig').splitlines():
        if not line.strip():
            continue
        if line.startswith('['):
            item = line[1:-1]
            assert item not in result, item
            result[item] = {}
        else:
            index, text = line.split('|', 1)
            assert int(index) not in result[item], (item, index)
            if '||' in text:
                truth, text = text.split('||', 1)
                TRUTHS[(item, int(index))] = truth
            result[item][int(index)] = text
    return result

def flatten(sections):
    items = []
    def walk(nodes, section, path):
        for node in nodes:
            if 'children' in node:
                walk(node['children'], section, path + [node['title']])
            else:
                items.append({**node, 'sectionId': section['id'], 'sectionTitle': section['title'], 'path': path})
    for section in sections:
        walk(section['children'], section, [])
    return items

def topic(item):
    names = {
        'economic-applications': '경제성 분석의 적용', 'depreciation-tax': '감가상각의 절세·내부금융효과',
        'pv-formula': '현가 공식', 'evaluation-purpose': '경제성 평가의 목적',
        'evaluation-models': '경제성 평가 모형의 구분', 'profile-caution': '프로파일의 해석',
        'ahp-process': 'AHP 수행 절차', 'ahp-hierarchy': 'AHP 계층구조', 'ahp-pairwise': 'AHP 쌍별 비교',
        'ahp-weights': 'AHP 상대적 중요도', 'ahp-priority': 'AHP 우선순위', 'tree-elements': '의사결정 나무의 요소',
        'tree-evaluation': '의사결정 나무의 평가', 'irr-decision': 'IRR 투자 판단',
        'npv-irr-comparison': 'NPV와 IRR 비교', 'social-discount': '사회적 할인율',
        'benefit-scope': '비용·효익의 범위', 'incremental-procedure': '점증 분석 절차',
        'conflict-function': '갈등의 기능', 'conflict-causes': '갈등의 원인',
        'conflict-nature': '갈등의 성격별 분류', 'conflict-targets': '갈등의 대상별 분류',
        'conflict-management': '갈등관리 방안', 'communication-process': '커뮤니케이션 전달 과정',
        'communication-models': '커뮤니케이션 모형', 'communication-directions': '커뮤니케이션 방향',
        'communication-forms': '커뮤니케이션 상황', 'body-foundations': '인간공학의 과제',
        'body-processing': '인간의 정보처리', 'body-displays': '표시장치와 정보의 종류',
        'body-codes': '정보코드', 'body-joints': '관절 중심 신체동작', 'body-motor': '운동동작',
        'body-stress': '스트레스와 스트레인', 'work-process-charts': '공정분석 도구',
        'work-process-symbols': '기본 공정기호', 'work-pts-standard-data': '간접 작업측정법',
        'design-ui-elements': '사용자 인터페이스 설계요소', 'design-ui-flow-hci': '인터페이스 디자인과 HCI',
        'design-interface-types': '인터페이스의 층위', 'design-affect-measurement': '감성 측정',
    }
    if item['id'] in names:
        return names[item['id']]
    head = plain(item['head'])
    marked = re.findall(r'\[\[(.*?)\]\]', item['head'])
    before_colon = re.split(r'\s[:：]\s', head)[0]
    if len(before_colon) <= 25 and before_colon != head:
        return before_colon
    if marked and not re.fullmatch(r'[\d\W]+', marked[0].split('|')[0]):
        return marked[0].split('|')[0]
    return head.split('은 ')[0].split('는 ')[0].rstrip('.')

def truth_for(item, row, original):
    text = plain(original)
    if (item['id'], row) in TRUTHS:
        return TRUTHS[(item['id'], row)]
    if item['id'].startswith(('c1-', 'c2-', 'c3-', 'c4-', 'c8-', 'c9-')):
        # Several source rows require their topic to be meaningful (e.g. the
        # BCG high/low values). Keep that context inside the question itself.
        text = plain(item['head']) + '：' + text
    if item['id'] == 'psych-leadership-traits' and row > 0:
        text = '교재의 역사적 특성연구 분류에서 ' + text
    if item['id'] == 'communication-network' and row == 2:
        text = '교재의 단순화된 채널 비교표에서 ' + text.removeprefix('교재 표의 비교에서 ')
    if item['id'] == 'communication-methods' and row == 1:
        text = '교재의 분류에서 ' + text
    if item['id'] == 'work-time-study' and row == 2:
        text = '교재의 정상시간 기준 여유율 계산식: ' + text
    return text

def calculations():
    # New numbers are application exercises, not claims about textbook examples.
    return {
        7: [
            ('pv-formula', '1년 뒤 110원을 받으며 할인율이 연 10%이면 현재가치는 100원이다.', '1년 뒤 110원을 받으며 할인율이 연 10%이면 현재가치는 110원이다.', '미래금액을 현재 시점으로 환산하므로 110 ÷ (1 + 0.10) = 100원입니다.'),
            ('pv-formula', '2년 뒤 121원을 받으며 할인율이 연 10%이면 현재가치는 100원이다.', '2년 뒤 121원을 받으며 할인율이 연 10%이면 현재가치는 110원이다.', '2년을 할인해야 하므로 121 ÷ (1 + 0.10)² = 121 ÷ 1.21 = 100원입니다.'),
            ('simple-additive', '단순 가산방식에서 항목 점수가 3점·5점·2점이면 종합점수는 10점이다.', '단순 가산방식에서 항목 점수가 3점·5점·2점이면 종합점수는 30점이다.', '단순 가산은 점수의 곱이 아니라 합을 사용하므로 3 + 5 + 2 = 10점입니다.'),
            ('weighted-additive', '두 항목의 점수가 80점·60점이고 가중치가 각각 0.6·0.4이면 가중 종합점수는 72점이다.', '두 항목의 점수가 80점·60점이고 가중치가 각각 0.6·0.4이면 가중 종합점수는 70점이다.', '각 점수에 중요도를 반영해야 하므로 80 × 0.6 + 60 × 0.4 = 48 + 24 = 72점입니다. 단순평균 70점과 구별합니다.'),
            ('ahp-pairwise', 'AHP에서 A의 B에 대한 중요도 비교값이 4이면 B의 A에 대한 비교값은 1/4이다.', 'AHP에서 A의 B에 대한 중요도 비교값이 4이면 B의 A에 대한 비교값도 4이다.', '반대 방향의 쌍별 비교값은 역수이므로 1 ÷ 4 = 1/4입니다.'),
            ('wald', '두 상황의 수익이 A=(10, 50), B=(20, 30)이면 왈드 기준은 B를 선택한다.', '두 상황의 수익이 A=(10, 50), B=(20, 30)이면 왈드 기준은 A를 선택한다.', '먼저 각 대안의 최악 수익을 구하면 A는 10, B는 20입니다. 이 최소수익 중 큰 값 20을 가진 B를 선택합니다.'),
            ('savage', '두 상황의 수익이 A=(80, 20), B=(50, 60)이면 새비지 기준은 B를 선택한다.', '두 상황의 수익이 A=(80, 20), B=(50, 60)이면 새비지 기준은 A를 선택한다.', '상황별 최대수익은 80과 60입니다. 기회손실은 A=(0, 40), B=(30, 0)이므로 최대 기회손실은 40과 30입니다. 이 중 작은 30을 가진 B를 선택합니다.'),
            ('hurwicz', '최소수익 20, 최대수익 100, 낙관계수 α=0.25이면 후르비츠 평가값은 40이다.', '최소수익 20, 최대수익 100, 낙관계수 α=0.25이면 후르비츠 평가값은 80이다.', '낙관계수는 최대수익에 적용하므로 H = 0.25 × 100 + 0.75 × 20 = 25 + 15 = 40입니다.'),
            ('laplace', '세 상황의 수익이 30·60·90이면 라플라스 기준의 평가값은 60이다.', '세 상황의 수익이 30·60·90이면 라플라스 기준의 평가값은 90이다.', '세 상황의 확률을 각각 1/3로 두므로 (30 + 60 + 90) ÷ 3 = 60입니다. 최대수익만 고르지 않습니다.'),
            ('expected-return', '수익 40과 80의 확률이 각각 0.25와 0.75이면 기대수익은 70이다.', '수익 40과 80의 확률이 각각 0.25와 0.75이면 기대수익은 60이다.', '각 수익에 발생 확률을 곱해야 하므로 40 × 0.25 + 80 × 0.75 = 10 + 60 = 70입니다.'),
            ('variance', '수익 0과 100이 각각 확률 0.5로 발생하면 기대수익은 50이고 분산은 2,500이다.', '수익 0과 100이 각각 확률 0.5로 발생하면 기대수익은 50이고 분산은 50이다.', '기대수익은 50입니다. 편차를 제곱해 가중평균하므로 0.5 × (0 − 50)² + 0.5 × (100 − 50)² = 2,500입니다. 50은 이 경우의 표준편차입니다.'),
            ('coefficient-variation', '기대수익 100, 표준편차 20이면 분산계수(CV)는 0.2이다.', '기대수익 100, 표준편차 20이면 분산계수(CV)는 5이다.', '상대적 위험을 구하므로 표준편차 ÷ 기대수익 = 20 ÷ 100 = 0.2입니다.'),
            ('payback', '초기 투자금 100을 매년 일정한 순현금유입 25로 회수하면 일반적인 회수기간은 4년이다.', '초기 투자금 100을 매년 일정한 순현금유입 25로 회수하면 일반적인 회수기간은 2년이다.', '할인을 적용하지 않는 일반 회수기간법에서 매년 25씩 누적하므로 100 ÷ 25 = 4년입니다.'),
            ('npv', '현금유입의 현재가치 합이 120, 현금유출의 현재가치 합이 100이면 NPV는 20이다.', '현금유입의 현재가치 합이 120, 현금유출의 현재가치 합이 100이면 NPV는 1.2이다.', '순현가는 유입과 유출의 현재가치 차이이므로 120 − 100 = 20입니다. 비율 1.2는 수익성지수와 구별합니다.'),
            ('profitability-index', '현금유입 현재가치 합이 120, 현금유출 현재가치 합이 100이면 수익성지수는 1.2이다.', '현금유입 현재가치 합이 120, 현금유출 현재가치 합이 100이면 수익성지수는 20이다.', '수익성지수는 비율이므로 120 ÷ 100 = 1.2입니다. 차이 20은 NPV입니다.'),
            ('irr', '지금 100을 투자하고 다른 현금흐름 없이 1년 뒤 110을 받는 투자의 IRR은 10%이다.', '지금 100을 투자하고 다른 현금흐름 없이 1년 뒤 110을 받는 투자의 IRR은 20%이다.', 'NPV가 0이어야 하므로 110 ÷ (1 + r) − 100 = 0입니다. 1 + r = 1.10이므로 r = 0.10, 즉 10%입니다.'),
            ('benefit-cost-ratio', '효익 현재가치 150, 비용 현재가치 100이면 B/C는 1.5이다.', '효익 현재가치 150, 비용 현재가치 100이면 B/C는 50이다.', '효익–비용비율은 효익 ÷ 비용이므로 150 ÷ 100 = 1.5입니다. 차이 50은 순효익입니다.'),
            ('net-benefit', '효익 현재가치 150, 비용 현재가치 100이면 순효익은 50이다.', '효익 현재가치 150, 비용 현재가치 100이면 순효익은 1.5이다.', '순효익은 현재가치의 차이이므로 150 − 100 = 50입니다.'),
            ('incremental-bc', '추가 효익의 현재가치가 100, 추가 비용의 현재가치가 50이면 점증 효익–비용비율은 2이다.', '추가 효익의 현재가치가 100, 추가 비용의 현재가치가 50이면 점증 효익–비용비율은 0.5이다.', '추가 투자에 대한 비율이므로 ΔB ÷ ΔC = 100 ÷ 50 = 2입니다. 총액 비율과 증가분 비율을 구별합니다.'),
        ],
        10: [
            ('body-efficiency', '유용한 작업출력이 20, 전체 에너지 소비량이 100이면 작업효율은 20%이다.', '유용한 작업출력이 20, 전체 에너지 소비량이 100이면 작업효율은 500%이다.', '소비 에너지 중 유용한 출력의 비율이므로 20 ÷ 100 × 100 = 20%입니다.'),
            ('work-time-study', '관측시간 10분, 수행도 계수 1.1이면 정상시간은 11분이다.', '관측시간 10분, 수행도 계수 1.1이면 정상시간은 10분이다.', '수행도를 반영해야 하므로 교재의 정상시간 = 관측시간 × 수행도 계수 = 10 × 1.1 = 11분입니다.'),
            ('work-time-study', '정상시간 10분이고 정상시간 기준 여유율이 20%이면 교재의 계산 방식에서 표준시간은 12분이다.', '정상시간 10분이고 정상시간 기준 여유율이 20%이면 교재의 계산 방식에서 표준시간은 8분이다.', '정상시간에 여유시간을 더하므로 표준시간 = 10 × (1 + 0.20) = 12분입니다. 여유율을 빼지 않습니다.'),
            ('work-work-sampling', '무작위 관측 100회 중 작업 중인 상태가 60회이면 그 활동 시간 비율의 추정값은 60%이다.', '무작위 관측 100회 중 작업 중인 상태가 60회이면 그 활동 시간 비율의 추정값은 40%이다.', '전체 관측 중 해당 활동의 비율이므로 60 ÷ 100 × 100 = 60%입니다.'),
        ],
    }

def build(chapter):
    sections = read_source(chapter)
    items = flatten(sections)
    contrasts = read_contrasts(chapter)
    assert set(contrasts) == {item['id'] for item in items}, 'Item coverage mismatch'
    questions, expected_keywords = [], set()
    def append_pair(item, row, truth, false, keywords, kind='concept', explanation=None):
        assert truth != false and truth and false
        if explanation is None:
            explanation = truth
            rows = [item['head']] + item['lines']
            context = plain(rows[0] if row != 0 else rows[1] if len(rows) > 1 else '')
            if context and context != truth and context not in truth:
                explanation += '\n' + context
        if item.get('note'):
            explanation += '\n' + item['note']
        if item['id'] == 'work-time-study' and row == 3:
            explanation += '\n관측시간을 수행도로 보정해 8 × 1.2 = 9.6분을 얻고, 정상시간에 여유를 더해 9.6 × 1.2 = 11.52분을 구합니다.'
        for variant, answer, statement in [('a', True, truth), ('b', False, false)]:
            questions.append({'id': f'ie{chapter}-{item["id"]}-{row}-{variant}', 'chapter': chapter,
                'sectionId': item['sectionId'], 'sectionTitle': item['sectionTitle'], 'path': item['path'],
                'itemId': item['id'], 'itemOrder': items.index(item), 'topic': topic(item), 'keywords': keywords,
                'page': item['page'], 'statement': statement, 'answer': answer, 'explanation': explanation,
                'sourceText': truth, 'sourceRow': row, 'kind': kind})
    for item in items:
        rows = [item['head']] + item['lines']
        required = {index for index, text in enumerate(rows) if '[[' in text}
        if chapter == '8-9' and not required:
            # Formula-only source items also need a reviewed proposition pair.
            required = {0}
        assert set(contrasts[item['id']]) == required, (chapter, item['id'], sorted(required), sorted(contrasts[item['id']]))
        for index in sorted(required):
            text = rows[index]
            keywords = [match.split('|')[0] for match in re.findall(r'\[\[(.*?)\]\]', text)]
            expected_keywords.update(keywords)
            append_pair(item, index, truth_for(item, index, text), contrasts[item['id']][index], keywords)
    by_id = {item['id']: item for item in items}
    for index, (item_id, truth, false, explanation) in enumerate(calculations().get(chapter, [])):
        item = by_id[item_id]
        append_pair(item, f'calc{index}', truth, false, [topic(item)], 'application', explanation)
    questions.sort(key=lambda q: (q['itemOrder'], hashlib.sha256(q['id'].encode()).hexdigest()))
    for index, question in enumerate(questions):
        question['order'] = index
    assert len({q['id'] for q in questions}) == len(questions)
    assert len({q['statement'] for q in questions}) == len(questions), 'Duplicate statements'
    covered = {k for q in questions if q['answer'] for k in q['keywords']}
    assert expected_keywords <= covered
    assert all('[[' not in q['statement'] and ']]' not in q['statement'] for q in questions)
    assert sum(q['answer'] for q in questions) * 2 == len(questions)
    output = {'version': 1, 'chapter': chapter, 'title': TITLES[chapter], 'source': '산업경영공학 시스템 접근',
        'itemCount': len(items), 'keywordCount': len(expected_keywords), 'questionCount': len(questions),
        'sections': [{'id': s['id'], 'title': s['title'], 'page': s['page']} for s in sections],
        'questions': questions}
    (ROOT / f'quiz-data-{chapter}.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({k: output[k] for k in ['chapter', 'itemCount', 'keywordCount', 'questionCount']}, ensure_ascii=True))

if __name__ == '__main__':
    for chapter in ['1-4', 7, '8-9', 10]:
        build(chapter)

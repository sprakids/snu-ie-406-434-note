"""Compile five-statement sets from the page-cited textbook concept contrasts.

No new facts, token substitutions, or made-up numerical exercises are generated.
Each keyword occurrence and each source learning item is an explicit target.
References avoid duplicating the existing statement/evidence corpus on deployment.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import re

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('source_bank', ROOT / 'authoring/build-quiz-bank.py')
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)

def digest(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def page_start(page):
    return int(re.search(r'\d+', page)[0])

def common_path(a, b):
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    return n

def build(chapter):
    ox = json.loads((ROOT / f'quiz-data-{chapter}.json').read_text(encoding='utf-8'))
    reviewed = json.loads((ROOT / 'authoring/multi-source-overrides.json').read_text(encoding='utf-8'))
    overrides = {}
    for q in ox['questions']:
        entry = reviewed.get(q['id'][:-2])
        if entry:
            truth = entry['true']
            overrides[q['id']] = {'statement': truth if q['answer'] else entry['false'],
                                   'sourceText': truth, 'page': entry['page'],
                                   'explanation': truth + '\n' + entry['reason']}
        if q['itemId'] == 'c9-least-squares':
            overrides[q['id']] = {**overrides.get(q['id'], {}), 'page': '280, 286'}
        if q['itemId'] == 'c9-r-squared' and q['sourceRow'] == 5:
            overrides[q['id']] = {**overrides.get(q['id'], {}), 'page': '282, 287'}
    for q in ox['questions']:
        q.update(overrides.get(q['id'], {}))
    items = source.flatten(source.read_source(chapter))
    by_item = {i['id']: i for i in items}
    pairs = {}
    for q in ox['questions']:
        if q['kind'] != 'concept':
            continue
        pairs.setdefault((q['itemId'], q['sourceRow']), {})[q['answer']] = q
    assert all(set(p) == {True, False} for p in pairs.values())
    questions = []
    expected = set()
    for item_order, item in enumerate(items):
        own = sorted(((key, p) for key, p in pairs.items() if key[0] == item['id']), key=lambda entry: entry[0][1])
        keywords = list(dict.fromkeys(k.split('|')[0] for row in [item['head'], *item['lines']]
                                     for k in re.findall(r'\[\[(.*?)\]\]', row)))
        expected.update((item['id'], k) for k in keywords)
        # A concept target exists even for formula-only source items.
        title = {'c2-modelwhy': '모델을 사용하는 이유', 'c2-structure': '시스템 구조의 관점',
                 'c2-procedure': '시스템 접근의 절차', 'c4-designsteps': '조직 설계의 절차',
                 'c4-designvars': '조직 설계의 변수', 'c8-coefficients': '목적함수 계수의 변화',
                 'payback-limitations': '회수기간법의 한계',
                 'design-display-control-environment': '표시장치·조작장치·환경요소'}.get(item['id'], source.topic(item))
        targets = [(title, own[0][0], 'concept')]
        for k in keywords:
            primary = next(key for key, p in own if k in p[True]['keywords'])
            targets.append((k, primary, 'keyword'))
        for target, primary, kind in targets:
            seed = f'{chapter}|{item["id"]}|{kind}|{target}'
            candidates = []
            for key, pair in pairs.items():
                q = pair[True]
                if key == primary:
                    continue
                if q['sectionId'] != item['sectionId']:
                    continue
                # Prefer the same item, then the same nested textbook unit,
                # then the nearest source item/page inside this chapter only.
                rank = (0 if key[0] == item['id'] else 1,
                        -common_path(q['path'], item['path']),
                        abs(q['itemOrder'] - item_order),
                        abs(page_start(q['page']) - page_start(item['page'])),
                        digest(seed + str(key)))
                candidates.append((rank, key))
            chosen = [primary] + [key for _, key in sorted(candidates)[:4]]
            assert len(chosen) == len(set(chosen)) == 5, (chapter, item['id'])
            # Stable positions keep saved answers meaningful. Correct counts
            # vary from one to four; no question is all true or all false.
            chosen.sort(key=lambda key: digest(seed + '|position|' + str(key)))
            count = [1, 2, 2, 3, 3, 4][int(digest(seed)[:8], 16) % 6]
            truth_positions = set(sorted(range(5), key=lambda n: digest(seed + '|truth|' + str(n)))[:count])
            refs = [pairs[key][n in truth_positions]['id'] for n, key in enumerate(chosen)]
            fingerprint = digest(seed + '|' + '|'.join(refs))[:14]
            questions.append({'id': f'm{chapter}-{item["id"]}-{fingerprint}',
                              'itemId': item['id'], 'sectionId': item['sectionId'],
                              'target': target, 'kind': kind, 'primary': pairs[primary][True]['id'],
                              'choices': refs})
    covered = {(q['itemId'], q['target']) for q in questions if q['kind'] == 'keyword'}
    assert expected == covered
    assert len({q['id'] for q in questions}) == len(questions)
    # A corpus fingerprint prevents silently grading changed source contrasts.
    claims = {q['id']: q for q in ox['questions'] if q['kind'] == 'concept'}
    corpus = digest(json.dumps(claims, ensure_ascii=False, sort_keys=True, separators=(',', ':')))
    result = {'version': 1, 'corpusHash': corpus, 'chapter': chapter,
              'itemCount': len(items), 'keywordCount': ox['keywordCount'],
              'keywordTargetCount': len(expected), 'questionCount': len(questions),
              'overrides': overrides, 'questions': questions}
    (ROOT / f'multi-data-{chapter}.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ['chapter','itemCount','keywordCount','keywordTargetCount','questionCount']}))

if __name__ == '__main__':
    for chapter in ['1-4', 7, '8-9', 10]:
        build(chapter)

"""Validates training blocks against docs/fitness/training-blocks-spec.md.

Usage: python3 scripts/validate-blocks.py [blocks-dir]
"""
import datetime
import json
import re
import sys
from pathlib import Path

DEFAULT_DIR = 'docs/fitness/approved/training-blocks'
CATALOGUE_DIR = Path('docs/fitness/approved/catalogue-v2')
DAY_KEYS = ['chest-back-a', 'arms-a', 'lower-body-a', 'chest-back-b', 'arms-b', 'lower-body-b']
TECHNIQUES = {'straight', 'superset', 'drop-set', 'pyramid', 'reverse-pyramid'}
CODE_RE = re.compile(r'^[A-H][1-3]$')
REPS_RE = re.compile(r'^\d{1,2}(\+\d{1,2})?$')
SPANISH = re.compile(r'[áéíóúñ¿¡]')
BENCH_WORDS = re.compile(r'Bench|Incline|Decline|Chest-Supported|Pullover|Skull Crusher|Y-Raise|Fly|Seated|Preacher|Spider', re.I)
FREE_WEIGHTS = {'dumbbell', 'barbell', 'ez-bar', 'smith-machine', 'kettlebell'}


def needs_bench_angle(name, equipment):
    """Free-weight exercises done on an adjustable bench/seat must state the angle."""
    # Incline/decline work on an adjustable bench (incl. bodyweight ab benches); fixed machines are exempt.
    if re.search(r'Incline|Decline', name, re.I) and equipment not in {'machine', 'cable', 'plate-loaded'}:
        return True
    if equipment not in FREE_WEIGHTS or not BENCH_WORDS.search(name):
        return False
    return not re.search(r'Standing|Preacher', name, re.I)


def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR)
    problems = []
    catalogue = [e for f in CATALOGUE_DIR.glob('*.json') for e in json.loads(f.read_text())]
    catalogue_ids = {e['id'] for e in catalogue}
    names = {e['id']: e['name_en'] for e in catalogue}
    equipment = {e['id']: e['equipment'] for e in catalogue}
    additions_file = folder / 'catalogue-additions.json'
    additions = json.loads(additions_file.read_text()) if additions_file.exists() else []
    addition_ids = {e['id'] for e in additions}
    for ex_id in addition_ids & catalogue_ids:
        problems.append(f'catalogue addition {ex_id} already exists in the catalogue')
    known = catalogue_ids | addition_ids
    if not (folder / 'strategy.md').exists():
        problems.append('strategy.md missing')

    blocks = json.loads((folder / 'blocks.json').read_text())
    seen_ids = set()
    previous_start = None
    for index, block in enumerate(blocks, 1):
        where = block.get('id', f'block #{index}')
        if block.get('id') in seen_ids:
            problems.append(f'{where}: duplicate id')
        seen_ids.add(block.get('id'))
        if block.get('number') != index:
            problems.append(f'{where}: number should be {index}')
        try:
            start = datetime.date.fromisoformat(block['start_date'])
            if previous_start and start <= previous_start:
                problems.append(f'{where}: start_date not after previous block')
            previous_start = start
        except (KeyError, ValueError):
            problems.append(f'{where}: bad start_date')
        if block.get('origin') not in ('coach', 'pt'):
            problems.append(f'{where}: origin')
        if block.get('weeks') != 6:
            problems.append(f'{where}: weeks must be 6')
        for key in ('name', 'method', 'summary'):
            if not block.get(key):
                problems.append(f'{where}: missing {key}')
            elif SPANISH.search(block[key]):
                problems.append(f'{where}: {key} not in English')
        if len(block.get('summary') or '') > 260:
            problems.append(f'{where}: summary over 260 characters')
        insights = block.get('insights') or []
        titles = [i.get('title') for i in insights]
        expected = ['Goal', 'How it works', 'A days vs B days', 'How to progress', 'What to expect']
        if titles[:5] != expected or len(titles) not in (5, 6) or (len(titles) == 6 and titles[5] != 'Key tips'):
            problems.append(f'{where}: insights titles must be {expected} (+ optional Key tips), got {titles}')
        for item in insights:
            body = item.get('body') or ''
            if not 40 <= len(body) <= 600:
                problems.append(f"{where}: insight {item.get('title')!r} body must be 40-600 characters")
            if SPANISH.search(body):
                problems.append(f"{where}: insight {item.get('title')!r} not in English")
        days = block.get('days', [])
        if [d.get('key') for d in days] != DAY_KEYS:
            problems.append(f'{where}: days must be {DAY_KEYS}')
        for day in days:
            if len(day.get('focus') or '') > 28:
                problems.append(f"{where}/{day.get('key')}: focus over 28 characters")
            codes = set()
            for ex in day.get('exercises', []):
                at = f"{where}/{day.get('key')}/{ex.get('code')}"
                if not CODE_RE.match(str(ex.get('code'))):
                    problems.append(f'{at}: bad code')
                if ex.get('code') in codes:
                    problems.append(f'{at}: duplicate code')
                codes.add(ex.get('code'))
                if ex.get('exercise_id') not in known:
                    problems.append(f"{at}: unknown exercise_id {ex.get('exercise_id')!r}")
                reps = ex.get('reps', [])
                if len(reps) != ex.get('sets'):
                    problems.append(f'{at}: reps length != sets')
                if any(not REPS_RE.match(str(r)) for r in reps):
                    problems.append(f'{at}: bad reps {reps}')
                if ex.get('technique') not in TECHNIQUES:
                    problems.append(f"{at}: technique {ex.get('technique')!r}")
                if ex.get('technique') == 'drop-set' and not all('+' in r for r in reps):
                    problems.append(f'{at}: drop-set reps must look like "12+12"')
                plain = [int(r) for r in reps if REPS_RE.match(str(r)) and '+' not in str(r)]
                if ex.get('technique') == 'pyramid' and not (len(plain) > 1 and all(a > b for a, b in zip(plain, plain[1:]))):
                    problems.append(f'{at}: ascending pyramid needs reps decreasing set to set (e.g. 15-12-10-8)')
                if ex.get('technique') == 'reverse-pyramid' and not (len(plain) > 1 and all(a < b for a, b in zip(plain, plain[1:]))):
                    problems.append(f'{at}: reverse pyramid needs reps increasing set to set (e.g. 8-10-12-15)')
                if ex.get('technique') == 'straight' and len(set(plain)) > 1:
                    problems.append(f'{at}: straight sets need the same reps every set')
                if not isinstance(ex.get('rest_seconds'), int):
                    problems.append(f'{at}: rest_seconds')
                angle = ex.get('angle_degrees')
                if angle is not None and not (-45 <= angle <= 90):
                    problems.append(f'{at}: angle_degrees must be between -45 and 90')
                name = names.get(ex.get('exercise_id'), '')
                if angle is not None and re.search(r'Decline', name, re.I) and angle >= 0:
                    problems.append(f'{at}: {name!r} is a decline exercise — angle_degrees must be negative')
                if angle is not None and re.search(r'Incline', name, re.I) and angle <= 0:
                    problems.append(f'{at}: {name!r} is an incline exercise — angle_degrees must be positive')
                if angle is None and needs_bench_angle(name, equipment.get(ex.get('exercise_id'), '')):
                    problems.append(f"{at}: {name!r} is done on a bench/seat — angle_degrees is required")
                if len(ex.get('notes') or '') > 80:
                    problems.append(f'{at}: notes over 80 characters')
                if SPANISH.search(ex.get('notes') or ''):
                    problems.append(f'{at}: notes not in English')
            letters = {}
            for code in codes:
                letters.setdefault(code[0], []).append(code)
            for ex in day.get('exercises', []):
                paired = len(letters.get(str(ex.get('code'))[0], [])) > 1
                if paired and ex.get('technique') != 'superset':
                    problems.append(f"{where}/{day.get('key')}/{ex.get('code')}: paired code but technique is not superset")

    # Spanish block texts (docs/fitness/approved/es/blocks.json) must match block ids, day keys and codes.
    es_file = Path('docs/fitness/approved/es/blocks.json')
    if es_file.exists():
        by_id = {b['id']: b for b in blocks}
        for block_id, es in json.loads(es_file.read_text(encoding='utf-8')).items():
            block = by_id.get(block_id)
            if not block:
                problems.append(f'es/blocks.json: unknown block {block_id}')
                continue
            if es.get('insights') and len(es['insights']) != len(block.get('insights') or []):
                problems.append(f'es/blocks.json: {block_id} insights count differs from English')
            keys = {d['key']: {e['code'] for e in d['exercises']} for d in block['days']}
            for day_key in (es.get('days') or {}):
                if day_key not in keys:
                    problems.append(f'es/blocks.json: {block_id} unknown day {day_key}')
            for note_key in (es.get('notes') or {}):
                day_key, _, code = note_key.partition('/')
                if code not in keys.get(day_key, set()):
                    problems.append(f'es/blocks.json: {block_id} unknown exercise {note_key}')

    print(f'{len(blocks)} blocks, {len(additions)} catalogue additions')
    if problems:
        print(f'\n{len(problems)} problem(s):')
        for problem in problems:
            print(' -', problem)
        sys.exit(1)
    print('OK')


if __name__ == '__main__':
    main()

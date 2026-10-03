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


def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR)
    problems = []
    catalogue_ids = {e['id'] for f in CATALOGUE_DIR.glob('*.json') for e in json.loads(f.read_text())}
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
        days = block.get('days', [])
        if [d.get('key') for d in days] != DAY_KEYS:
            problems.append(f'{where}: days must be {DAY_KEYS}')
        for day in days:
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
                if angle is not None and not (0 < angle < 90):
                    problems.append(f'{at}: angle_degrees')
                if SPANISH.search(ex.get('notes') or ''):
                    problems.append(f'{at}: notes not in English')
            letters = {}
            for code in codes:
                letters.setdefault(code[0], []).append(code)
            for ex in day.get('exercises', []):
                paired = len(letters.get(str(ex.get('code'))[0], [])) > 1
                if paired and ex.get('technique') != 'superset':
                    problems.append(f"{where}/{day.get('key')}/{ex.get('code')}: paired code but technique is not superset")

    print(f'{len(blocks)} blocks, {len(additions)} catalogue additions')
    if problems:
        print(f'\n{len(problems)} problem(s):')
        for problem in problems:
            print(' -', problem)
        sys.exit(1)
    print('OK')


if __name__ == '__main__':
    main()

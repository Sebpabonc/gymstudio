"""Validates the v2 exercise catalogue against docs/fitness/catalogue-v2-spec.md.

Usage: python3 scripts/validate-catalogue.py [catalogue-dir]
Exits non-zero and prints every problem found.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

DEFAULT_DIR = 'docs/fitness/approved/catalogue-v2'
V1_DOC = 'docs/fitness/approved/2026-10-03-exercise-catalogue.md'

BODY_REGIONS = {'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full Body'}
MUSCLES = {
    'Chest', 'Upper Chest', 'Lats', 'Upper Back', 'Traps', 'Lower Back', 'Front Delts', 'Side Delts',
    'Rear Delts', 'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Adductors',
    'Abductors', 'Calves', 'Abs', 'Obliques', 'Hip Flexors',
}
EQUIPMENT = {
    'barbell', 'dumbbell', 'cable', 'machine', 'plate-loaded', 'smith-machine', 'bodyweight',
    'ez-bar', 'hex-bar', 'kettlebell', 'band',
}
PATTERNS = {
    'push horizontal', 'push vertical', 'pull horizontal', 'pull vertical', 'squat', 'hinge',
    'lunge', 'isolation', 'core', 'carry',
}
REQUIRED = [
    'id', 'name_en', 'name_es', 'body_region', 'primary_muscles', 'secondary_muscles', 'equipment',
    'movement_pattern', 'mechanic', 'laterality', 'posture_tips', 'aliases', 'origin',
]
ID_RE = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
SPANISH_CHARS = re.compile(r'[áéíóúñ¿¡ÁÉÍÓÚÑ]')
FORBIDDEN_IN_NAMES = re.compile(r'drop sets?|\blb\b|weighted|\d+\s*°(?!\))', re.I)


def v1_ids():
    text = Path(V1_DOC).read_text(encoding='utf-8')
    section = text.split('## Catálogo propuesto', 1)[1].split('\n## ', 1)[0]
    return set(re.findall(r'^\| `([a-z0-9-]+)`', section, re.M))


def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR)
    problems = []
    exercises = []
    for file in sorted(folder.glob('*.json')):
        try:
            data = json.loads(file.read_text(encoding='utf-8'))
        except json.JSONDecodeError as error:
            problems.append(f'{file.name}: invalid JSON ({error})')
            continue
        for item in data:
            exercises.append((file.name, item))

    for file, ex in exercises:
        where = f"{file}:{ex.get('id', '?')}"
        missing = [k for k in REQUIRED if k not in ex]
        if missing:
            problems.append(f'{where}: missing {missing}')
            continue
        if not ID_RE.match(ex['id']):
            problems.append(f'{where}: bad id format')
        if ex['body_region'] not in BODY_REGIONS:
            problems.append(f"{where}: body_region {ex['body_region']!r}")
        if not 1 <= len(ex['primary_muscles']) <= 2:
            problems.append(f'{where}: needs 1-2 primary muscles')
        if len(ex['secondary_muscles']) > 4:
            problems.append(f'{where}: more than 4 secondary muscles')
        for muscle in ex['primary_muscles'] + ex['secondary_muscles']:
            if muscle not in MUSCLES:
                problems.append(f'{where}: unknown muscle {muscle!r}')
        if set(ex['primary_muscles']) & set(ex['secondary_muscles']):
            problems.append(f'{where}: muscle listed as primary and secondary')
        if ex['equipment'] not in EQUIPMENT:
            problems.append(f"{where}: equipment {ex['equipment']!r}")
        if ex['movement_pattern'] not in PATTERNS:
            problems.append(f"{where}: movement_pattern {ex['movement_pattern']!r}")
        if ex['mechanic'] not in ('compound', 'isolation'):
            problems.append(f'{where}: mechanic')
        if ex['laterality'] not in ('bilateral', 'unilateral'):
            problems.append(f'{where}: laterality')
        if ex['origin'] not in ('existing', 'new'):
            problems.append(f'{where}: origin')
        tips = ex['posture_tips']
        if len(tips) != 5:
            problems.append(f'{where}: {len(tips)} posture tips (need 5)')
        for tip in tips:
            if len(tip) > 140:
                problems.append(f'{where}: tip over 140 chars')
            if SPANISH_CHARS.search(tip):
                problems.append(f'{where}: tip is not in English: {tip[:50]!r}')
        if len(set(tips)) != len(tips):
            problems.append(f'{where}: repeated tip')
        for name_key in ('name_en', 'name_es'):
            if FORBIDDEN_IN_NAMES.search(ex[name_key]):
                problems.append(f'{where}: {name_key} contains a plan modifier: {ex[name_key]!r}')
        if ex['name_en'] != ex['name_en'].strip() or '  ' in ex['name_en']:
            problems.append(f'{where}: name_en spacing')

    ids = Counter(ex.get('id') for _, ex in exercises)
    problems += [f'duplicate id {i} ({n}x)' for i, n in ids.items() if n > 1]
    names = Counter(ex.get('name_en', '').lower() for _, ex in exercises)
    problems += [f'duplicate name_en {n!r}' for n, c in names.items() if c > 1]
    all_ids = set(ids)
    alias_owner = {}
    for _, ex in exercises:
        for alias in ex.get('aliases', []):
            if alias in all_ids:
                problems.append(f"alias {alias} of {ex['id']} is also an exercise id")
            if alias in alias_owner:
                problems.append(f'alias {alias} claimed by {alias_owner[alias]} and {ex["id"]}')
            alias_owner[alias] = ex['id']
    for ex_id in sorted(v1_ids() - all_ids):
        problems.append(f'v1 id {ex_id} missing (existing ids must be kept)')
    tip_counts = Counter(t for _, ex in exercises for t in ex.get('posture_tips', []))
    problems += [f'tip reused {n}x across exercises: {t[:60]!r}' for t, n in tip_counts.items() if n > 2]

    print(f'{len(exercises)} exercises in {folder}')
    print('by region:', dict(Counter(ex.get('body_region') for _, ex in exercises)))
    print('by origin:', dict(Counter(ex.get('origin') for _, ex in exercises)))
    if problems:
        print(f'\n{len(problems)} problem(s):')
        for problem in problems:
            print(' -', problem)
        sys.exit(1)
    print('OK')


if __name__ == '__main__':
    main()

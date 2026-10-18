import hashlib
import json
import re
import sys
from pathlib import Path


def verify(manifest_path, skills_root):
    manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
    root = Path(skills_root).resolve()
    if not isinstance(manifest, dict):
        raise ValueError('Checksum manifest must be a JSON object')

    entries = set()
    for relative_path, expected in manifest.items():
        if not isinstance(relative_path, str) or not relative_path:
            raise ValueError(f'Invalid skill path: {relative_path!r}')
        relative = Path(relative_path)
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError(f'Invalid skill path: {relative_path!r}')
        if not isinstance(expected, str) or not re.fullmatch(r'[0-9a-f]{64}', expected):
            raise ValueError(f'Invalid SHA-256 for {relative_path}')
        path = (root / relative).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f'Missing or invalid skill file: {relative_path}')
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'SHA-256 mismatch for {relative_path}: {actual}')
        entries.add(relative.as_posix())

    files = {
        path.relative_to(root).as_posix()
        for path in root.rglob('*')
        if path.is_file()
    }
    if files != entries:
        missing = sorted(files - entries)
        extra = sorted(entries - files)
        raise ValueError(f'Manifest coverage mismatch; unlisted={missing}, nonexistent={extra}')
    return len(entries)


if __name__ == '__main__':
    repository = Path(__file__).resolve().parents[1]
    try:
        count = verify(repository / 'docs/governance/skill-checksums.json',
                       repository / '.claude/skills')
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f'Skill checksum verification failed: {error}', file=sys.stderr)
        raise SystemExit(1)
    print(f'Verified {count} vendored skill file checksums')

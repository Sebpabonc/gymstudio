# Exercise catalogue v2 — specification (Tech Lead)

Contract for the PT / Fitness Expert when producing the v2 catalogue (200+ exercises),
and for `scripts/validate-catalogue.py`, which checks every file automatically.

## Files

One JSON file per region group in `docs/fitness/drafts/catalogue-v2/`:
`chest-shoulders.json`, `back.json`, `legs-glutes.json`, `arms-core.json`.
Each file is a JSON array of exercise objects (UTF-8, 2-space indent).

## Exercise object

```json
{
  "id": "dumbbell-bench-press-incline",
  "name_en": "Dumbbell Bench Press (Incline)",
  "name_es": "Press de banca con mancuernas (inclinado)",
  "body_region": "Chest",
  "primary_muscles": ["Chest"],
  "secondary_muscles": ["Front Delts", "Triceps"],
  "equipment": "dumbbell",
  "movement_pattern": "push horizontal",
  "mechanic": "compound",
  "laterality": "bilateral",
  "posture_tips": ["…", "…", "…", "…", "…"],
  "aliases": [],
  "origin": "new"
}
```

| Field | Rule |
|---|---|
| `id` | Lowercase-dash, unique across all files. **Existing ids (v1) must be kept exactly** (history references them). New ids are derived from `name_en` (e.g. `cable-fly-high-to-low`). |
| `name_en` | Format: `<Equipment> <Exercise> (<Variant>, <Variant>)`, Title Case. Equipment word first except bodyweight/standard names (`Pull-Up (Neutral Grip)`, `Push-Up`, `Dip`). Variants in parentheses, ordered: angle/position → grip → stance/foot → unilateral. No set techniques, loads or degrees in names (`Drop Sets`, `30°`, `Weighted` are plan modifiers), except standard named angles (`45° Back Extension` → `Back Extension (45°)`). |
| `name_es` | Optional Spanish translation kept for future localisation (same structure, sentence case). The app is English-only. |
| `body_region` | One of: `Chest`, `Back`, `Shoulders`, `Arms`, `Legs`, `Glutes`, `Core`, `Full Body`. |
| `primary_muscles` | 1–2 muscles mostly targeted. |
| `secondary_muscles` | 0–4 supporting muscles; never repeat a primary. |
| Muscles (allowed) | `Chest`, `Upper Chest`, `Lats`, `Upper Back`, `Traps`, `Lower Back`, `Front Delts`, `Side Delts`, `Rear Delts`, `Biceps`, `Triceps`, `Forearms`, `Quads`, `Hamstrings`, `Glutes`, `Adductors`, `Abductors`, `Calves`, `Abs`, `Obliques`, `Hip Flexors`. |
| `equipment` | One of: `barbell`, `dumbbell`, `cable`, `machine`, `plate-loaded`, `smith-machine`, `bodyweight`, `ez-bar`, `hex-bar`, `kettlebell`, `band`. |
| `movement_pattern` | One of: `push horizontal`, `push vertical`, `pull horizontal`, `pull vertical`, `squat`, `hinge`, `lunge`, `isolation`, `core`, `carry`. |
| `mechanic` | `compound` or `isolation`. |
| `laterality` | `bilateral` or `unilateral`. |
| `posture_tips` | **Exactly 5**, **English**, one sentence each, ≤ 140 characters, imperative ("Keep…", "Plant…"). Order: 1) starting position, 2) posture/alignment during the movement, 3) execution (range and control), 4) common mistake to avoid, 5) safety. No medical advice. |
| `aliases` | Old ids merged into this exercise (carry over v1 aliases). |
| `origin` | `existing` (v1 id kept) or `new`. |

## Region ownership (to avoid duplicates between files)

- **chest-shoulders**: all chest presses/flies/push-ups/dips; all shoulder presses, raises, face pulls, rear-delt work.
- **back**: pulldowns, pull-ups, rows, pullovers, shrugs, straight-arm work.
- **legs-glutes**: squats, lunges, leg press, leg extensions/curls, calves, deadlifts and all hinges (RDL, good morning, back extensions), hip thrusts, glute/adductor/abductor work.
- **arms-core**: biceps, triceps (except dips), forearms, all core/abs, carries and full-body.

## Quality bar

- Real, commonly performed gym exercises; no invented movements.
- Cover each region broadly: barbell, dumbbell, cable, machine and bodyweight options.
- Tips are specific to the exercise (not generic copy-paste across exercises).

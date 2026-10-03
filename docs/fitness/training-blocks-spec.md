# Training blocks — specification (Tech Lead)

A **training block** is a 6-week program (mesocycle). The user picks the active block in
"Planned before you go" and switches every 6 weeks. Blocks are owner-curated reference
content (like the exercise catalogue): authored by the PT, approved, stored in Supabase.

## Files

- `docs/fitness/drafts/training-blocks/blocks.json` — array of blocks (historical + new).
- `docs/fitness/drafts/training-blocks/strategy.md` — the training strategy in plain English.
- `docs/fitness/drafts/training-blocks/catalogue-additions.json` — exercises the blocks need
  that are missing from the catalogue, in the catalogue v2 format
  (`docs/fitness/catalogue-v2-spec.md`). May be an empty array.

`scripts/validate-blocks.py` checks all three automatically.

## Block object

```json
{
  "id": "block-2026-02-16-hypertrophy-flat-pyramid",
  "number": 1,
  "name": "Hypertrophy Flat Pyramid",
  "method": "flat-pyramid",
  "start_date": "2026-02-16",
  "weeks": 6,
  "origin": "coach",
  "summary": "One or two sentences: goal, rep ranges, techniques.",
  "insights": [
    { "title": "Goal", "body": "…" },
    { "title": "How it works", "body": "…" }
  ],
  "days": [
    {
      "key": "chest-back-a",
      "name": "Chest-Back A",
      "focus": "Chest and back, heavy day",
      "exercises": [
        {
          "code": "A1",
          "exercise_id": "db-press-neutral-grip",
          "sets": 4,
          "reps": ["12", "12", "12", "12"],
          "rest_seconds": 90,
          "technique": "straight",
          "angle_degrees": 45,
          "notes": ""
        }
      ]
    }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | `block-<start_date>-<method-slug>`, unique. |
| `number` | 1..n in chronological order. |
| `method` | `flat-pyramid`, `reverse-pyramid`, `ascending-pyramid`, `strength-hypertrophy`, or another lowercase-dash key explained in `strategy.md`. |
| `start_date` | ISO date (Monday). New blocks continue every 6 weeks after the previous one. |
| `origin` | `coach` (from the 2026 spreadsheet) or `pt` (new, PT-designed). |
| `summary` | 1–2 plain-English sentences (≤ 260 characters), always visible in the app. |
| `insights` | 5–6 expandable sections, in this order and with these titles: `Goal`, `How it works`, `A days vs B days`, `How to progress`, `What to expect`, and optionally `Key tips`. Each `body` is 2–4 sentences (≤ 600 characters), plain English for a non-professional, specific to this block's method and exercises, no medical advice. |
| `days` | Exactly 6, in order: `chest-back-a`, `arms-a`, `lower-body-a`, `chest-back-b`, `arms-b`, `lower-body-b`. Names "Chest-Back A", "Arms A" (shoulders + arms), "Lower Body A", … Each day has a short `focus` label (≤ 28 chars, e.g. "Chest & back · heavy"). |
| `code` | Letter + number (`A1`, `B1`, `B2`…). Same letter with 2 numbers = superset. |
| `exercise_id` | Must exist in the catalogue (`docs/fitness/approved/catalogue-v2/*.json`) or in `catalogue-additions.json`. |
| `sets` / `reps` | `reps` has one string per set: `"12"`, `"8"`, or for drop sets `"12+12"`. Its length equals `sets`. |
| `rest_seconds` | Rest after the set (superset first exercise: 10). |
| `technique` | `straight`, `superset`, `drop-set`, `pyramid` (load goes up as reps go down), `reverse-pyramid` (heaviest first, load goes down as reps go up). |
| `angle_degrees` | Bench/seat angle in degrees: `0` = flat, positive = incline (e.g. 15, 30, 45, 60, 75, 90 = upright seat), negative = decline (e.g. -15, -30). **Required** for every exercise performed on an adjustable bench or seat (free-weight presses, flies, pullovers, skull crushers, incline curls, Y-raises, chest-supported rows, seated dumbbell presses); `null` only for exercises where the angle doesn't apply (machines with a fixed path, standing, cables, legs). |
| `notes` | Optional short English cue (≤ 80 chars) that adds information not shown elsewhere — never repeat the angle, technique or sets/reps. |

B days use the same exercises as the matching A day with higher reps (lighter loads) —
keep that pattern in new blocks unless `strategy.md` explains a deliberate change.
No logged weights are stored in blocks (those belong to the user's history).

## Bench angles

Bench inclination changes which part of a muscle works hardest (e.g. flat → mid chest,
15–30° → upper chest, 45° → upper chest + front delts, decline → lower chest). Every bench
exercise states its angle, and the PT rotates angles across blocks so each region is trained
over the year. The rationale lives in `approved/training-blocks/strategy.md` ("Bench angle strategy").

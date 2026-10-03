# Exercise catalogue v2 — approved

- **Content:** 224 exercises (64 v1 ids kept, 160 new), written by the PT / Fitness Expert
  following [catalogue-v2-spec.md](../../catalogue-v2-spec.md).
- **Approval (2026-10-03):** Sebas requested the expansion and delegated the taxonomy and
  consistency review to the Tech Lead ("que el PT lo haga, que tú lo revises taxonomía y
  consistencia, después lo pasamos a Supabase y a la app").
- **Tech Lead review:** `scripts/validate-catalogue.py` passes (enums, 5 tips, no duplicate ids/names,
  every v1 id and alias preserved); manual checks of naming format, mechanic/pattern consistency
  and a sample of posture tips. One fix applied: "Hex Bar Deadlift" → "Hex-Bar Deadlift".
- **Open items for a future content review** (PT notes, not blocking): exact machine for the
  "Supp." rows and `wide-grip-cable-chest-pulls`, bar type for `heels-elevated-hb-squats`,
  Smith vs barbell for `close-grip-decline-press`, overlap of `dumbbell-curl-incline` with
  `db-curls-offset-grip`.
- **To change content:** edit the JSON via a PT draft → approval → re-run
  `python3 scripts/catalogue-v2-seed.py` into a new migration.

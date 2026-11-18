---
title: Block 7 Lower Body A/B with only the PO's six leg exercises (6 entries, 3 supersets)
status: approved
author: pt-fitness-expert
created: 2026-11-18
approved_by: Tech Lead (PO delegated content approvals to the crew on 2026-11-15)
approved_on: 2026-11-19
exercises: [machine-hip-thrust, leg-press-calf-raises-toes-neutral, leg-extensions-toes-dorsiflexed-neutral, machine-standing-leg-curl, machine-hip-abduction, machine-hip-adduction]
---

## Summary
Sebas decided (2026-11-18) that his Block 7 leg days (`block-2026-11-16-strength-hypertrophy-ii`) contain **only**
his six machine exercises: hip thrust, calf raise on the leg press, leg extension, standing leg curl, hip abduction
and hip adduction. The back squat, Romanian deadlift, reverse lunge, seated leg curl, Smith calf raise and ab wheel
come out of the leg days (plan entries only; ids and history untouched). This is his decision. This draft builds
the best version of it and grades the consequences honestly.

Each day: **6 entries, 3 supersets (A, B, C), every exercise 4 sets, 24 hard sets**. The hip thrust is the main
loaded lift, so it goes first. The A day is heavier (hip thrust 8 reps, isolations 10-12). The B day is the volume
day (hip thrust 10, isolations 12-15). There is no reverse-pyramid top set on the leg days any more. A and B use the
same exercises in the same order. Hip thrust variant: `machine-hip-thrust` (fallback `smith-machine-hip-thrust`).

### Plain-language summary for Sebas
Your leg days are now exactly your six machines, done as three pairs, each 4 sets. First the hip thrust with calf
raises on the leg press, then leg extensions with the standing leg curl, then the abduction machine with the
adduction machine. A leg day takes about 55 minutes instead of 70-75, and it is much easier on your lower back and
your overall energy. The honest trade-off is that without squats and Romanian deadlifts your squat and deadlift
strength will probably go down over these 6 weeks. Your quads and hamstrings also get less than half the work they
had, so expect them to grow more slowly. Your glutes, outer hips and inner thighs get more work than ever. Block 8
brings a squat back (Smith squat), so we will restart it with lighter weights. Ab work is gone from the plan; if you
want it back, we can add a short ab exercise on your Arms days.

## The new days (weeks 2-5; week 1 and week 6 rules unchanged)

Superset = first exercise, about 10 s, second exercise, then the listed rest. Rest = after the set.

### Lower Body A (heavier), 6 entries, 24 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `machine-hip-thrust` | 4 × 8 | superset | 10 | null | Warm up with 2 light sets. Chin tucked; squeeze 1 s at the top, no arching. |
| A2 | `leg-press-calf-raises-toes-neutral` | 4 × 10 | superset | 120 | null | Knees straight, not locked; pause 2 s in the deep stretch at the bottom. |
| B1 | `leg-extensions-toes-dorsiflexed-neutral` | 4 × 10 | superset | 10 | null | Slow through the deep bend. Last set: rest-pause, 15 s, then 2 mini-sets. |
| B2 | `machine-standing-leg-curl` | 4 × 10 | superset | 90 | null | Reps per leg. Hips pressed into the pad; lower slowly to a straight knee. |
| C1 | `machine-hip-abduction` | 4 × 12 | superset | 10 | null | Sit tall, push out with your knees; pause 1 s wide, close slowly. |
| C2 | `machine-hip-adduction` | 4 × 12 | superset | 60 | null | Same machine as abduction if it is a 2-in-1; open slowly to a mild stretch. |

### Lower Body B (volume), 6 entries, 24 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `machine-hip-thrust` | 4 × 10 | superset | 10 | null | (as A) |
| A2 | `leg-press-calf-raises-toes-neutral` | 4 × 12 | superset | 90 | null | (as A) |
| B1 | `leg-extensions-toes-dorsiflexed-neutral` | 4 × 12 | superset | 10 | null | Slow through the deep bend. Last set: drop the weight about 25%, keep going. |
| B2 | `machine-standing-leg-curl` | 4 × 12 | superset | 90 | null | (as A) |
| C1 | `machine-hip-abduction` | 4 × 15 | superset | 10 | null | (as A) |
| C2 | `machine-hip-adduction` | 4 × 15 | superset | 60 | null | (as A) |

Order logic: the hip thrust is now the only heavy, loaded compound, so it goes first while he is fresh, with 2
warm-up sets. It is paired with calves, which do not compete with the glutes. Leg extension + leg curl is a true
antagonist pair (as in Block 6 and the current Block 7). The two light hip isolations close the day, often on one
2-in-1 machine. A2 rest is 120 s on A days because the 8-rep hip thrust is the heaviest set of the day.

### JSON-ready rows (replace the `"exercises"` of `lower-body-a` / `lower-body-b`)

Lower Body A:
```json
[
  {"code": "A1", "exercise_id": "machine-hip-thrust", "sets": 4, "reps": ["8", "8", "8", "8"], "technique": "superset", "rest_seconds": 10, "angle_degrees": null, "notes": "Warm up with 2 light sets. Chin tucked; squeeze 1 s at the top, no arching."},
  {"code": "A2", "exercise_id": "leg-press-calf-raises-toes-neutral", "sets": 4, "reps": ["10", "10", "10", "10"], "technique": "superset", "rest_seconds": 120, "angle_degrees": null, "notes": "Knees straight, not locked; pause 2 s in the deep stretch at the bottom."},
  {"code": "B1", "exercise_id": "leg-extensions-toes-dorsiflexed-neutral", "sets": 4, "reps": ["10", "10", "10", "10"], "technique": "superset", "rest_seconds": 10, "angle_degrees": null, "notes": "Slow through the deep bend. Last set: rest-pause, 15 s, then 2 mini-sets."},
  {"code": "B2", "exercise_id": "machine-standing-leg-curl", "sets": 4, "reps": ["10", "10", "10", "10"], "technique": "superset", "rest_seconds": 90, "angle_degrees": null, "notes": "Reps per leg. Hips pressed into the pad; lower slowly to a straight knee."},
  {"code": "C1", "exercise_id": "machine-hip-abduction", "sets": 4, "reps": ["12", "12", "12", "12"], "technique": "superset", "rest_seconds": 10, "angle_degrees": null, "notes": "Sit tall, push out with your knees; pause 1 s wide, close slowly."},
  {"code": "C2", "exercise_id": "machine-hip-adduction", "sets": 4, "reps": ["12", "12", "12", "12"], "technique": "superset", "rest_seconds": 60, "angle_degrees": null, "notes": "Same machine as abduction if it is a 2-in-1; open slowly to a mild stretch."}
]
```

Lower Body B:
```json
[
  {"code": "A1", "exercise_id": "machine-hip-thrust", "sets": 4, "reps": ["10", "10", "10", "10"], "technique": "superset", "rest_seconds": 10, "angle_degrees": null, "notes": "Warm up with 2 light sets. Chin tucked; squeeze 1 s at the top, no arching."},
  {"code": "A2", "exercise_id": "leg-press-calf-raises-toes-neutral", "sets": 4, "reps": ["12", "12", "12", "12"], "technique": "superset", "rest_seconds": 90, "angle_degrees": null, "notes": "Knees straight, not locked; pause 2 s in the deep stretch at the bottom."},
  {"code": "B1", "exercise_id": "leg-extensions-toes-dorsiflexed-neutral", "sets": 4, "reps": ["12", "12", "12", "12"], "technique": "superset", "rest_seconds": 10, "angle_degrees": null, "notes": "Slow through the deep bend. Last set: drop the weight about 25%, keep going."},
  {"code": "B2", "exercise_id": "machine-standing-leg-curl", "sets": 4, "reps": ["12", "12", "12", "12"], "technique": "superset", "rest_seconds": 90, "angle_degrees": null, "notes": "Reps per leg. Hips pressed into the pad; lower slowly to a straight knee."},
  {"code": "C1", "exercise_id": "machine-hip-abduction", "sets": 4, "reps": ["15", "15", "15", "15"], "technique": "superset", "rest_seconds": 10, "angle_degrees": null, "notes": "Sit tall, push out with your knees; pause 1 s wide, close slowly."},
  {"code": "C2", "exercise_id": "machine-hip-adduction", "sets": 4, "reps": ["15", "15", "15", "15"], "technique": "superset", "rest_seconds": 60, "angle_degrees": null, "notes": "Same machine as abduction if it is a 2-in-1; open slowly to a mild stretch."}
]
```

English note lengths (hand count): A1 75, A2 72, B1-A 73, B1-B 76, B2 73, C1 65, C2 75. All ≤ 80.

### Day focus labels (replace "Legs & core", abs are gone)
| Day | EN `focus` (≤ 28) | ES `focus` |
|---|---|---|
| `lower-body-a` | Legs & glutes · heavy (21) | Piernas y glúteos · pesado |
| `lower-body-b` | Legs & glutes · volume (22) | Piernas y glúteos · volumen |

### Spanish notes (`docs/fitness/approved/es/blocks.json`, block `block-2026-11-16-strength-hypertrophy-ii`)
**Replace** all `lower-body-a/*` and `lower-body-b/*` note keys with exactly these 12. The old keys `D1`, `D2`, `E1`,
`E2` on both leg days **must be deleted**: those codes no longer exist, so `validate-blocks.py` will fail on them.

| Key | Spanish (chars) |
|---|---|
| `lower-body-a/A1` | Calienta con 2 series ligeras. Mentón adentro; aprieta 1 s arriba sin arquear. (78) |
| `lower-body-a/A2` | Rodillas estiradas sin bloquear; pausa de 2 s abajo, en el estiramiento. (72) |
| `lower-body-a/B1` | Lento en la flexión profunda. Última serie: rest-pause, 15 s y 2 mini-series. (77) |
| `lower-body-a/B2` | Reps por pierna. Cadera pegada al cojín; baja lento hasta estirar la rodilla. (77) |
| `lower-body-a/C1` | Siéntate erguido, rodillas hacia afuera; pausa 1 s abierto y cierra lento. (74) |
| `lower-body-a/C2` | Misma máquina que la abducción si es 2 en 1; abre lento, estiramiento leve. (75) |
| `lower-body-b/A1` | Calienta con 2 series ligeras. Mentón adentro; aprieta 1 s arriba sin arquear. (78) |
| `lower-body-b/A2` | Rodillas estiradas sin bloquear; pausa de 2 s abajo, en el estiramiento. (72) |
| `lower-body-b/B1` | Lento en la flexión profunda. Última serie: baja el peso un 25% y sigue. (72) |
| `lower-body-b/B2` | Reps por pierna. Cadera pegada al cojín; baja lento hasta estirar la rodilla. (77) |
| `lower-body-b/C1` | Siéntate erguido, rodillas hacia afuera; pausa 1 s abierto y cierra lento. (74) |
| `lower-body-b/C2` | Misma máquina que la abducción si es 2 en 1; abre lento, estiramiento leve. (75) |

## Block 7 texts that change (summary + insights)

Four block texts mention the squat, the 4-5 rep top set on every A day, leg volume or session length. They are
listed below with their replacements. "A days vs B days", "How to progress" and "Key tips" stay as they are:
they are generic and still true (the safety pins and spotter tip still applies to the Smith bench and overhead
press). EN lengths are hand-counted, and every body is between 40 and 600 characters.

**Summary** (EN about 232 characters, limit 260)
- EN: A 6-week strength block: a heavy top set of 4 reps on the chest-back and arms A days, 6-8 reps on A days and
  8-10 on B days, 3 back exercises per chest-back day, machine-based leg days, supersets every day and no exercise
  above 4 sets.
- ES: Un bloque de fuerza de 6 semanas: una serie top pesada de 4 reps en los días A de pecho-espalda y brazos, 6-8
  reps en los días A y 8-10 en los B, 3 ejercicios de espalda por día de pecho y espalda, piernas en máquinas,
  superseries todos los días y ningún ejercicio con más de 4 series.

**Goal** (EN about 395 characters)
- EN: Get stronger on the big lifts while you keep building muscle. Muscle grows about the same from 5 to 30 reps
  when sets are hard, but heavier sets build more strength, so a small dose of heavy 4-rep work sits on top of 6-12
  rep sets. Total hard sets per week is what drives growth: about 20 for chest, back, biceps and triceps; on leg days,
  16 for glutes and 8 each for quads, hamstrings, calves and inner thighs.
- ES: Ganar fuerza en los ejercicios grandes mientras sigues construyendo músculo. El músculo crece más o menos igual
  entre 5 y 30 reps cuando las series son exigentes, pero las series pesadas construyen más fuerza, así que se suma
  una dosis pequeña de trabajo pesado a 4 reps sobre series de 6-12. Lo que impulsa el crecimiento es el total de
  series exigentes por semana: unas 20 para pecho, espalda, bíceps y tríceps; en los días de pierna, 16 para glúteos
  y 8 para cuádriceps, femorales, pantorrillas y aductores.

**How it works** (EN about 557 characters)
- EN: Chest-back A and Arms A open alone with a reverse pyramid: one heavy top set of 4 reps (Smith bench, seated
  overhead press), then lighter sets of 6, 8 and 10, with 3 minutes rest. After that, and for the whole leg day, work
  is done in supersets of two muscles that don't compete, like the incline press with chin-ups or leg extensions with
  leg curls: first exercise, about 10 seconds, second exercise, then the full rest. Chest-back days have three back
  exercises: chin-ups, a chest-supported row and straight-arm pulldowns. No exercise has more than 4 sets.
- ES: Los días A de pecho-espalda y brazos abren solos con una pirámide inversa: una serie top pesada de 4 reps (banca
  en Smith, press militar sentado), luego series más ligeras de 6, 8 y 10, con 3 minutos de descanso. Después, y en
  todo el día de pierna, el trabajo va en superseries de dos músculos que no compiten, como el press inclinado con
  dominadas o la extensión con el curl femoral: el primero, unos 10 segundos, el segundo y luego el descanso completo.
  Los días de pecho y espalda tienen tres ejercicios de espalda: dominadas, remo con pecho apoyado y jalón con brazos
  rectos. Ningún ejercicio pasa de 4 series.

**What to expect** (EN about 300 characters)
- EN: Supersets make sessions denser: about 65-75 minutes (leg days about 55), with fewer long waits, but you will
  breathe harder. The heavy top sets still get full rest. Your back is now trained from three angles every chest-back
  day. By week 5 your top sets should be clearly heavier than in week 2.
- ES: Las superseries hacen las sesiones más densas: unos 65-75 minutos (los días de pierna, unos 55), con menos
  esperas largas, pero vas a respirar más fuerte. Las series top pesadas siguen con descanso completo. Tu espalda
  ahora se trabaja desde tres ángulos cada día de pecho y espalda. Para la semana 5 tus series top deberían ser
  claramente más pesadas que en la semana 2.

## Weekly direct sets (weeks 2-5, both leg days done)

"Direct" = the muscle is the main target. Fractional = indirect work counted as half a set (Pelland 2026 method).

| Muscle | Now (approved, migration 041) | This draft | Per session | Within the supported range (≥ 10/week)? |
|---|---|---|---|---|
| Quads | 20 (squat 8, lunge 6, extension 6) | **8** (extension) + ~4 fractional (hip thrust) | 4 | No: below 10 direct |
| Hamstrings | 14 (RDL 8, seated curl 6) | **8** (standing curl) + ~4 fractional (hip thrust) | 4 | No: below 10 direct |
| Glutes | 0 direct (+ ~11 fractional) | **16** (hip thrust 8, abduction 8) | 8 | Yes |
| Adductors | 0 direct (+ ~4 fractional) | **8** | 4 | Borderline (new work) |
| Calves | 8 | **8** | 4 | Unchanged |
| Abs | 8 | **0** | 0 | Removed |
| Lower back (spinal erectors) | heavy (squat + RDL) | minimal | n/a | Lower fatigue (see decision 6) |

Hard sets per leg day: A 25 → 24, B 25 → 24.

## Estimated minutes per day (weeks 2-5)
Same method as the approved redesign (Practical): about 45 s per set (75 s for per-leg sets), the prescribed rest,
10 s between partners, about 1.5 min to set up each exercise, warm-up 6 min (general warm-up + 2 light hip thrust
sets).

| Day | Now | This draft |
|---|---|---|
| Lower Body A | ~74 | **~55** (A pair 14.7, B pair 14.7, C pair 10.7, setup 9, warm-up 6) |
| Lower Body B | ~68 | **~53** |

## Decisions and graded consequences

| # | Decision or consequence | Grade | Evidence and reasoning |
|---|---|---|---|
| 1 | Squat and RDL removed (PO decision) → squat and hinge strength will likely stall or drop over 6 weeks | **Strong** (strength is specific) | Strength gains are largest on the trained exercise: in Plotkin 2023 each group improved most on its own lift. Free-weight vs machine training also favours the trained mode on strength tests (Haugen 2023). The block is named a strength block, but the leg days are now hypertrophy days without a heavy strength lift (Practical note). |
| 2 | Quads 20 → 8 and hamstrings 14 → 8 direct sets a week → slower growth for both | **Strong** | More weekly hard sets give more growth, with diminishing returns, and 10+ sets clearly beat lower volumes (Schoenfeld 2017; Pelland 2026). 8 sets still grows muscle, just less. 4 sets on every exercise (the PO's cap) is how this draft recovers as much as possible. The hip thrust adds a little quad and hamstring work (fractional), but much less than squats: squats grew the quads and adductors more than hip thrusts (Plotkin 2023). |
| 3 | No hamstring work at long length any more (RDL gone; standing curl is done with the hip extended) | **Moderate** | The hip-flexed seated curl grew the hamstrings more than the hip-extended lying curl (Maeo 2021, single RCT). The standing curl is like the lying curl, and the RDL was the long-length hamstring work. If he ever wants one change here, the seated curl in place of the standing curl recovers this (open decisions). |
| 4 | Glutes get 16 direct sets (hip thrust 8 + abduction 8) | **Moderate** | Hip thrusts grew the glutes about as much as squats with equal sets, with estimates slightly favouring the hip thrust (Plotkin 2023, small, untrained sample). Squats and hip thrusts grew the glute medius/minimus very little, so direct abduction fills a real gap (inference from Plotkin 2023; no RCT on the abduction machine: Practical for the exercise). |
| 5 | Hip thrust first, paired with calves; extension + curl; abduction + adduction | **Strong** (supersets) / **Practical** (order and pairs) | Supersets gave similar growth and strength to traditional sets in less time; antagonist pairs kept reps up, same-muscle pairs cut volume (Zhang 2025). With nothing heavier on the day, the most loaded lift goes first. Order is neutral for growth; the first exercise gains a little more strength (Nunes 2021). |
| 6 | Much lower spinal and whole-body fatigue; day about 55 min | **Practical** | No heavy axial loading on the leg days. This likely helps recovery for the rows and chin-ups on the next Chest-Back day and lowers the lower-back risk. It is coaching judgement; no study measures this exact swap. |
| 7 | Machine-only leg training still builds muscle | **Moderate** | Free-weight and machine training gave similar hypertrophy (Haugen 2023; only 5 hypertrophy studies). The loss is in strength on free-weight lifts (#1), not in the ability to grow. |
| 8 | Reps: A day hip thrust 8 and isolations 10-12; B day hip thrust 10 and isolations 12-15; no top set | **Strong** (load range) / **Practical** (no pyramid) | Hypertrophy is similar across loads when sets are hard (Lopez 2021), so A/B keep the block's heavier/lighter split. A reverse pyramid does not fit a superset well (load changes every set), and the hip thrust on a machine is not a lift where a 4-5 rep top set adds much (Practical). Growth is the same with pyramids or straight sets (Angleri 2017). |
| 9 | Hip thrust: `machine-hip-thrust` | **Practical** | No study compares hip thrust variants. The machine is fastest to set up in a superset, stable, with small load steps and no bar on the hips. Block 8 also uses it, so these logs give Block 8 a starting weight. Fallback: `smith-machine-hip-thrust`. |
| 10 | Calves: leg-press calf raise, 4 sets, 2 s bottom pause | **Moderate** | Straight-knee calf raises grew the gastrocnemius far more than seated raises (Kinoshita 2023); the leg-press calf raise is a straight-knee raise, so it is an equivalent swap for the Smith calf raise. Training the calf in its long position grew it more (Kassiano 2023). Calves stay at 8 weekly sets. |
| 11 | Last-set extra on the leg extension (A rest-pause, B last-set drop) | **Strong** (equivalent) / **Practical** (where) | Rest-pause and drop sets give growth similar to normal sets in less time (Sødal 2023). The extension is now the only quad exercise. A stable fixed-path machine is the safest place for an extra. |
| 12 | Rest: 120 s (A) / 90 s (B) after the hip thrust pair, 90 s after extension + curl, 60 s after abduction + adduction | **Moderate** | In a pair each muscle rests about 2.5-3 min between its own sets, above the ~90 s point where more rest stops helping growth (Singer 2024). The heavier A-day hip thrust gets 2 extra minutes. |
| 13 | Abs: 8 → 0 weekly sets | **Practical** (Moderate that heavy lifts did not cover them anyway) | Squats and deadlifts load the back extensors far more than the front abs (Hamlyn 2007, EMG only). With the ab wheel gone, the abs get no direct work. Option: add `ab-wheel-rollout` 3 × 12 on the Arms days (they have 7 entries). |
| 14 | 1-2 reps in reserve on weeks 2-5; week 1 and deload rules unchanged | **Strong** / **Moderate** | Growth improves as sets get closer to failure; true failure adds nothing over 1-2 RIR (Robinson 2024; Refalo 2023, 2024). Deload as approved (Coleman 2024; Bell 2023): 4 → 2 sets, no extras. |

## Exercises
All six ids exist in the approved catalogue (`docs/fitness/approved/catalogue-v2/legs-glutes.json`). No NEW ids.
Posture tips: see the approved catalogue entries (unchanged).

### Machine Hip Thrust (`machine-hip-thrust`)
- **Primary / secondary muscles:** glutes / hamstrings, quads.
- **Notes:** Main lift of the day. First session: find a weight he can do for 12 clean reps with a 1 s squeeze, use it
  for the 8s (A) / 10s (B), and add load next time if all reps are clean.

### Plate-Loaded Leg Press Calf Raise (`leg-press-calf-raises-toes-neutral`)
- **Primary muscles:** calves (gastrocnemius, soleus).
- **Notes:** Has logs from Blocks 1 and 5. Keep the leg-press safeties engaged in case a foot slips off the edge.

### Machine Leg Extension (`leg-extensions-toes-dorsiflexed-neutral`)
- **Primary muscles:** quads (including rectus femoris). Now the only direct quad exercise.

### Machine Standing Leg Curl (`machine-standing-leg-curl`)
- **Primary / secondary muscles:** hamstrings / calves. Unilateral: logged reps are per leg. Start with the weaker leg.

### Machine Hip Abduction (`machine-hip-abduction`) and Machine Hip Adduction (`machine-hip-adduction`)
- **Primary muscles:** hip abductors and glutes (glute medius/minimus); adductors.
- **Notes:** Adduction: start at a narrow width and widen gradually. A sharp groin pull means stop; if it persists,
  see a qualified professional.

## Validator check (by hand, against `scripts/validate-blocks.py` and the spec)
- Codes A1, A2, B1, B2, C1, C2: match `^[A-H][1-3]$`, unique; every letter is paired and uses `superset`.
- `reps` length = `sets` = 4 everywhere; superset rows have identical reps per set (no rule applies, but consistent).
- No `reverse-pyramid`, `pyramid` or `drop-set` rows, so those rules do not apply.
- Angles all `null` (machines / plate-loaded; `needs_bench_angle` returns false for all six).
- EN notes ≤ 80 (longest 76), no Spanish characters, none repeat angle, technique or sets/reps.
- Focus labels 21 and 22 characters (limit 28).
- Summary about 232 characters (limit 260); insight bodies all 40-600 (longest about 557); titles unchanged.
- es/blocks.json: only `lower-body-*/A1..C2` keys may remain on the leg days (delete D1, D2, E1, E2), or the
  validator reports unknown exercises.

## ⚠️ Open decisions
- ⚠️ REVISAR (Tech Lead, AI Trainer checklist): A1/B1 change exercise (squat and RDL to hip thrust and leg extension)
  and every code shifts. Check which of `machine-hip-thrust`, `machine-standing-leg-curl`, `machine-hip-abduction`,
  `machine-hip-adduction` have logs. With none, the card must show a "first session, pick a starting weight" state,
  never 0 kg and never "no data" as an error. The standing curl is per leg; check the engine handles unilateral reps.
  Make sure no screen still expects a reverse-pyramid top set on the lower days. Run the invariants and the replay;
  the PT reviews before merge.
- ⚠️ REVISAR (Tech Lead, timing): if Lower Body A was already done this week on the old layout, start the new layout
  with Lower Body B. Week-1 rules apply to the new exercises (2-3 clean reps left, no rest-pause or drop).
- ⚠️ REVISAR (Tech Lead, other docs): `strategy.md` Block 7 bullet (leg exercise list, top set on the back squat) and
  any Block 7 insight or summary translation not listed above should be checked for "squat", "RDL" or "lunge".
- ⚠️ REVISAR (PT/Tech Lead, Block 8): Block 8 opens its leg days with `smith-machine-squat` and keeps the RDL. After 6
  weeks without squatting or hinging, week 1 of Block 8 should start those two lifts about 10-15% below his last
  Block 7 loads (Practical). The trainer engine should not jump straight to his old squat/RDL weights.
- ⚠️ REVISAR (PO, optional, no change unless he asks): (a) abs back via `ab-wheel-rollout` 3 × 12 on Arms A/B;
  (b) if he later wants the hamstrings to grow better, swapping the standing curl for the seated curl
  (`seated-leg-curl-toes-dorsiflexed-neutral`) is the single most evidence-backed change (Maeo 2021).
- ⚠️ REVISAR (gym logistics): confirm the gym has a hip thrust machine (else `smith-machine-hip-thrust`, same rows).
  If paired stations are far apart, rest up to 30 s between partners.
- Evidence caveats: Plotkin 2023 is small and in untrained people. Kinoshita 2023, Kassiano 2023, Maeo 2021 are single
  RCTs. Hamlyn 2007 is EMG only. No hypertrophy RCT exists on the abduction or adduction machines or on hip thrust
  variants. Haugen 2023 has only 5 hypertrophy studies.

## Sources
- Approved inputs: `docs/fitness/approved/training-blocks/blocks.json` (Block 7 texts and leg days, Block 8 leg days),
  `docs/fitness/approved/2026-11-16-block7-redesign.md`, `docs/fitness/training-blocks-spec.md`,
  `scripts/validate-blocks.py`, `docs/fitness/approved/catalogue-v2/legs-glutes.json`,
  `docs/fitness/approved/es/blocks.json`.
- PO decisions, 2026-11-18 (as relayed by the Tech Lead): the six exercises only, squat and RDL removed, max 4 sets,
  supersets.
- Plotkin DL et al. Hip thrust and back squat training elicit similar gluteus muscle hypertrophy and transfer
  similarly to the deadlift. Front Physiol 2023;14:1279170.
  https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1279170/full
- Kinoshita M et al. Triceps surae muscle hypertrophy is greater after standing versus seated calf-raise training.
  Front Physiol 2023;14:1272106. https://www.frontiersin.org/articles/10.3389/fphys.2023.1272106/full
- Kassiano W et al. Greater gastrocnemius muscle hypertrophy after partial range of motion training performed at long
  muscle lengths. J Strength Cond Res 2023;37(9):1746-1753.
- Maeo S et al. Greater hamstrings muscle hypertrophy but similar damage protection after training at long versus
  short muscle lengths. Med Sci Sports Exerc 2021;53(4):825-837. https://pubmed.ncbi.nlm.nih.gov/33009197/
- Hamlyn N, Behm DG, Young WB. Trunk muscle activation during dynamic weight-training exercises and isometric
  instability activities. J Strength Cond Res 2007;21(4):1108-1112.
- Zhang X et al. Superset versus traditional resistance training prescriptions: a systematic review and meta-analysis.
  Sports Med 2025. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12011898/
- Haugen ME et al. Effect of free-weight vs. machine-based strength training on maximal strength, hypertrophy and jump
  performance: a systematic review and meta-analysis. BMC Sports Sci Med Rehabil 2023;15:103.
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and
  increases in muscle mass. J Sports Sci 2017;35(11):1073-1082.
- Pelland JC et al. The resistance training dose response: meta-regressions exploring the effects of weekly volume and
  frequency on muscle hypertrophy and strength gain. Sports Med 2026;56(2):481-505.
- Lopez P et al. Resistance training load effects on muscle hypertrophy and strength gain: systematic review and
  network meta-analysis. Med Sci Sports Exerc 2021;53(6):1206-1216. https://pubmed.ncbi.nlm.nih.gov/33433148/
- Angleri V, Ugrinowitsch C, Libardi CA. Crescent pyramid and drop-set systems do not promote greater strength gains,
  muscle hypertrophy, and changes on muscle architecture compared with traditional resistance training in
  well-trained men. Eur J Appl Physiol 2017;117:359-369.
- Nunes JP et al. What influence does resistance exercise order have on muscular strength gains and muscle
  hypertrophy? Eur J Sport Sci 2021;21(2):149-157.
- Singer A et al. Give it a rest: inter-set rest interval duration and muscle hypertrophy. Front Sports Act Living
  2024;6:1429789.
- Sødal LK et al. Effects of drop sets on skeletal muscle hypertrophy: a systematic review and meta-analysis. Sports
  Med Open 2023;9:66.
- Robinson ZP et al. Sports Med 2024;54(9):2209-2231; Refalo MC et al. Sports Med 2023;53(3):649-665 and J Sports Sci
  2024;42(1):85-101 (proximity to failure).
- Coleman M et al. PeerJ 2024;12:e16777; Bell L et al. Sports Med Open 2023;9:87 (deloads).

---
title: Template library and selection rules (questionnaire → 6-week block)
status: draft
author: PT / Fitness Expert
date: 2026-10-05
---

# Template library and selection rules

Each user fills in the goal questionnaire. The app picks **one base template** (the training
split), then applies **adjustment rules** (goal, experience, session length, activity level) and
publishes the result as that user's 6-week block. Sebas's own blocks (1–9) stay as they are.

All templates use the Block shape from `approved/training-blocks/blocks.json` (`number: 0`,
placeholder `start_date: "2026-01-05"`, `origin: "pt"`). Each base template is written for the
**default profile**: goal `muscle`, `intermediate`, `60` min, `moderate` activity. Everything else
comes from the rules below, so we need far fewer files.

## 1. Template matrix

The split depends only on **days_per_week × equipment**. Goal, experience, session length and
activity level change sets, reps, rest and exercise swaps, not the split.

| days_per_week | full_gym | basic_gym | home |
|---|---|---|---|
| 3 | `tpl-3d-full-body-gym` ✅ | `tpl-3d-full-body-db` ✅ | `tpl-3d-full-body-db` ✅ |
| 4 | `tpl-4d-upper-lower-gym` ✅ | `tpl-4d-upper-lower-db` ✅ | `tpl-4d-upper-lower-db` ✅ |
| 5 | `tpl-5d-upper-lower-ppl-gym` ✅ | `tpl-5d-upper-lower-ppl-db` ✅ | `tpl-5d-upper-lower-ppl-db` ✅ (or cap at 4 ⚠️) |
| 6 | `tpl-6d-ab-split-gym` ✅ | `tpl-6d-ab-split-db` ✅ | `tpl-6d-ab-split-db` ✅ (or cap at 4 ⚠️) |

✅ = drafted (all 8 files). Full library = **8 base templates** covering all
4 × 4 × 3 × 4 × 3 × 4 = 2,304 questionnaire combinations.

- **basic_gym** = dumbbells, adjustable bench, cables, a pulldown/row station, maybe a Smith
  machine. **home** = dumbbells, adjustable bench, bodyweight (maybe bands and a pull-up bar).
  The `-db` templates use only dumbbells + bench + bodyweight, so they work for both; basic_gym
  users get the cable swaps in section 2.6.
- ⚠️ REVISAR: for **home + 5–6 days**, I suggest capping at 4 sessions (dumbbell-only training
  recovers poorly at very high frequency and gains little over 4 days at equal volume). Option:
  offer a 5th "conditioning + core" day. Sebas to decide.
- **Beginners asking for 5–6 days**: cap at 4 days (`tpl-4d-...`), tell them why ("more days
  won't speed up results in your first months; recovery will"). ⚠️ REVISAR: cap, or allow with
  a warning?

Day keys used (not Sebas's 6 fixed keys): `full-body-a/b/c`, `upper-a`, `lower-a`, `upper-b`,
`lower-b`, `upper`, `lower`, `push`, `pull`, `legs`, and for 6 days the existing
`chest-back-a`, `arms-a`, `lower-body-a`, `chest-back-b`, `arms-b`, `lower-body-b`.
Day position = array order. The Tech Lead must relax the "exactly 6 days" rule in
`training-blocks-spec.md` for templates (3–6 days).

## 2. Adjustment rules (applied in this order)

Base values in the JSON = intermediate, muscle, 60 min, moderate activity.
"Main lift" = codes `A1`/`B1` when they are straight sets of a compound.

### 2.1 Goal

| Goal | Sets | Reps | Rest | Notes |
|---|---|---|---|---|
| `muscle` | base | base | base | Default. |
| `strength` | base | main lifts: A day `5`, B day `6–8` (3d/5d heavy days `5`); accessories base | main lifts 180–240 s | Main lifts get +1 set (max 4). Keep RIR ≥ 1 on barbell lifts, never to failure. |
| `fat_loss` | −1 set on each accessory (min 2); main lifts unchanged | base | superset rests −30 s, straight isolation −15 s (floor 45 s); **main lifts unchanged** | Same lifts and loads as muscle: lifting keeps muscle while dieting. Insight text says fat loss comes mostly from a calorie deficit, plus daily steps. |
| `general` | −1 set on accessories (min 2) | base | base | Beginner-friendly exercise swaps allowed even for intermediates. Can add 1 optional core/carry exercise. |

### 2.2 Experience

| Level | Changes |
|---|---|
| `beginner` | Max 3 sets on main lifts, 2 on accessories. Effort stays at about **3 reps before failure (RIR 3)** in weeks 1–2, RIR 2 in weeks 3–5, never to failure. Swap technical lifts for simpler ones (section 2.6). Keep supersets (they are simple), with the harder exercise first. |
| `intermediate` | Base. |
| `advanced` | +1 set on the 2 exercises for the user's priority muscles per day (max 4 sets; ≤ 10 hard sets per muscle per session). RIR down to 0–1 on machine/cable isolation in weeks 4–5. ⚠️ REVISAR: no priority muscle question exists yet; default priority = side delts + hamstrings? |

### 2.3 session_minutes

Estimate time per set ≈ 45 s work + rest (superset pair counts once, plus 10 s). The base
templates fit about **60 min** including a 5–8 min warm-up.

| Minutes | Rule |
|---|---|
| 45 | Drop the last exercise/superset of the day (usually core or the last isolation pair) **or** take every accessory to 2 sets, whichever keeps more exercises for the larger muscles. Never cut main lifts. |
| 60 | Base. |
| 75 | +1 set on 2 accessory exercises (priority muscles first). |
| 90 | 75-min rule + 1 extra accessory exercise for a lagging/priority area, or longer rests on main lifts for strength. Volume caps still apply (≤ 20 weekly sets per muscle, ≤ 10 per session). |

### 2.4 activity_level (outside the gym)

| Level | Rule |
|---|---|
| `low` | Base. |
| `moderate` | Base. |
| `high` (physical job, sports, lots of cardio) | −1 set on leg accessories; week 1 RIR 3, and suggest the lighter week-6 deload as **mandatory**. Legs volume is the first thing cut because running/standing jobs add lower-body fatigue. |

### 2.5 Volume guardrails (check after all rules)

- 10–20 weekly hard sets per muscle (indirect = 0.5), beginners 8–12, ≤ 10 per muscle per session
  (evidence brief §1, §8).
- Minimum 2 sets per exercise; maximum 4.
- Weekly frequency ≥ 2 per muscle (the 3-day templates reach 3).

### 2.6 Exercise swaps

| Situation | Swap |
|---|---|
| Beginner: `back-squat` | `dumbbell-goblet-squat` (3 d) or `leg-press-quad-dominant` (4–6 d) |
| Beginner: `barbell-bench-press` | `dumbbell-bench-press` or `machine-chest-press-incline` |
| Beginner: `romanian-deadlift` | `dumbbell-romanian-deadlift` |
| Beginner: `hex-bar-deadlift` | `dumbbell-romanian-deadlift` |
| Beginner: `dumbbell-bulgarian-split-squat` | `dumbbell-split-squat` |
| Beginner: `hanging-knee-raise` | `dead-bug` |
| Beginner (home): `push-up` | `push-up-incline` |
| basic_gym (has cables) in `-db` templates | `dumbbell-row-single-arm` ↔ `seated-cable-row`; `dumbbell-overhead-triceps-extension` → `rope-low-cable-oh-tricep-extensions`; `lying-leg-raise` → `cable-crunch` |
| Home with a pull-up bar | add `band-assisted-pull-up` or `pull-up` as the first back exercise ⚠️ REVISAR: need an equipment detail question |
| Strength goal, intermediate/advanced | 4d/5d lower day A1 stays `back-squat`; 6d may swap `hack-squat-machine` → `back-squat` |

## 3. Progression (all goals)

Same model as Block 6: **double progression** with fixed load steps.

- Each exercise has a target rep number. When **all sets** hit it at the week's target effort,
  add the smallest step next session (~1–2.5 kg upper body, 2.5–5 kg legs, one pin on machines).
  If the last sets fall 1–2 reps short, keep the load and beat it next week.
- **Effort ramp:** week 1 RIR 3, week 2 RIR 2, weeks 3–4 RIR 1–2, week 5 RIR 1 (beginners: RIR 3/3/2/2/2).
- **Week 6 deload:** same exercises and loads, half the sets (round up), RIR 3+. The evidence
  brief (§7) says a deload can be fatigue-driven; for the general public I recommend making it
  **automatic** for simplicity and safety. ⚠️ REVISAR.
- **Goal specifics:**
  - `muscle` / `general`: as above.
  - `strength`: main lifts progress by load first (reps fixed at 5 or 6–8); add load as soon as
    all sets hit target at RIR ≥ 1. Accessories use double progression.
  - `fat_loss`: aim to **keep** loads; adding reps or load is a bonus. If strength drops for 2
    sessions in a row, the app tip says to check sleep and calorie deficit size, not to push harder.
  - `home` (limited dumbbells): when the heaviest dumbbell is too light, progress reps (+2–5),
    then a 3-second lowering, then a single-leg/single-arm variation.
- **Next block:** the same template repeats with exercise rotations (e.g. bench angle 0 → 30,
  hack squat ↔ leg press). ⚠️ REVISAR: rotation rules are a follow-up draft.

## 4. Why these choices (evidence)

- Volume, frequency, near-failure training, stretch bias, rest and double progression:
  [Hypertrophy evidence brief](../../../ux/proposals/2026-10-05-hypertrophy-evidence-brief.md)
  (§1–§8, incl. Refalo 2023, Robinson 2024, Coleman 2024, Bell 2023).
- Training each muscle ≥ 2×/week; split matters less than weekly volume: Schoenfeld, Ogborn &
  Krieger 2016, *Sports Med* 46:1689; Schoenfeld, Grgic & Krieger 2019, *J Sports Sci* 37:1286.
- Strength: heavier loads (≈ 1–6 reps) give more maximal-strength gain than light loads at equal
  effort; longer rests help strength: Schoenfeld et al. 2017, *J Strength Cond Res* 31:3508;
  Schoenfeld et al. 2016, *J Strength Cond Res* 30:1805; ACSM Position Stand on progression
  models in resistance training (2009), *Med Sci Sports Exerc* 41:687.
- Fat loss: a calorie deficit drives fat loss; resistance training during a deficit preserves
  lean mass; high protein (~1.6–2.2 g/kg) supports this: Helms, Aragon & Fitschen 2014,
  *JISSN* 11:20; Murphy & Koehler 2022, *Scand J Med Sci Sports* 32:125 (energy deficit blunts
  lean-mass gain); Morton et al. 2018, *Br J Sports Med* 52:376 (protein). Nutrition numbers
  are general information, not individual advice.
- Beginners: lower volumes are enough early on and RIR estimates are less accurate in novices,
  so a larger buffer (RIR 3) is safer: Halperin et al. 2022, *Sports Med* 52:377.

## 5. Open questions for Sebas

1. Cap beginners at 4 days/week, or allow 5–6 with a warning?
2. Home users wanting 5–6 days: cap at 4, or add a conditioning/core day?
3. Week 6 deload automatic for everyone (my recommendation) or fatigue-based?
4. Add questionnaire items: priority muscles (advanced), pull-up bar/bands at home, injuries
   to avoid (we would only swap exercises and say "see a professional", never prescribe rehab)?
5. The `-db` templates have no hamstring curl (needs a machine); hamstrings get Romanian deadlifts and single-leg RDLs instead. ⚠️ REVISAR: OK, or add `nordic-hamstring-curl` for advanced users with an anchor point?
6. Tech Lead: templates need 3–6 days with new day keys; spec currently requires exactly 6.

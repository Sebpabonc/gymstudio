# Plain strength wording: replacing "Est. max" / "e1RM" with words any lifter understands

- **Date:** 2026-10-18
- **Author:** UXer
- **Status:** Proposal only. Nothing changes until the PO approves. Then the Tech Lead writes the issue(s).
- **Prototype:** `docs/ux/proposals/2026-10-18-plain-strength-wording.html` (375 px, Before / A / B / C, EN/ES, six
  real A/B scenarios, clickable "How we compare" sheet)
- **PO request (paraphrased):** "The Est. max / e1RM topic is not clear. People get confused. I have experience
  and I don't understand it either. Change it to something anyone can understand."
- **Approved basis (unchanged):** `docs/fitness/approved/2026-10-18-ab-days-and-progression.md` X1–X7, C1–C6 (Epley,
  best working set with 12 reps or fewer, drops ignored, ±3% "about the same" band, 28-day window, deload only
  vs deload). Also `2026-10-10-progress-trends.md`, `2026-10-10-progress-interpretation.md`.

> **PT gate.** The recommended option (A) changes **wording and which numbers are shown**. It keeps the approved
> maths exactly: the same best set, the same Epley value behind the scenes, the same ±3% band. Even so, the PT
> should do a short wording review, because the copy makes fitness claims ("stronger", "lighter on purpose").
> **Any change to what is compared, how the best set is picked, the band, or any new derived number (option C's
> "like X kg × N") needs a full PT review with test cases before it is built.**

---

## 1. Problem: evidence from the app

### 1.1 One idea, five names
The same Epley number appears under five different labels, in two languages:

| Where | EN today | ES today | Source |
|---|---|---|---|
| Workout mode insight + Completed screen | "Est. max vs last time (…): 85.5 → 88.7 kg (+4%)" | "Máx. est. vs la última vez …" | `src/i18n/sections/workout.ts:186-191`, `:582-587`; rendered `src/components/WorkoutPlan.tsx:3826`, `:4579`, `:4956` |
| Progress, main-lift rows | "Est. max: 85.5 → 88.7 kg" | "Máx. est.: …" | `progressV3.ts:26`, `:166`; `ProgressScreen.tsx:779` |
| Progress, weekly best | "This week's best Est. max: 88.5 kg" | "Mejor Máx. est. de esta semana …" | `progressV3.ts:20-25`; `ProgressScreen.tsx:423-446` |
| Trends KPI, chart note, detail takeaway | "Main-lift e1RM", "e1RM uses your best working set…", "… kg e1RM (first 2 vs last 2 sessions)" | "e1RM principal" | `progressV3.ts:70`, `:75`, `:112` |
| Older strength chart | "Estimated 1RM per session" | | `progress.ts:56` |
| PR badges, toast, tooltip | "e1RM PR", "New e1RM PR", "Estimated one-rep max: …" | "PR de 1RM", "1RM estimado" | `workout.ts:310`, `:391`; `progress.ts:89`, `:92` |

QAer flagged the ES inconsistency on 2026-10-05 (`docs/qa/reports/2026-10-05-qaer-spanish.md:71-72`). It is still there.

### 1.2 The number is a weight you never lifted
In the live demo at 375 px (`?demo=1`, Progress → Overview, 2026-10-18) the Bench Press row says:

```
Barbell Bench Press
Not enough data yet
Est. max: 85.5 → 88.7 kg
This week so far — best Est. max: 88.5 kg
Worth a look: No new best in 4 sessions (best on Jun 11).
```

The best set behind that 88.7 is **70 kg × 8**. The lifter sees a weight they never put on the bar. The row
also says "Not enough data yet" and "No new best" right next to a number that went up. Three messages
disagree, and the one with a number is the hardest to read. The section below on the same screen already
speaks plainly ("Last time: all sets reached 8 reps at 70 kg"). That proves the plain form fits.

### 1.3 The explanation is missing where it is needed
- The approved info tooltip for "Est. max" (spec, after C6: "An estimate of the most you could lift once…") is
  **not shown anywhere**. There is no tooltip key for `estMax` in `src/i18n/`. The only explanation is the `e1rm` PR
  tooltip, and that is a different label.
- "Main-lift e1RM +6.6%" on Trends has no explanation at all.
- The Block-over-block table on Trends mixes units without a label. "Barbell Bench Press 87.1 kg" (an Epley value)
  sits next to "Cable Face Pull 20 kg" (a real load). They look the same.

### 1.4 The A/B days make it worse
When rep ranges differ, the honest comparison needs the converted number. But "33.5 kg" shown as "Est. max" doesn't
tell the lifter *why* 25 kg × 10 counts as more than 22.5 kg × 12. The C3 line ("… 42.0 → 39.0 kg. B days use lighter
loads by design — see B vs last B above.") makes a drop look like a fact before it says it is fine.

### 1.5 Guideline audit (Vercel Web Interface Guidelines)
- **Source:** `.claude/skills/web-design-guidelines/command.md`, upstream commit
  `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`. I checked its SHA-256 locally on 2026-10-18:
  `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`. It matches
  `docs/governance/skill-checksums.json`. I used it as reference only.
- Findings in terse format:
  - `src/screens/ProgressScreen.tsx:209` - chart `aria-label` is the jargon caption ("e1RM uses…"), not a data summary. A screen reader user gets no trend.
  - `src/screens/ProgressScreen.tsx:312` - detail chart `aria-label` is only the exercise name. It should say what the line shows and the direction.
  - `src/screens/ProgressScreen.tsx:995` - `title=` tooltip is the only value readout on week columns. It is hover-only and does nothing on touch.
  - `src/i18n/sections/progressV3.ts:26`, `:70`, `:75` - abbreviation-only labels ("Est. max", "e1RM"). Content & Copy asks for specific, plain labels.
  - `src/i18n/sections/progress.ts:89` vs `progressV3.ts:26` - the same concept has different names (consistency).
  - Positive: numbers already go through `Intl` (`formatNumber`) and lift rows are real `<button>`s with labels (`ProgressScreen.tsx:790`).

---

## 2. What mainstream apps do (research)

| Product | How it shows "strength" to non-experts | Lesson |
|---|---|---|
| **Hevy** | The exercise screen leads with *real* numbers: heaviest weight, best set, and "Set Records" (best weight for each rep count). The 1RM is labelled "true or projected" and sits as one stat among others. [Hevy exercise performance](https://www.hevyapp.com/features/exercise-performance/), [Hevy help](https://help.hevyapp.com/hc/en-us/articles/35382889578135) | Lead with sets people recognise. Keep the estimate secondary. |
| **Fitbod** | Renamed "Projected 1-Rep Max" to **"Estimated Strength"**, with the same maths. It also has separate "Strength Score" metrics per muscle and overall. [Fitbod: Estimated Strength](https://fitbod.me/blog/estimated-strength/), [Fitbod help](https://help.fitbod.me/hc/en-us/articles/12732749777047), [Fitbod scores](https://fitbod.me/blog/how-fitbod-tracks-your-strength-progress-with-real-time-metrics-and-scores/) | A big app found "1-rep max" wording confusing enough to rename it. "Strength Score" as a name is already taken there for a *different*, multi-lift concept, so it is a risk for us. |
| **StrongLifts** | Explains its e1RM in a help article, assumes an effort level, and limits it to 1–12 reps. [StrongLifts e1RM](https://support.stronglifts.com/article/139-understanding-your-estimated-1-rep-max-e1rm) | Even apps for experienced lifters need a help article to explain it. It doesn't explain itself. |
| **Apple Fitness / Activity (pattern)** | Trends say "up / steady / down" in words with an arrow. The raw metric is one tap away. | Verdict word first, numbers second. |
| **NN/g research** | Plain language helps experts too: even highly educated specialists prefer short, scannable text. When a technical term is needed, lead with plain words and put the term second. [NN/g: Plain language for experts](https://nngroup.com/articles/plain-language-experts), [NN/g UX writing FAQ](https://www.nngroup.com/articles/ux-writing-faqs/) | The PO's reaction ("I have experience and I don't understand it") matches this finding exactly. |

The Strong app has no public documentation on this, so I did not cite it.

---

## 3. Three options

All three keep the approved maths (Epley on the best working set ≤ 12 reps, ±3% band, X1–X7 rules). They differ
in **what the person reads** and **which number is on screen**.

Worked examples used below (from the spec's CD cases):

| # | Exercise | Today | Last time | Epley today → last | Verdict (approved rules) |
|---|---|---|---|---|---|
| S1 | Bench press, A vs A | 72.5 kg × 8 | 70 kg × 8 (Mon 5 Oct) | 91.8 vs 88.7, +3.6% | Up |
| S2 | Smith press, A vs B (CD2) | 25 kg × 10 | 22.5 kg × 12 (Fri 9 Oct) | 33.3 vs 31.5, +5.8% | Up |
| S3 | Incline DB, A vs B (CD1) | 30 kg × 10 | 28 kg × 12 (Thu 8 Oct) | 40.0 vs 39.2, +2.0% | About the same |
| S4 | DB bench, B vs A (CD4) | 28 kg × 12 | 35 kg × 6 (Mon 12 Oct) | 39.2 vs 42.0, −6.7% | Lower, different day type (X5 → neutral) |
| S5 | DB bench, A vs A (CD5) | 30 kg × 10 | 35 kg × 6 | 40.0 vs 42.0, −4.8% | Lower, same day type |
| S6 | Lateral raise (CD8) | 15 reps | 20 reps | all sets > 12 | No estimate (C5) |

### Option A - "Show the sets" (recommended)
Say it in lifter terms: a verdict word plus the two **real best sets**. The Epley number decides the verdict behind
the scenes and is never shown as "kg". A % appears only when the reps differ, so it explains *why* fewer reps can
still count as stronger.

**Number shown:** real sets (`kg × reps`). A % only when the reps differ between the two sets. Progress KPIs keep a %.

**A vs B handling:** if the reps differ, add "(+6% after adjusting for reps)" for Up/Lower, or a fact like "(more
weight, fewer reps)" for About the same. If the day types differ and today is lower, say "Lighter on purpose". Never
call it a drop (X5). If all sets have more than 12 reps (C5), say in plain words that A and B use different reps.

| Place / key | EN (final) | ES (draft, PO to approve) |
|---|---|---|
| C1 Up, same reps (`workout.insight.estMax.up`) | Stronger than last time ({day}, {date}): {now} vs {before} | Más fuerte que la última vez ({day}, {date}): {now} vs {before} |
| C1 Up, reps differ | Stronger than last time ({day}, {date}): {now} vs {before} (+{p}% after adjusting for reps) | Más fuerte que la última vez ({day}, {date}): {now} vs {before} (+{p}% teniendo en cuenta las reps) |
| C2 Same (`…same`) | Same strength as last time ({day}, {date}): {now} vs {before} | Misma fuerza que la última vez ({day}, {date}): {now} vs {before} |
| C2 Same, reps differ | … {now} vs {before} (more weight, fewer reps) / (less weight, more reps) | … (más peso, menos reps) / (menos peso, más reps) |
| C3 Lower, different day type (`…crossDayLower`) | Lighter on purpose: {type} days use less weight and more reps. Last time ({day}, {date}): {before}; today {now}. Compare with last {type} above. | Más ligero a propósito: los días {type} usan menos peso y más reps. Última vez ({day}, {date}): {before}; hoy {now}. Compara con el último {type} arriba. |
| C4 Lower, same day type (`…lower`) | Below last time ({day}, {date}): {now} vs {before} (−{p}%) | Por debajo de la última vez ({day}, {date}): {now} vs {before} (−{p}%) |
| C5 (`…differentRepRange`) | A and B days use different reps, so this is compared with your last {type} day. | Los días A y B usan reps distintas, así que se compara con tu último día {type}. |
| X6 effort (`…effort`) | (reps left in the tank: {now} today vs {before}) | (reps en reserva: {now} hoy vs {before}) |
| New link after the line | How we compare | ¿Cómo comparamos? |
| New sheet (the approved tooltip, reworded) | **How we compare sets.** We take your best set of 12 reps or fewer. If the reps are different, a standard lifting formula (Epley) puts both sets on the same scale, so 25 kg × 10 and 22.5 kg × 12 can be compared fairly. Within 3% counts as the same strength. It's only a comparison, not a target: you never need to test a 1-rep max. | **Cómo comparamos las series.** Tomamos tu mejor serie de 12 reps o menos. Si las reps son distintas, una fórmula estándar (Epley) pone las dos series en la misma escala, así 25 kg × 10 y 22,5 kg × 12 se comparan de forma justa. Una diferencia de menos del 3% cuenta como la misma fuerza. Es solo una comparación, no un objetivo: nunca necesitas probar tu máximo a 1 rep. |
| Completed screen | Same strings as Workout mode (same keys) | idem |
| Progress row (`progress.v3.evidence.estMax`) | Best set: {first} → {last} | Mejor serie: {first} → {last} |
| Weekly best, complete (`…weeklyBest.complete` + up/same/lower) | Best set this week: {best}, stronger than last week ({previous}) / same strength as last week ({previous}) / below last week ({previous}) | Mejor serie de la semana: {best}, más fuerte que la semana pasada ({previous}) / misma fuerza que la semana pasada ({previous}) / por debajo de la semana pasada ({previous}) |
| Weekly best, first week | Best set this week: {best} | Mejor serie de la semana: {best} |
| Weekly best, so far | This week so far, best set: {best} | Esta semana hasta ahora, mejor serie: {best} |
| Trends KPI (`progress.v3.trends.mainLift`) | Main-lift strength | Fuerza en ejercicios principales |
| Chart caption (`…e1rmNote`) | Each dot is your best set, adjusted for reps so A and B days share one line. Higher = stronger. Verdicts still compare the same day type. | Cada punto es tu mejor serie, ajustada por reps para que los días A y B compartan una línea. Más alto = más fuerte. Los veredictos comparan el mismo tipo de día. |
| Chart point readout (new, on tap) | {date}: {set} | {date}: {set} |
| Detail takeaway (`…detail.takeaway`) | {exercise}: {verdict}, about {p}% stronger (first 2 vs last 2 sessions). | {exercise}: {verdict}, cerca de {p}% más fuerte (primeras 2 vs últimas 2 sesiones). |
| Old chart title (`progress.strength.chart.title`) | Strength per session ({exercise}, {scope}) | Fuerza por sesión ({exercise}, {scope}) |
| PR badge (`workout.pr.e1rm`, `progress.records.badge.e1rm`) | Strongest set | Serie más fuerte |
| PR toast (`workout.toast.pr.e1rm`) | Your strongest set yet | Tu serie más fuerte hasta ahora |
| PR tooltip (`progress.records.tooltip.e1rm`) | Your strongest set once reps are taken into account. For example, 80 kg × 5 beats 85 kg × 2. | Tu serie más fuerte teniendo en cuenta las reps. Por ejemplo, 80 kg × 5 supera a 85 kg × 2. |
| Block-over-block table | Column values as best sets ("70 × 8"), header "Best set" | Encabezado "Mejor serie" |
| Chart `aria-label` | {exercise}: strength trend, {verdict}, best set {first} → {last} | {exercise}: tendencia de fuerza, {verdict}, mejor serie {first} → {last} |

Rendered examples (EN):
- S1: "Stronger than last time (Chest & Back A, Mon 5 Oct): 72.5 kg × 8 vs 70 kg × 8"
- S2: "Stronger than last time (Shoulders & Arms B, Fri 9 Oct): 25 kg × 10 vs 22.5 kg × 12 (+6% after adjusting for reps)"
- S3: "Same strength as last time (Chest & Back B, Thu 8 Oct): 30 kg × 10 vs 28 kg × 12 (more weight, fewer reps)"
- S4: "Lighter on purpose: B days use less weight and more reps. Last time (Chest & Back A, Mon 12 Oct): 35 kg × 6; today 28 kg × 12. Compare with last B above."
- S5: "Below last time (Chest & Back A, Mon 12 Oct): 30 kg × 10 vs 35 kg × 6 (−5%)"

Pros: there's nothing new to learn. The words are what lifters already say. It matches the "Last time: all sets
reached 8 reps at 70 kg" copy that already works. Cons: the line is a bit longer when reps differ. Progress needs the
best *set* passed through, not just the value (Tech Lead plumbing, no maths change).

### Option B - "Strength score"
Keep the number but give it a friendly name, drop the "kg" (it is not a weight you lift), and add a one-line explanation.

**Number shown:** Epley value, no unit, rounded to 0.5. **A vs B:** same as today, renamed.

| Place | EN | ES (draft) |
|---|---|---|
| C1 / C4 | Strength score vs last time ({day}, {date}): {before} → {now} (+{p}%) | Puntuación de fuerza vs la última vez ({day}, {date}): {before} → {now} (+{p}%) |
| C2 | Strength score vs last time ({day}, {date}): {now}, about the same | … {now}, más o menos igual |
| C3 | Strength score vs last time ({day}, {date}): {before} → {now}. {type} days use lighter weights on purpose; compare with last {type} above. | … Los días {type} usan menos peso a propósito; compara con el último {type} arriba. |
| C5 | A and B days use different reps, so this is compared with your last {type} day. | Los días A y B usan reps distintas, así que se compara con tu último día {type}. |
| Explanation (ⓘ) | Strength score turns your best set into one number, so sets with different reps can be compared. Higher = stronger. | La puntuación de fuerza convierte tu mejor serie en un número, para comparar series con reps distintas. Más alto = más fuerte. |
| Progress row | Strength score: {first} → {last} | Puntuación de fuerza: {first} → {last} |
| Weekly best | This week's best strength score: {best} (last week {previous}{change}) | Mejor puntuación de fuerza de la semana: {best} (semana pasada {previous}{change}) |
| Trends KPI | Main-lift strength score | Puntuación de fuerza (principales) |
| PR badge / toast | Strength score PR / New strength score PR | PR de fuerza / Nuevo PR de fuerza |

Pros: smallest change (strings only, effort S). One name everywhere. Cons: it is still an abstract number ("92.0 of
what?"). It needs the ⓘ to make sense. Fitbod already uses "Strength Score" for a different multi-lift score, so people
coming from Fitbod may mix them up. It doesn't fix the "I never lifted 88.7" feeling for anyone who reads it as kg.

### Option C - "Equivalent" ("like lifting X kg × N")
Turn today's best set into a weight at **last time's rep count**, so both sides use the same reps:
`weight = Epley(today) / (1 + reps_last / 30)`, rounded to the equipment step.

| Place | EN | ES (draft) |
|---|---|---|
| C1 (reps differ) | Stronger than last time ({day}, {date}): today's {now} is like {equiv} kg × {repsLast}. Last time: {before}. | Más fuerte que la última vez ({day}, {date}): tu {now} de hoy equivale a {equiv} kg × {repsLast}. Última vez: {before}. |
| C1 (same reps) | Same as option A | idem |
| C2 | Same strength as last time: today's {now} is like {equiv} kg × {repsLast}. Last time: {before}. | Misma fuerza que la última vez: tu {now} de hoy equivale a {equiv} kg × {repsLast}. Última vez: {before}. |
| C3 | Lighter on purpose: today's {now} is like {equiv} kg × {repsLast} on an {prevType} day. Last time: {before}. Compare with last {type} above. | Más ligero a propósito: tu {now} de hoy equivale a {equiv} kg × {repsLast} en un día {prevType}. … |
| Progress, weekly, PR | As option A | As option A |

S2 rendered: "today's 25 kg × 10 is like 24 kg × 12. Last time: 22.5 kg × 12."

Pros: the clearest picture when reps differ. Cons: it is a **new derived number** with its own rounding. 24 kg may not
exist on the rack (dumbbells go in 2 kg steps), and people may read it as advice ("do 24 × 12"). That brushes against
the AI Trainer invariant "never a non-existent weight". **Needs a PT spec and test cases.** The "like lifting X once"
wording was rejected because it is the 1RM again.

---

## 4. Recommendation

**Option A ("Show the sets") everywhere, with one name for the idea: "strength" / "fuerza".**

- It removes the number people don't understand, without losing the honest A/B comparison. The approved Epley maths
  still decides "Stronger / Same strength / Below / Lighter on purpose".
- It matches how lifters talk and the copy that already works in the app ("all sets reached 8 reps at 70 kg").
- It also fixes the five-names problem: every surface says "best set", "strength", "strongest set".
- Keep the estimated number one tap away in the "How we compare" sheet only if the PO wants it for advanced users
  (decision 3 below). Default: don't show it.
- Option C's equivalent can come later as an optional extra line for the reps-differ case, only after a PT spec.

### Impact / effort

| Item | Impact | Effort | Dependency |
|---|---|---|---|
| A1. Workout mode + Completed lines (C1–C6, X6) in set terms | High | S–M | Tech Lead: expose `bestSet` (current + previous) on `AnyDayEstMaxComparison` (`src/progress/estMax.ts`). It is already computed in `estimateSession`, so no maths change. PT wording review. |
| A2. "How we compare" sheet (approved tooltip, reworded) | High | S | PT wording review; i18n both dictionaries |
| A3. One name across PR badge, toast, tooltip, chart titles | Medium | S | Strings only |
| A4. Progress row + weekly best in set terms | High | M | Tech Lead: pass the best set through `weeklyBestEstMax` and trend evidence points (`trends.ts` keeps `topLoad`, which is **not** always the Epley best set) |
| A5. Trends KPI, chart caption, tap-to-read point, `aria-label` | Medium | M | Chart readout on touch (replaces hover-only `title`) |
| A6. Block-over-block table shows best sets, labelled | Medium | S–M | Same plumbing as A4 |
| B. Rename to "Strength score" | Medium | S | Strings only |
| C. Equivalent "like X kg × N" | Medium–High (A/B only) | M + PT | New PT spec: rounding, equipment step, never read as advice |

**Quick wins:** A2, A3 (and A1's C5/X6 lines, which are strings only). **Bigger:** A1, A4–A6 (small data plumbing + tests).

## 4b. Open question for the Tech Lead / PT (found while reading the code)
`formatEstMaxInsightLine` passes the **previous** session's day type into C5
(`src/components/WorkoutPlan.tsx:482`, `type: comparison.previousDayType`). So on a B day after an A day it says
"compared with last A", but the same-day verdict above it compares with the last **B**. The spec's CD8 example is
ambiguous. The proposed C5 wording uses **today's** day type. Please confirm which one is intended.

Note on the prototype: the weekly-best line (X7) takes the highest of A and B in the week. In S4 the A-day set
(35 kg × 6) is therefore still the week's best, so the line never says "below" because of a planned B day.

## 5. Risks
- **Longer lines in Workout mode.** Mitigation: the verdict word comes first and the reps-differ note goes in brackets. The
  prototype fits two lines at 375 px in EN and ES.
- **"Stronger" with fewer reps can feel wrong.** Mitigation: the "(+6% after adjusting for reps)" note plus the "How we compare" sheet.
- **Fitness claims in copy.** "Lighter on purpose" and "stronger" are fitness statements. The PT reviews the wording. No
  "weaker", "went backwards" or "too easy" (the spec's not-allowed list still applies).
- **ES drafts** need PO approval, plus PT for anything that describes training.

## 6. How to measure success
- **5-second test** (PO + 4 people who don't lift much, Before vs After prototype): "Did you get stronger? By how much?
  What did you lift?" Target: at least 4 of 5 answer correctly on After, compared with the baseline on Before.
- **PO acceptance:** Sebas reads S1–S6 on his phone and can explain each line in his own words.
- **After release (if analytics exist):** "How we compare" open rate (a high rate at first is fine, it should fall over
  time). Fewer feedback messages that mention "max" / "1RM".

## 7. Decisions for the PO
1. **Pick the option:** A "Show the sets" (recommended), B "Strength score", or C "Equivalent" (needs a PT spec).
2. **One word for the idea:** "strength / fuerza" (recommended) everywhere, including PR badges ("Strongest set").
3. **Keep the estimated 1-rep max visible anywhere?** Recommended: no on main screens. Optional: one line inside the
   "How we compare" sheet for advanced users.
4. **Approve the ES drafts** in section 3 (PT reviews the training phrases).

## 8. Next steps (after approval)
PT wording review (short), then the Tech Lead writes an issue with the key list from section 3 and the plumbing notes
from section 4. Copilot implements. QAer checks S1–S6 at 375 px in EN/ES. No change to Epley, ≤ 12 reps, ±3%, or X1–X7.

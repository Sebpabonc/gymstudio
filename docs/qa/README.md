# QA — QAer checklist and report format

QAer is the QA agent (`.claude/agents/qaer.md`). The Product Owner triggers it by saying
**"QAer"**; the Tech Lead runs it, reviews the report, and turns findings into fixes
(Issue → Copilot → PR → review). Reports live in `docs/qa/reports/`.

## Checklist

### 1. Health
- [ ] `npm test`, `python3 scripts/validate-catalogue.py`, `python3 scripts/validate-blocks.py`,
      `npm run build` all pass on `main`; latest CI and Pages deploy are green.
- [ ] Live app loads with no console errors (normal and `?demo=1`).

### 2. Track it as you go
- [ ] Search (by name, muscle, equipment) and every body-region chip filter correctly.
- [ ] Exercise card: primary/secondary muscles, squeeze cue, posture tips collapsed by default
      and 5 tips when expanded.
- [ ] Logging (demo mode): only filled sets are saved; empty → "Enter at least one set";
      date is the local date; history and "last max" update.

### 3. Planned before you go
- [ ] Block card collapsed by default; +/− opens dates, method, summary, About this block
      (6 sections), Change block; the current block is correct for today.
- [ ] All 9 blocks selectable; choice persists after reload.
- [ ] Day tabs 1–6 with short focus labels; exercise chips = technique · angle · primary muscle;
      angles read "Flat bench" / "Incline N°" / "Decline N°"; supersets grouped; drop sets show
      Main/Drop inputs.
- [ ] Logging from the plan (demo mode) saves blockId/dayKey and marks the exercise done when
      that feature exists.

### 4. Progress (demo mode)
- [ ] Suggestions, Consistency, Strength trend (A/B/All toggle, block bands, takeaway),
      Personal records, Weekly sets by muscle, Block report card all show sensible content.
- [ ] Numbers are plausible (no NaN, no 0% headlines with positive lifts, no empty sections
      when history exists).

### 5. Account
- [ ] Sign in screen renders (email/password, Forgot password, Continue with Google); account
      button hidden in demo mode. (Never sign in or create accounts.)

### 6. Design alignment and consistency
- [ ] Every collapsible uses the same round +/− control; no chevrons.
- [ ] Chips, cards, buttons, typography and spacing consistent across Track, Planned, Progress,
      Account; labels short (no wrapped long tags); English only, no Spanish text.
- [ ] No horizontal overflow and nothing cut off at 375 px / 768 px / desktop; tap targets ≥ 40 px.
- [ ] Accessibility basics: buttons have names, toggles expose `aria-expanded`, text contrast readable.

### 7. Data and content
- [ ] Supabase catalogue count = approved JSON count; every exercise has 5 tips + squeeze cue.
- [ ] Every bench/seat exercise in the blocks shows an angle; no notes duplicating chips.

## Report template

```markdown
# QAer report — YYYY-MM-DD
Build: <main commit sha> · Live: https://sebpabonc.github.io/gymstudio/ · Viewports: 375 / 768 / desktop

## Summary
| Area | Result | Notes |
|---|---|---|
| Health | ✅ / ⚠️ / ❌ | |
| Track | | |
| Planned | | |
| Progress | | |
| Account | | |
| Design consistency | | |
| Data & content | | |

P1: n · P2: n · P3: n

## Findings
### [P2] <title> — #<issue>
- Where: <screen, viewport>
- Steps: 1. … 2. …
- Expected: …
- Actual: …

## Passed checks
- …
```

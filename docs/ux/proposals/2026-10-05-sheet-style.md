# Sheet containers instead of boxes inside boxes (2026-10-05)

**Author:** UXer · **Status:** Proposal, waiting for PO approval ·
**Prototype:** [`2026-10-05-sheet-style-prototype.html`](./2026-10-05-sheet-style-prototype.html)
(open it in a browser; use the **Now (boxes) / Proposed (sheet)** toggle above the phone)

> Proposal only. Nothing here is committed work until Sebas approves it.

## 1. PO request and scope

> "Make a proposal of the main screens using this design instead of boxes inside boxes."
> Scope clarification: "the style is ONLY the container topic, nothing else."

From the reference we take **one idea only**: a single large surface ("sheet") with a big top
radius. Content sits directly on it as rows, hairline dividers and white space, and the sheet
slightly overlaps the header above it.

**Not changing** (kept exactly as today): dark theme and all colour tokens, Inter and the current type
sizes (PO decision of 4 Oct), the collapsing GYM STUDIO header (Option 2), the floating icon dock
(Option 3), chips, buttons, the set table columns, the superset "Log rounds" panel, Ask AI and the rest
timer. No light theme, no new hero, no "Back / Step x of y" header, no new fonts.

This builds on the approved [`mobile-breathing-room`](../approved/2026-10-04-mobile-breathing-room.md)
decision #2 ("only one level of boxes") and takes it one step further: **zero** boxes for structure,
one sheet for the whole screen.

## 2. Problem (live demo, 5 Oct, 390 × 844, `?demo=1`)

- **Today still stacks boxes.** Block card → day panel → superset group → exercise card → set log panel.
  Every box adds a 1 px `--line` border (14% white) and 10–14 px of padding on both sides.
- **An open exercise is a box with boxes inside:** set log, Posture tips, Progress and "Sign in to ask AI"
  are each their own bordered panel.
- **Progress is six separate cards** (headline, Suggestions, Consistency, Strength trend, Personal records,
  Weekly sets, Block report card), each with its own border and 12 px gap.
- Many thin borders in a small space read as clutter, and the nesting eats width that the set table needs.

## 3. Proposal

### 3.1 The container rules

1. Below the header there is **one sheet** per screen. It is the only container.
2. Sections on the sheet are separated by a **1 px hairline**, not by borders around them.
3. Exercises are **rows** separated by hairlines, at full sheet width, with 16 px gutters.
4. **Controls keep their own outline** (inputs, steppers, ticks, +/− buttons, chips, day tabs,
   "Change block", "Log exercise"). They are things you tap, not containers.
5. Two states need to stand out without a box:
   - **Superset**: a 3 px mauve side rail (`--nav-active`) plus a very faint mauve tint.
   - **Open exercise**: a faint full-width band (3% white) behind the open row.

### 3.2 Design tokens

| Token | Value | Notes |
|---|---|---|
| `--sheet-bg` | `var(--bg-soft)` `#2b2b2d` | Existing token. Sits on `--bg-dark` `#1f1f20`, so the sheet edge is visible without a border |
| `--sheet-radius` | `44px` (top corners only) | Reference uses about 48 px; 44 px matches the iPhone screen corner |
| Sheet overlap | `margin-top: -22px` | Sheet tucks under the large header; header bottom padding grows from 18 to 40 px to compensate |
| Sheet edge | `box-shadow: 0 -1px 0 rgba(255,255,255,.08), 0 -18px 40px rgba(0,0,0,.25)` | Soft lift, no border |
| Grabber (optional) | 36 × 4 px, `--line` | Decorative; hint of a sheet. Can be dropped |
| `--hairline` | `rgba(255,255,255,.08)` | Same value as the dock border today. Replaces `--line` (14%) between rows |
| `--gutter` | `16px` | Section and row side padding (approved earlier) |
| Section padding | `18px 16px` | Row padding `14px 16px` |
| Superset rail | 3 px, `--nav-active`, radius 2, 8 px from the sheet edge; tint `rgba(141,94,99,.07)` | |
| Open exercise band | `rgba(255,255,255,.03)` | |
| Squeeze cue | tint `rgba(232,184,106,.07)`, radius 12, **no border** | Text unchanged, always fully visible |
| Type scale | **unchanged** | PO decision 3 of 4 Oct; inputs stay ≥ 16 px |

**Contrast on the sheet `#2b2b2d`** (WCAG 2.2): text `#f3f3f1` 12.7:1, muted `#c8c7c4` 8.4:1,
active/rail `#c99ca1` 5.9:1, cue label 7.7:1, "Log exercise" text on its gradient 5.4–12.3:1. The sheet is
slightly lighter than today's background, so every text pair stays at AA or better.

### 3.3 Per screen (see the prototype)

- **Today**
  - Sheet starts under "GYM STUDIO / Today".
  - Section 1: the block (name, start date, Block 6 · PT, Change block, +), no card.
  - Section 2: D1–D6 tabs, then "Day 1 · Chest-Back A", then the exercise rows: A1 (done pill), the
    B1 + B2 superset with its rail and "Log rounds 0/3", C1, D1, then the E1 + E2 superset.
  - Today's nesting goes from up to 6 levels to 1.
- **Open exercise** (D1 Plate-Loaded T-Bar Row)
  - Opens inline as today, on a faint band.
  - Chips, scheme line, squeeze cue (tint only), "Same as set 1", the set table
    (Set · Previous · kg −/+ · Reps · ✓) and "Log exercise" sit on the sheet.
  - Posture tips, Progress and Ask AI / Start rest become **rows with dividers**, not panels.
  - Ticking a set tints the row and starts the rest timer pill, as today.
- **Superset rounds**
  - The "Log rounds" panel keeps its content: Round 1–3, B1 and B2 kg/reps, one ✓ per round.
  - It sits inside the superset rail instead of a nested box.
- **Progress**
  - Weekly headline and D1–D6 dots, then each section (Suggestions with "Ask AI why",
    Consistency, Strength trend chart, Personal records, Weekly sets, Block report card) is a
    divider-separated section with its +/− control.
  - This removes six borders and the 12 px gaps between cards.
- **Exercises**
  - Search, region chips and results are rows on the sheet.
  - An opened exercise shows its cue, last max / volume and tips inline.
- **You** (optional): the demo panel sits on the sheet. Nothing else changes.

### 3.4 Why it should help

- **Less visual noise.** Fewer outlines compete with the content. NN/g's guidance is that cards help when
  you browse mixed content, and that nesting them adds weight without meaning:
  https://www.nngroup.com/articles/cards-component/
- **Platform-native.** A list of rows on one rounded surface is the standard iOS list and sheet pattern:
  https://developer.apple.com/design/human-interface-guidelines/lists-and-tables ·
  https://developer.apple.com/design/human-interface-guidelines/sheets
- **Material agrees.** Material 3 prefers lists over cards for items of the same kind:
  https://m3.material.io/components/lists/guidelines
- **Peer apps do the same.** Hevy and Strong log a workout as one flat list: each exercise is a header,
  followed by a plain set table.
- **More width for the set table.** Each box level costs about 24 px of width, and the set table needs it.

## 4. Effort

| Part | Effort | Notes |
|---|---|---|
| Sheet wrapper + hairline/rail/band tokens in `styles.css` | **S** | One wrapper in `App.tsx` around `.app-content` sections |
| Today: remove card borders/padding from block, day panel, superset group, exercise cards, inner panels | **M** | CSS mostly; some wrappers become rows; regression check of expand/collapse |
| Progress and Exercises: cards → divider sections | **S** | CSS only |
| Overall | **M** | No data, storage, API or content changes. Visual regression check at 375 and 390 px |

**Dependencies:** none on PT, backend or cost. Tech Lead to decide whether the change is done as a
`sheet` layout class or by editing existing card classes. **Risk:** if all borders disappear, some
sections may run together. The faint band, the superset rail and the hairlines are there to prevent this.
Check it on a real phone in gym lighting.

## 5. How to measure success

- The PO compares the two versions in the prototype and approves one.
- After the build:
  - The first exercise row sits higher on screen than today (at 375 × 667 and 390 × 844).
  - The number of bordered elements on Today with D1 open drops by at least 70%.
  - The next QAer pass finds no "where does this section end" issues.

## 6. Decisions for Sebas

1. **Sheet or boxes?** Approve the sheet containers as shown, or keep today's boxes.
2. **Overlap.** Should the sheet tuck under the large GYM STUDIO title (as proposed, 22 px), or start
   just below it with no overlap?
3. **Grabber line** at the top of the sheet: keep it as a decorative "sheet" hint, or drop it (it can look
   draggable when it isn't)? UXer leans to **drop**.
4. **Where it applies.** All four tabs (recommended, so the app looks consistent), or Today only first.
5. **Open exercise highlight.** Is the faint band enough to show which exercise is open, or do you want a
   stronger cue (for example, the mauve rail like supersets)?

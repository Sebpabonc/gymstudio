# Today: block header that steps aside (2026-10-10)

Status: proposal (needs PO approval). Prototype: `2026-10-10-today-block-header.html` (375 px, EN/ES, variants A/B/C × New block / Compact).

## Problem
Above the day tabs, Today stacks four things that repeat the same block info on every visit:
- **Calendar button** (`calendar-icon-button`), which opens the popover with the program (blocks → weeks → days) and history by date.
- **Pill "6-WEEK PLAN"** (`plan-mode-tabs`). It is not a label: it is the Preset/Custom plan-mode switch (the Custom tab sits next to it).
- **Block card** (`training-block-card`) with name, status "Week X of 6", badges (Block N, PT, Pinned) and a **"+"**. The "+" only expands the card. It does *not* create a block. The expanded card shows Change block (opens the chooser sheet), the dates and method, the summary, "About this block" (PT insights), and "Use date-based block" if the block is pinned. The expanded state is kept in sessionStorage `gym-studio.block-card-expanded`.
- **Chip "Full week" / "Plan completo"** (`workout.block.weekType.full`, or Deload in week 6). It marks the week type. It is **not** a link to the full plan, and the Spanish label makes it read like one.

Once Sebas knows the block, this costs about 150 px and three controls before he reaches today's workout.

## Variants (all keep the prod dark/rose tokens, card radius, chips and day tabs)
- **A. Intro card, then one line.** The "New block" card shows the name, Week 1 of 6, the dates, the PT summary, and two buttons: Block details and Got it. In the compact state it becomes one line: `Block 6 · Week 2 of 6 · <name> ›`.
- **B. A plus a week bar (recommended).** Same as A, but the compact line also has a thin 6-segment progress bar (done weeks, then the current week partly filled). It still answers "where am I in the block" at a glance, adds only about 8 px, and gives a gentle sense of progress.
- **C. Merged into the title.** In the compact state there is no line at all. The subtitle under "Today" reads `Block 6 · Week 2/6 ›`, and it and the calendar button open the same sheet. This is the most compact option, but the information is easy to miss and the title area gets crowded.

In every variant, the line, the title (in C) and the calendar button open **one Block sheet**, which holds:
- the name, PT badge and chips (week, dates, Full week/Deload)
- the **Preset/Custom switch**, which moves here so the pill is removed from Today
- "About this block" (summary and insights)
- Calendar & history
- Change block
- Use date-based block (only when the block is pinned)

The day tabs come directly below the line.

## Exact behaviour
The card is shown expanded ("new") when the active preset block has **no logged entries dated on or after its start date** AND the user has not dismissed it. Everywhere else it is compact.
- It collapses for good after one of these: the first set is logged in this block, Got it or × is tapped, or the block's week 1 ends (start date + 7 days), whichever comes first.
- When the user changes block (chooser) or a new date-based block starts, the new block id has no dismissal yet, so the card shows again.
- Upcoming blocks (Starts …) and completed blocks always show compact with their status text.
- Custom mode: the line shows the custom plan's name and opens the same sheet. There is no intro card.
- Storage: one new local flag, the **list of block ids whose intro was dismissed**. It must go through `src/utils/storage.ts` (for example `getDismissedBlockIntros()` and `dismissBlockIntro(blockId)`, key `gym-studio.block-intro-dismissed`), with no direct localStorage call in the component. It is a device-level UI preference, so it does not need to sync to Supabase. The rule "has logs in this block" is derived from history and needs no storage. The sessionStorage `block-card-expanded` key becomes unnecessary (it is debt in `WorkoutPlan.tsx`) and can be removed. This is a Tech Lead call.

## Also fix (copy)
In Spanish, "Plan completo" for the week type should become "Semana completa" (EN "Full week" is fine). It currently reads like a link to the full plan. This goes through the normal i18n review.

## Impact / effort
| Item | Impact | Effort |
|---|---|---|
| B: compact line + sheet, remove pill and repeated card | High (about 120 px saved on every visit, one clear entry point) | M (UI only, one storage helper) |
| ES copy "Semana completa" | Low–Med | S |
| C instead of B | Med (maximum space) | M; risk of hiding information |

Measure: taps from opening Today to the first set logged; how often the Block sheet is opened after week 1 (should be low); no QA findings about "where is change block or custom".

## PO decisions
1. Choose a variant: B (recommended), A, or C.
2. OK to move the Preset/Custom switch into the Block sheet? Switching is rare, so we recommend yes.
3. The intro should disappear after the first logged set or Got it (recommended), or only after the first week.

## Addendum: see upcoming days (PO follow-up, 2026-10-10)
Problem: Today only shows this week's day tabs, so Sebas can't see what he'll train on Monday.

Proposal (added to every variant; B is still the recommended base):
- **Week switcher** right above the day tabs: `‹ Week 2 · Next week ›` with the dates underneath (`Oct 12 – 17`; week 6 also shows "Deload"). It steps from week 1 to week 6 of the active block. The arrows are disabled at the block's edges.
- **Day tabs show the weekday and date** (`Mon 12`), following the block's start date and day order.
- **"Next: Mon 12 · Chest & Back A"** line. The next planned day also gets a rose outline and a "Next" tag, even when it falls in the following week.
- **"Back to this week" chip** whenever another week is showing.
- **Read-only preview** when a future day is tapped: day name, then each exercise with sets × reps and technique, all from the approved block. A note says the target weight is set on the day by the AI Trainer. **No weights are shown or guessed.** At the bottom, a disabled "Logging opens on the day" button.
- **Future-day logging stays disabled. No engine change.** The AI Trainer still computes loads only for the day itself. Past weeks show their done/total, as they do today.
- Storage: none. The selected week is screen state only and resets to this week each time Today opens.
- Exercise names in the prototype are shown in their raw catalogue form. The real build would use the app's localized catalogue names.

## Addendum 2: the day picker (PO follow-up, 2026-10-10)
The header now defaults to the Compact state (B). A new **Days** switch in the prototype shows the current tabs ("Now") and three variants.

### Problems with the current D1–D6 tabs
- "D1…D6" is an internal code. It doesn't say what the day trains or when.
- "7/7" counts exercises, but people read it as sets or as a score. Before you start a day it shows "0/7", which looks like a failure.
- The "Hoy" tag squeezes a fifth line into a 52 px tab. Six tabs barely fit at 375 px, and a seventh day would scroll with no hint.
- There is no weekday or date, no day name, no muscles, and no "next" marker. To answer "what do I train on Monday?" you have to tap through the tabs one by one.

### Variants
All three use the real PT day names and focus from `blocks.json` and `es/blocks.json` (for example "Pecho y Espalda A · Pecho, espalda y abdomen · pesado"). Exercise names in previews now come from the catalogue `name_en` / `name_es`, which fixes the raw-id naming gap.
1. **Chips.** Horizontally scrolling pills: a progress ring (exercises done, or a check when complete) with "Sáb 10 · Hoy" over "Piernas B". The selected or today pill auto-centres. Compact, but only about two days are visible at once, so you still scroll to find Monday.
2. **Week list.** One row per day with weekday and date, day name, focus muscles, and a status badge (✓ Hecho / Hoy / Siguiente / Pendiente). Clearest at a glance, but about 340 px tall, which pushes today's workout below the fold every time.
3. **Today + Next focus (recommended).**
   - A rose-outlined Today card shows the day name, focus and an exercise progress bar.
   - Under it, one "Siguiente · Lun 12 · Pecho y Espalda A" row opens that day's preview directly, which answers the PO's Monday question in one tap.
   - Then comes a 6-cell week strip (weekday plus ✓ or date) and "See the whole week ›". That link expands into the week list from variant 2, with the week switcher and a read-only preview. "Hide week" returns to the default view.
   - The workout cards stay high on the screen.

### Exact behaviour
These rules apply to every variant:
- **Status.** A day is *done* when every exercise is logged for that block date. It is *today* when it is today's planned day. *Next* is the first planned day after today, which may be in the next week. Anything else is *upcoming*. Past days that were not logged show "Missed" (Sin registrar), not 0/7.
- **Progress** counts exercises with at least one logged set out of the day's exercises, worded "2/6 exercises". No percentage is shown.
- **Future days** open only as a read-only preview (sets × reps, technique, the note "target is set on the day"). There are no weights, logging stays disabled, and the AI Trainer engine does not change.
- **Storage.** Nothing new is stored. Selected week, selected day and whether the week is expanded are screen state only, and they reset to Today each time the screen opens. Everything else comes from history and the block. If a later change needs persistence, it goes through `src/utils/storage.ts`.
- **Spanish copy** uses the PT-approved day names (`es/blocks.json`). Status words (Hecho, Hoy, Siguiente, Pendiente, Sin registrar) are new i18n keys in EN and ES.

### Impact and effort
| Variant | Impact | Effort |
|---|---|---|
| 3 Focus + expandable list | High: clearest "today" and "next", answers the Monday question, saves space | M |
| 1 Chips | Medium: names and dates fixed, still needs scrolling | S–M |
| 2 List | Medium–High for planning, but costs space on every visit | S–M |

### PO decisions
1. Choose a day picker: 3 (recommended), 1 or 2.
2. Should past days that were not logged show "Missed", or stay neutral? We recommend neutral grey "Sin registrar".
3. Should progress be counted by exercises (recommended) or by sets?

## Addendum 3: PO picked Days variant 1, Chips (2026-10-10)
This supersedes the recommendation in Addendum 2. Variant 1 is now the default in the prototype, with header Compact B.

Chip spec (every chip identical):
- **Size.** Fixed 112 × 78 px, radius 14, 8 px gap. At 375 px, three chips fit with a peek of the fourth, which hints that the row scrolls. Scroll snap is on.
- **Line 1:** weekday and date, for example "Sáb 10" (14 px bold).
- **Line 2:** the PT day name on one line, cut off with "…" when it doesn't fit (12 px, muted). The full name appears in the accessible label and in the preview.
- **Line 3** (reserved space): a small "Hoy" or "Siguiente" tag. When there is no tag the space stays empty, so chip size never changes.
- **Status corner** (always top-right, 22 px): an empty ring for upcoming or next days, a rose progress ring with "2/6" for today, and a green ✓ for a finished day.
- **Selected:** rose outline only, same size, no fill.
- **On open** the row scrolls so today's chip is in view. On another week, it scrolls to the selected day.

Behaviour, the week switcher, read-only future previews and storage (none new) are unchanged from Addendum 2.

## Addendum 4: "Fit" options (PO, 2026-10-10: text looks squeezed)
The prototype now has a **Fit** switch (Off / 1 / 2 / 3) that applies to both the Compact header and the chips. Every option follows these rules:
- Primary text is at least 15 px and secondary text at least 13 px.
- Nothing inside a chip is cut off.
- Padding is 10 px, and all chips are the same size.
- The status dot sits in the top-right corner: green ✓ for done, rose for today, a rose ring for next, an empty ring for upcoming.
- Selected means a rose outline.
- The full day name is always in the accessible label.

| Fit | Chip | Visible at 375 px | Header |
|---|---|---|---|
| 1 Less text | 84×68: weekday, **date**, short label ("Piernas A") | 3 full, 4th peeking | "Bloque 6 · Sem 1/6" + week bar; name only in the sheet |
| **2 Two-tier (recommended)** | 64×60: weekday + **date** only | 4 full, 5th mostly visible | Title "Bloque 6 · Semana 1 de 6" (15 px) + block name subtitle (13 px, wraps) + week bar |
| 3 Icon-led | 64×76: muscle icon, weekday, **date** | 4 full + peek | Title "Bloque 6" + "Sem 1/6" pill + name subtitle |

In Fit 2 and Fit 3, one **caption row** sits under the chips for the selected day: "Hoy · Sáb 10" (rose) + **day name** (15 px) + muscles (13 px). Tapping a chip updates the caption.

**Recommendation: Fit 2.** It has the most room per word, needs no new labels or icons, and Today/Next is spelled out in the caption instead of being squeezed into chips.
- Fit 1 needs short day labels ("Pecho A", "Brazos A", …). These are new fitness-facing copy and need PT and PO approval.
- Fit 3 needs a real icon set. The emoji in the prototype are placeholders. Icons are ambiguous for "Chest & Back" and would be a design and asset task.

Measured at 375 px, ES and EN: Fit 1 = 84×68, Fit 2 = 64×60, Fit 3 = 64×76. All chips within each fit are equal, the smallest font is 13 px, there is no truncation, today's chip is visible on open, and there is no horizontal page scroll.

## Addendum 5: one-line date in chips (PO, 2026-10-10)
In all three Fit options, a chip now shows the weekday and day number on **one line** at 15 px bold ("Sáb 10" / "Sat 10"). The line sits below the status dot, which stays in the top-right corner, so the two never overlap. Chip sizes at 375 px:
- Fit 2 (recommended): 76×56, 4 chips fully visible.
- Fit 1: 84×76, 3 visible plus a peek, with the short label below.
- Fit 3: 76×64, 4 visible, with the icon on top.

Chips within each fit are all the same size, with nothing cut off, in ES and EN. The caption row uses the long one-line form: "Hoy · Sáb 10 oct" / "Today · Sat Oct 10".

## PO decision (2026-10-10): approved
Header B (compact line + week bar, intro card only for a new block), Days = Chips with Fit 2, one-line chips ("Jue 8 ✓", 92×44, status inline after the date), caption row for the selected day, week switcher with read-only future-day preview, 6-week/custom switch moved into the Block sheet, intro collapses on first logged set or "Got it", unlogged past days neutral ("Sin registrar"), progress counts exercises.

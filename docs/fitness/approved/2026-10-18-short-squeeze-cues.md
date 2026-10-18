---
title: Short squeeze cues for workout mode (EN + ES)
status: approved
author: pt-fitness-expert
created: 2026-10-18
approved_by: Sebas (PO)
approved_on: 2026-10-18
exercises: [incline-dumbbell-press, plate-loaded-t-bar-row-chest-supported, dumbbell-bench-press, cable-lat-pulldown-underhand-grip, high-cable-fly, cable-straight-arms-pull-downs, cable-crunch, smith-machine-shoulder-press, dumbbell-curl-incline, standing-db-lateral-raises, cable-lateral-raise, rope-low-cable-oh-tricep-extensions, ez-bb-preacher-curls, reverse-pec-deck-fly, plate-loaded-pendulum-squat, romanian-deadlift, dumbbell-bulgarian-split-squat, seated-leg-curl-toes-dorsiflexed-neutral, leg-extensions-toes-dorsiflexed-neutral, standing-calf-raises-toes-neutral, smith-machine-bench-press, barbell-bent-over-row, pull-up-wide-grip, dip, dumbbell-chest-supported-row, barbell-overhead-press-seated, dumbbell-lateral-raise-seated, barbell-jm-press, barbell-curl, dumbbell-overhead-triceps-extension, cable-bayesian-curl, back-squat, dumbbell-lunge-reverse, machine-standing-leg-curl, smith-machine-calf-raise, ab-wheel-rollout, incline-barbell-bench-press, dumbbell-bench-press-decline, decline-dumbbell-fly, plate-loaded-lat-pulldown, plate-loaded-low-row, ez-bar-pullover, dumbbell-shoulder-press, db-60-y-raises, cable-rear-delt-fly, machine-preacher-curl, dumbbell-skull-crusher-decline, db-spider-hammer-curls, cable-triceps-kickback, smith-machine-squat, dumbbell-step-up, machine-hip-thrust, prone-leg-curl-toes-dorsiflexed-neutral, hanging-knee-raise, barbell-bench-press, machine-chest-press-incline, dumbbell-fly-incline, dumbbell-fly, barbell-t-bar-row, neutral-grip-lat-pulldown, barbell-overhead-press, ez-bar-overhead-triceps-extension, cable-curl-straight-bar, cable-triceps-pushdown-reverse-grip, dumbbell-rear-delt-fly-chest-supported, barbell-front-squat, smith-machine-hip-thrust, machine-seated-leg-curl-single-leg, leg-press-calf-raises-toes-neutral, decline-sit-up]
---

## Summary
In workout mode the PO wants the squeeze cue visible the moment an exercise opens, as one
sharp phrase. The approved `squeeze_cue` (catalogue v2) is a full sentence (up to 140 chars)
that is too long to read mid-set. This draft proposes a **short squeeze cue** (EN + ES) for
every exercise in the active block and the three upcoming blocks, each condensed from the
approved `squeeze_cue` with no new technique claims, plus a field name and a display rule.

Scope (70 unique exercises):
- `block-2026-10-05-hypertrophy-flat-pyramid-ii` (active) — 20 exercises
- `block-2026-11-16-strength-hypertrophy-ii` — 16 more
- `block-2026-12-28-hypertrophy-pyramid-ii` — 18 more (included so the field is ready before that block starts)
- `block-2027-02-08-hypertrophy-reverse-pyramid-iii` — 16 more (same reason)

Past blocks (02-16, 03-30, 05-11, 07-06, 08-17) are not included; see Open decisions.

## Proposed field and display rule

**Field:** `squeeze_cue_short` (EN) in `docs/fitness/approved/catalogue-v2/*.json`, next to
`squeeze_cue`; the ES text goes in the same key in `docs/fitness/approved/es/catalogue-*.json`,
the way `squeeze_cue` is already translated there. The Tech Lead decides the exact
storage, validation and migration.

**Content rules for `squeeze_cue_short`** (proposed addition to `catalogue-v2-spec.md`):
1. EN: max 7 words. ES: max 8 words (Spanish usually needs one or two more words). No trailing period.
2. Imperative, informal (ES uses "tú": *aprieta*, *lleva*, *junta*).
3. One muscle-focused action: usually *[movement or image], squeeze [target muscle]*.
4. Must come from the approved `squeeze_cue` of the same exercise: same muscle, same
   image or direction. No new technique, no load or range advice, no medical wording.
5. Muscle words use one shared list in both languages (see Glossary below).
6. If `squeeze_cue` changes, `squeeze_cue_short` must be reviewed in the same PR.

**Display rule (workout mode):**
- The short cue is **always visible** right under the exercise name as soon as the exercise
  opens, in the user's language (EN/ES toggle).
- The full `squeeze_cue` plus the 5 posture tips sit behind a **"More"** control ("Más" in ES).
- If an exercise has no `squeeze_cue_short` yet, show nothing in that spot (do not cut down
  the long cue automatically, because a cut sentence can change its meaning).

## Glossary (keep wording consistent)

| EN | ES |
|---|---|
| upper chest / lower chest / chest | pecho superior / pecho bajo (short form of "parte baja del pecho") / pecho |
| lats / lower lats | dorsales / dorsales bajos |
| shoulder blades / mid-back | omóplatos / espalda media |
| front delts / side delt(s) / rear delts | deltoide frontal / deltoide lateral / deltoide posterior |
| biceps / triceps / forearms | bíceps / tríceps / antebrazos |
| quads / glutes / hamstrings / calves | cuádriceps / glúteos / isquiotibiales / pantorrillas |
| abs / lower abs | abdomen / abdomen bajo |

⚠️ REVISAR: the approved long cues avoid "delts" and say "front/side/back of your shoulder"
in plain words. In short cues I used "front/side/rear delts" (EN) and "deltoide
frontal/lateral/posterior" (ES) because they are short and every gym-goer knows them.
Tell me if you want plain words instead (e.g., "lift with the side of your shoulder"); that
would make several cues longer than 7 words.

## Exercises

Word counts: EN ≤ 7, ES ≤ 8 for every row.

### Block 2026-10-05 — Size · Straight Sets, Stretch Focus (active)

| exercise id | current cue (approved `squeeze_cue`) | short EN | short ES |
|---|---|---|---|
| `incline-dumbbell-press` | As you press, squeeze your upper chest to bring your biceps up and in toward your chin, as if closing a book over your face. | Squeeze upper chest, biceps toward chin | Aprieta el pecho superior, bíceps al mentón |
| `plate-loaded-t-bar-row-chest-supported` | Drive your elbows behind your body and squeeze your shoulder blades together hard while your chest stays glued to the pad. | Elbows back, squeeze shoulder blades together | Codos atrás, junta fuerte los omóplatos |
| `dumbbell-bench-press` | Press up and squeeze your chest as if trying to make your biceps touch at the top. | Squeeze chest, make your biceps touch | Aprieta el pecho, junta los bíceps |
| `cable-lat-pulldown-underhand-grip` | Drive your elbows down beside your ribs and squeeze your lower lats hard as the bar touches your chest. | Elbows to ribs, squeeze lower lats | Codos a las costillas, aprieta dorsales bajos |
| `high-cable-fly` | Sweep down and squeeze your lower chest as if pressing your biceps into your ribs and your hands toward your belt buckle. | Hands to belt buckle, squeeze lower chest | Manos a la hebilla, aprieta pecho bajo |
| `cable-straight-arms-pull-downs` | Sweep your hands down to your thighs and squeeze your lats hard, feeling them wrap around your ribs at the bottom. | Hands to thighs, squeeze lats hard | Manos a los muslos, aprieta los dorsales |
| `cable-crunch` | Pull your ribs toward your hips and squeeze your abs hard at the bottom, as if curling into a ball. | Ribs to hips, squeeze abs hard | Costillas a la cadera, aprieta el abdomen |
| `smith-machine-shoulder-press` | Drive the bar up and squeeze the front of your shoulders, as if trying to pull your hands together on the bar. | Pull hands inward, squeeze front delts | Manos hacia adentro, aprieta deltoide frontal |
| `dumbbell-curl-incline` | Curl from the full stretch and squeeze the biceps hard at the top, feeling it bunch up from the elbow. | From the stretch, squeeze biceps at top | Desde el estiramiento, aprieta el bíceps arriba |
| `standing-db-lateral-raises` | Lead with your elbows and feel the side of your shoulder lift the weight, as if reaching your hands out to the walls. | Elbows lead, lift with side delts | Codos primero, sube con el deltoide lateral |
| `cable-lateral-raise` | Lead with your elbow and feel the side of your shoulder lift, as if pushing your hand far out to the wall. | Elbow out to wall, squeeze side delt | Codo hacia la pared, aprieta deltoide lateral |
| `rope-low-cable-oh-tricep-extensions` | Extend fully overhead, pull the rope ends apart, and squeeze the back of your arms all the way up to the armpit. | Pull rope apart overhead, squeeze triceps | Abre la cuerda arriba, aprieta el tríceps |
| `ez-bb-preacher-curls` | Curl your knuckles toward your face and squeeze the biceps hard at the top, as if flexing for a photo. | Knuckles to face, squeeze biceps hard | Nudillos a la cara, aprieta fuerte el bíceps |
| `reverse-pec-deck-fly` | Push the handles back with the backs of your hands and squeeze the rear of your shoulders, as if opening heavy curtains. | Open the curtains, squeeze rear delts | Abre las cortinas, aprieta deltoide posterior |
| `plate-loaded-pendulum-squat` | Feel your quads stretch at the bottom, then squeeze them hard to push the platform away through midfoot. | Stretch deep, squeeze quads to push | Baja profundo, aprieta cuádriceps para empujar |
| `romanian-deadlift` | Feel your hamstrings stretch like rubber bands, then snap your hips forward by squeezing your glutes. | Snap hips forward, squeeze glutes | Cadera al frente, aprieta los glúteos |
| `dumbbell-bulgarian-split-squat` | Feel the stretch in your front glute at the bottom, then squeeze it to stand as if pushing the floor away. | Stretch front glute, squeeze it to stand | Estira el glúteo delantero, apriétalo al subir |
| `seated-leg-curl-toes-dorsiflexed-neutral` | Squeeze your hamstrings to dig your heels under the seat, as if dragging your heels through sand. | Heels under seat, squeeze hamstrings | Talones bajo el asiento, aprieta isquiotibiales |
| `leg-extensions-toes-dorsiflexed-neutral` | Lock out and squeeze your quads hard for a second, as if pulling your kneecaps up toward your hips. | Lock out, squeeze quads one second | Extiende y aprieta cuádriceps un segundo |
| `standing-calf-raises-toes-neutral` | Rise onto your big toes and squeeze your calves hard at the top, as if trying to grow an inch taller. | Rise on big toes, squeeze calves | Sube al dedo gordo, aprieta pantorrillas |

### Block 2026-11-16 — Strength · Heavy Sets of 6-8 II (new exercises only)

Also uses `incline-dumbbell-press`, `dumbbell-bench-press` and `romanian-deadlift` (see above).

| exercise id | current cue (approved `squeeze_cue`) | short EN | short ES |
|---|---|---|---|
| `smith-machine-bench-press` | Press up and squeeze your chest as if trying to drag your hands toward each other along the bar. | Drag hands together, squeeze chest | Manos hacia adentro, aprieta el pecho |
| `barbell-bent-over-row` | Drive your elbows back and squeeze your shoulder blades together like holding a pencil between them. | Elbows back, pinch shoulder blades together | Codos atrás, aprieta los omóplatos juntos |
| `pull-up-wide-grip` | Pull your elbows down and out to your hips and squeeze the outer edges of your lats like closing a pair of wings. | Elbows down and out, squeeze lats | Codos abajo y afuera, aprieta dorsales |
| `dip` | Press up and squeeze your chest as if trying to pull the two bars toward each other. | Pull bars together, squeeze chest | Junta las barras, aprieta el pecho |
| `dumbbell-chest-supported-row` | Pull your elbows toward the ceiling and squeeze your shoulder blades together like holding a pencil between them. | Elbows up, squeeze shoulder blades together | Codos arriba, junta fuerte los omóplatos |
| `barbell-overhead-press-seated` | Press up and feel the front of your shoulders squeeze, as if pushing the ceiling away with the bar. | Push ceiling away, squeeze front delts | Empuja el techo, aprieta deltoide frontal |
| `dumbbell-lateral-raise-seated` | Lead with your elbows and feel the side of your shoulder do the lifting, as if pushing your hands out to the walls. | Elbows lead, side delts do the lifting | Codos primero, sube con el deltoide lateral |
| `barbell-jm-press` | Press the bar back up and squeeze the back of your arms hard at lockout, as if trying to snap the bar apart. | Snap the bar apart, squeeze triceps | Intenta partir la barra, aprieta el tríceps |
| `barbell-curl` | Curl the bar to your chest and squeeze both biceps hard, as if trying to bend the bar toward your face. | Bend bar toward face, squeeze biceps | Dobla la barra hacia ti, aprieta bíceps |
| `dumbbell-overhead-triceps-extension` | Drive the dumbbell to lockout and squeeze the back of your arms hard, as if pushing it through the ceiling. | Push through ceiling, squeeze triceps hard | Empuja hacia el techo, aprieta el tríceps |
| `cable-bayesian-curl` | Curl with your arm behind you and squeeze the biceps hard at the top, feeling the stretch turn into a peak. | Arm behind you, squeeze biceps peak | Brazo atrás, aprieta el pico del bíceps |
| `back-squat` | Drive up by squeezing your quads and glutes together, as if spreading the floor apart with your feet. | Spread the floor, squeeze quads and glutes | Abre el piso, aprieta cuádriceps y glúteos |
| `dumbbell-lunge-reverse` | Squeeze your front glute to pull yourself back up, as if dragging your front heel toward you. | Drag front heel, squeeze front glute | Arrastra el talón delantero, aprieta ese glúteo |
| `machine-standing-leg-curl` | Squeeze your hamstring to bring your heel up, as if trying to touch your glute with it. | Heel to glute, squeeze hamstring | Talón al glúteo, aprieta el isquiotibial |
| `smith-machine-calf-raise` | Squeeze your calves at the top as if trying to lift the bar higher with just your ankles. | Rise high, squeeze calves at top | Sube alto, aprieta las pantorrillas arriba |
| `ab-wheel-rollout` | Pull the wheel back by squeezing your abs, as if dragging your ribs down toward your knees. | Ribs to knees, squeeze abs back | Costillas a las rodillas, aprieta el abdomen |

### Block 2026-12-28 — Size · Light-to-Heavy + Supersets II (new exercises only)

Also uses `leg-extensions-toes-dorsiflexed-neutral` and `standing-calf-raises-toes-neutral`.

| exercise id | current cue (approved `squeeze_cue`) | short EN | short ES |
|---|---|---|---|
| `incline-barbell-bench-press` | Press up and feel your upper chest pull your arms in toward your chin, as if hugging the bar toward your collarbones. | Hug bar to collarbones, squeeze upper chest | Abraza la barra, aprieta el pecho superior |
| `dumbbell-bench-press-decline` | Press up and in, squeezing your lower chest as if trying to make your elbows meet over your stomach. | Elbows meet over stomach, squeeze lower chest | Codos sobre el abdomen, aprieta pecho bajo |
| `decline-dumbbell-fly` | Close the arc as if hugging a barrel and squeeze your lower chest, bringing your inner arms toward each other. | Hug a barrel, squeeze lower chest | Abraza un barril, aprieta pecho bajo |
| `plate-loaded-lat-pulldown` | Drive your elbows down and back to your sides and squeeze your lats hard at the bottom of each pull. | Elbows down and back, squeeze lats | Codos abajo y atrás, aprieta los dorsales |
| `plate-loaded-low-row` | Drive your elbows back toward your hips and squeeze your lats and mid-back together at the end of the pull. | Elbows to hips, squeeze your lats | Codos a la cadera, aprieta los dorsales |
| `ez-bar-pullover` | Sweep the bar back over your chest by pulling your elbows toward your hips, squeezing your lats like closing a book. | Sweep bar over chest, squeeze lats | Lleva la barra sobre el pecho, aprieta dorsales |
| `dumbbell-shoulder-press` | Drive up and feel the front of your shoulders work, as if pushing the ceiling away while your biceps close toward your ears. | Biceps toward ears, squeeze front delts | Bíceps a las orejas, aprieta deltoide frontal |
| `db-60-y-raises` | Reach long into the Y and feel the side and back of your shoulders lift, as if pushing your thumbs up toward the ceiling. | Reach long into Y, lift with delts | Estírate en Y, sube con los deltoides |
| `cable-rear-delt-fly` | Pull your hands out to the side walls and squeeze the back of your shoulders, as if stretching a wide rubber band. | Hands to side walls, squeeze rear delts | Manos a las paredes, aprieta deltoide posterior |
| `machine-preacher-curl` | Curl the handles to your shoulders and squeeze the biceps hard for a one-second hold at the top. | Handles to shoulders, hold biceps squeeze | Agarres a los hombros, aprieta y sostén bíceps |
| `dumbbell-skull-crusher-decline` | Extend to lockout and squeeze the back of your arms hard, as if trying to touch the dumbbells to the ceiling. | Extend to lockout, squeeze triceps hard | Extiende del todo, aprieta fuerte el tríceps |
| `db-spider-hammer-curls` | Curl your thumbs toward your shoulders and squeeze the biceps and outer forearm hard for a one-second hold. | Thumbs to shoulders, squeeze biceps hard | Pulgares a los hombros, aprieta fuerte el bíceps |
| `cable-triceps-kickback` | Kick your hand back to lockout and squeeze the back of your arm hard, as if pushing the cable through a wall. | Kick hand back, squeeze triceps | Lleva la mano atrás, aprieta el tríceps |
| `smith-machine-squat` | Squeeze your quads to straighten your legs, as if pressing your back up into the bar and the floor down. | Push floor down, squeeze quads to stand | Empuja el piso, aprieta cuádriceps al subir |
| `dumbbell-step-up` | Squeeze the glute and quad of your top leg to stand tall, as if pulling the box down toward you. | Pull the box down, squeeze your glute | Jala el cajón hacia ti, aprieta el glúteo |
| `machine-hip-thrust` | At the top, squeeze your glutes hard as if trying to pinch a coin between them, and hold it. | At the top, squeeze glutes and hold | Arriba, aprieta los glúteos y sostén |
| `prone-leg-curl-toes-dorsiflexed-neutral` | Squeeze your hamstrings to pull your heels toward your glutes, as if trying to kick yourself in the backside. | Heels to glutes, squeeze hamstrings | Talones al glúteo, aprieta isquiotibiales |
| `hanging-knee-raise` | Curl your knees toward your chest and squeeze your lower abs, as if trying to tuck your pelvis under your ribs. | Knees to chest, squeeze lower abs | Rodillas al pecho, aprieta el abdomen bajo |

### Block 2027-02-08 — Size · Heavy-to-Light + Drop Sets III (new exercises only)

Also uses `dumbbell-chest-supported-row`, `cable-lateral-raise`, `dumbbell-curl-incline` and
`leg-extensions-toes-dorsiflexed-neutral`.

| exercise id | current cue (approved `squeeze_cue`) | short EN | short ES |
|---|---|---|---|
| `barbell-bench-press` | Squeeze your chest as if trying to bend the bar into a U and bring your biceps toward each other as you press up. | Bend the bar, squeeze chest | Dobla la barra en U, aprieta el pecho |
| `machine-chest-press-incline` | Push up and in, squeezing your upper chest just below your collarbones as if bringing your biceps toward your chin. | Biceps toward chin, squeeze upper chest | Bíceps al mentón, aprieta el pecho superior |
| `dumbbell-fly-incline` | Close the arc up and in, squeezing your upper chest as if hugging a barrel against your collarbones. | Hug a barrel, squeeze upper chest | Abraza un barril, aprieta el pecho superior |
| `dumbbell-fly` | Lead the arc with your inner arms and squeeze your chest as if trying to make your biceps kiss at the top. | Make biceps kiss, squeeze chest | Junta los bíceps, aprieta el pecho arriba |
| `barbell-t-bar-row` | Drive your elbows back and squeeze your mid-back together as if cracking a walnut between your shoulder blades. | Elbows back, squeeze mid-back hard | Codos atrás, aprieta fuerte la espalda media |
| `neutral-grip-lat-pulldown` | Drive your elbows down tight to your ribs and squeeze your lats as if pinning a newspaper under each arm. | Pin elbows to ribs, squeeze lats | Codos pegados a las costillas, aprieta dorsales |
| `barbell-overhead-press` | Drive the bar up and squeeze your shoulders as if trying to bend the bar overhead while your biceps finish by your ears. | Bend the bar overhead, squeeze shoulders | Dobla la barra arriba, aprieta los hombros |
| `ez-bar-overhead-triceps-extension` | Press to lockout overhead and squeeze the back of your arms, as if trying to bend the bar over your head. | Lock out overhead, squeeze triceps | Extiende arriba, aprieta el tríceps |
| `cable-curl-straight-bar` | Curl the bar to your chest and squeeze the biceps hard, as if trying to bend the bar upward in the middle. | Bar to chest, squeeze biceps hard | Barra al pecho, aprieta fuerte el bíceps |
| `cable-triceps-pushdown-reverse-grip` | Push your palms down to lockout and squeeze the back of your arms, feeling the inner part of the triceps tighten. | Palms down to lockout, squeeze triceps | Palmas abajo hasta extender, aprieta tríceps |
| `dumbbell-rear-delt-fly-chest-supported` | Reach your hands out wide and feel the back of your shoulders work, as if spreading giant wings. | Spread giant wings, squeeze rear delts | Abre alas gigantes, aprieta deltoide posterior |
| `barbell-front-squat` | Feel your quads take the load at the bottom and squeeze them to drive your elbows and chest straight up. | Elbows up, squeeze quads to rise | Codos arriba, aprieta cuádriceps al subir |
| `smith-machine-hip-thrust` | Drive your hips into the bar and squeeze your glutes at the top, as if tucking your tailbone under. | Hips into bar, squeeze glutes at top | Cadera a la barra, aprieta glúteos arriba |
| `machine-seated-leg-curl-single-leg` | Curl by squeezing the hamstring of your working leg, as if pulling your heel down and back through the floor. | Heel down and back, squeeze hamstring | Talón abajo y atrás, aprieta el isquiotibial |
| `leg-press-calf-raises-toes-neutral` | Squeeze your calves at the top as you point your toes, like a ballet dancer rising onto tiptoe. | Point toes, squeeze calves at top | Apunta los dedos, aprieta pantorrillas arriba |
| `decline-sit-up` | Curl up and squeeze your abs hard, as if pulling your ribs down to your belly button. | Ribs to belly button, squeeze abs | Costillas al ombligo, aprieta el abdomen |

## ⚠️ Open decisions
- ⚠️ REVISAR: **Spanish needs your approval too.** All ES short cues are drafts in Latin
  American Spanish with "tú" (e.g., *jala*, not *tira*, in `dumbbell-step-up`). They follow the
  muscle words already used in `docs/fitness/approved/es/catalogue-*.json`.
- ⚠️ REVISAR: **"delts" vs plain words** — see the Glossary note above.
- ⚠️ REVISAR: **Two-muscle long cues were cut to one muscle** so each short cue keeps one
  focus (the full cue still has both behind "More"): `plate-loaded-low-row` (lats only, not
  mid-back), `db-spider-hammer-curls` (biceps only, not forearm), `dumbbell-step-up` (glute
  only, not quad), `romanian-deadlift` (glute lockout only; the hamstring stretch stays in the
  full cue). If you would rather have the RDL short cue focus on the hamstrings, an option is
  "Feel hamstrings stretch, then squeeze glutes" (6 words), but that is two actions.
- ⚠️ REVISAR: `back-squat` keeps "quads and glutes" because the long cue names both as one
  action. Fine for you, or shorten to one muscle?
- **Past blocks** (02-16, 03-30, 05-11, 07-06, 08-17) are not covered. If workout mode can show
  them (e.g., history or reusing a past block), I can draft short cues for their remaining
  ~45 exercises in a follow-up. Long-term, every catalogue exercise could get one.
- **Field name and rule**: `squeeze_cue_short` and the display rule above are proposals; where
  and how it is stored and checked is the Tech Lead's call.

## Sources
- Approved GymStudio catalogue: `docs/fitness/approved/catalogue-v2/*.json` (`squeeze_cue`,
  the only source of every short cue here) and `docs/fitness/approved/es/catalogue-*.json`
  (Spanish muscle words).
- `docs/fitness/catalogue-v2-spec.md` (`squeeze_cue` definition).
- Schoenfeld BJ et al. (2018), "Differential effects of attentional focus strategies during
  long-term resistance training", *European Journal of Sport Science* — internal (muscle)
  focus cues and hypertrophy; supports short muscle-focused cues for isolation and
  hypertrophy work.
- Wulf G. (2013), "Attentional focus and motor learning: a review of 15 years",
  *International Review of Sport and Exercise Psychology* — short, simple cues are easier to
  use during a movement.

## PO decisions (2026-10-18)
EN and ES short cues approved as written; "deltoide frontal/lateral/posterior" wording kept; one-muscle cues for the 4 two-muscle exercises accepted; back squat keeps "quads and glutes".

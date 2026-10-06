# Promo video 30 s — "Stop guessing. Your trainer learns from every set." (draft)

Status: **draft** (Socialer, 2026-10-07). Builds on `2026-10-07-promo-video-storyboard.md` (8 s cut).
Needs PO approval; every fitness claim needs PT approval; Tech Lead confirms behaviour. Nothing published.
Prototype: `docs/marketing/2026-10-07-promo-30s-prototype.html` (autoplays, loops 30 s, EN/ES + replay outside the frame).

## Format
- Vertical 9:16, 1080×1920, 30 s, Reels / TikTok / Shorts. Captions burned in (sound-off first).
- Safe area: no text in top ~250 px or bottom ~420 px or right ~120 px (platform buttons). Prototype keeps
  captions in the upper-middle band and the phone UI below it.
- Visual: real dark UI tokens from `src/styles.css` (`--bg-dark #0f0f10`, `--text #f3f3f1`, `--brand #8d5e63`,
  `--nav-active #c99ca1`, panels `rgba(255,255,255,.05)`, lines `rgba(255,255,255,.11)`).
- Beat grid: 120 BPM = 1 beat / 0.5 s, 1 bar / 2 s. Every scene cut lands on a bar line (even second).

## Example data (engine-consistent, PT to confirm)
Exercise: Seated dumbbell shoulder press. Monday (D1) target 10 reps, logged 10 kg × 14 · 14 · 14.
Thursday (D4) original 10 kg × 10–12 → engine reason `original_too_easy` → Recommended 12 kg × 10–12.
Set 1 at 12 kg × 15 → set hint "15 reps at 12 kg — consider 14 kg for the next set" (one step up).
Summary uses ↑ (beat target), → (on target), ↓ (short) rows with "Next (D1)" target.

## Narrative arc and shot list
| Time | Bars | Scene | Visual | On-screen text EN | On-screen text ES |
|---|---|---|---|---|---|
| 0–2 s | 1 | **Hook** | Big type, blinking "? kg" over dark bg; phone silhouette | Guessing your weights every session? | ¿Adivinas tus pesos en cada sesión? |
| 2–4 s | 2 | **Promise** | Type swap; phone slides up showing Thursday D4 | Your AI Trainer remembers. | Tu Entrenador IA lo recuerda. |
| 4–9 s | 3–4.5 | **AI Trainer card** | Card lines reveal on beats: Last time → Original today → Recommended (accent pop) → Why; tap **Accept** → "Accepted: 12 kg × 10–12." | It recalculates today's load — and tells you why. | Recalcula el peso de hoy — y te dice por qué. |
| 9–13 s | 4.5–6.5 | **Log sets** | Set row 1 fills 12 kg × 15 ✓; "Reps left in the tank?" 0 / 1–2 / 3+ / Skip → taps 3+; set hint slides in with "Use 14 kg" | Log every set. Get a hint for the next one. | Registra cada serie. Recibe una pista para la siguiente. |
| 13–16 s | 6.5–8 | **Rest timer** | "Start rest" → ring counts 1:30 → 1:27 fast; set 2 at 14 kg × 11 ✓ | Rest timer built in. | Temporizador de descanso incluido. |
| 16–21 s | 8–10.5 | **Same-week adaptation** | Day tabs D1–D6 with counts (D1 6/6 ✓ … D4 active); Monday card 10 kg × 14·14·14 (target 10) arrow-morphs into Thursday 12 kg × 10–12 | Monday's sets change Thursday's target. | Las series del lunes cambian el objetivo del jueves. |
| 21–25 s | 10.5–12.5 | **Today's performance** | Summary sheet: 3 rows with ↑ → ↓, "Next (D1): …", "Why: …" | See how you did — and what's next. | Mira cómo te fue — y qué sigue. |
| 25–27 s | 12.5–13.5 | **EN / ES** | Header toggle flips EN→ES, labels change live (Accept → Aceptar) | In English or Spanish. | En inglés o en español. |
| 27–30 s | 13.5–15 | **End card** | Wordmark + tagline + CTA pill | GymStudio — Train with an AI Personal Trainer that learns from every set. **Try the demo** | GymStudio — Entrena con un Entrenador Personal IA que aprende de cada serie. **Prueba la demo** |

Real app labels used (from `src/i18n/sections/workout.ts`): AI Trainer / Entrenador IA, Last time / Última vez,
Original today / Original de hoy, Recommended / Recomendado, Why / Por qué, Accept / Aceptar, Keep original /
Mantener original, Accepted / Aceptado, Reps left in the tank? / ¿Cuántas te quedaban?, set hint message + "Use {weight} kg",
Start rest / Iniciar descanso, Today's performance / Tu rendimiento de hoy, Next ({day}) / Siguiente ({day}).
The Why line is the real `original_too_easy` string: "Last time you did 14 reps at 10 kg; today's target is 10–12.
I have moved the load up." (ES: "La última vez hiciste 14 repeticiones con 10 kg; el objetivo de hoy es 10–12. He subido el peso.")

## Voiceover option (calm, confident; ~70 words, fits 30 s)
**EN:** Guessing your weights every session? Not anymore. GymStudio's AI Trainer remembers your last workout,
recalculates today's load and tells you why. Log each set and get a hint for the next one. Rest timer's built in.
Crush Monday, and Thursday's target moves up. Finish with today's performance and your next target. In English or
Spanish. GymStudio — train with an AI personal trainer that learns from every set. Try the demo.

**ES:** ¿Adivinas tus pesos en cada sesión? Se acabó. El Entrenador IA de GymStudio recuerda tu último entreno,
recalcula el peso de hoy y te explica por qué. Registra cada serie y recibe una pista para la siguiente. Con
temporizador de descanso. Si el lunes te sobra, el jueves sube el objetivo. Al final, tu rendimiento y tu próximo
objetivo. En español o inglés. GymStudio: entrena con un entrenador personal IA que aprende de cada serie. Prueba la demo.

Voice: PO's own voice, or a licensed TTS/voice actor (licence needed). Default version is music + captions only.

## Captions + hashtags
**EN:** Stop guessing your weights. GymStudio's AI Trainer remembers every set, sets today's load and explains why. Try the demo (link in bio).
#GymStudio #AIPersonalTrainer #GymTok #WorkoutTracker #ProgressiveOverload #FitnessApp #GymLife

**ES:** Deja de adivinar tus pesos. El Entrenador IA de GymStudio recuerda cada serie, ajusta el peso de hoy y te explica por qué. Prueba la demo (link en la bio).
#GymStudio #EntrenadorIA #Gym #RutinaDeGimnasio #SobrecargaProgresiva #AppFitness #Entrenamiento

## Music direction
- Royalty-free / commercially licensed only: platform commercial library (TikTok CML, Meta Sound Collection,
  YouTube Audio Library) or a paid stock licence (e.g. Artlist, Epidemic). No trending copyrighted songs.
- Style: modern minimal electronic / lo-fi house, **120 BPM**, 4/4, 30 s edit or loopable.
- Beat-sync cues: 0.0 s soft riser under hook; **2.0 s drop** (promise); 7.5 s accent hit on Accept tap;
  9/13/16/21/25 s cuts on downbeats; 11 s tick on "Use 14 kg"; 18 s whoosh on Mon→Thu morph; 27 s full hit on end card, tail out by 30 s.

## Claims needing approval
| Claim | Who | Note |
|---|---|---|
| "Your AI Trainer remembers / learns from every set" | PT + PO | Core tagline; based on rule engine + history |
| Mon 10 kg × 14·14·14 (target 10) → Thu 12 kg × 10–12 | PT + Tech Lead | Example must match engine output for this exercise's step |
| Set hint 15 reps at 12 kg → consider 14 kg | PT + Tech Lead | 2 kg dumbbell step assumed |
| "Monday's sets change Thursday's target" | PT + Tech Lead | Same-week adaptation as implemented |
| Summary rows ↑ → ↓ and "Next (D1): 12 kg × 10–12" | PT + Tech Lead | Example values |
| "Try the demo" CTA → `?demo=1` | PO | Link in bio / UTM choice |
No body-change, health, or results promises. No ratings, user counts or testimonials.

## PO decisions
1. Music source and licence (or captions-only).
2. Voiceover yes/no; whose voice (licence if TTS/actor).
3. Exercise in the example (shoulder press) and whether to show the full real "Why" sentence (current) or a shorter one.
4. CTA wording and link target (demo URL in bio).
5. Which language version leads per platform (EN, ES, or both posts).
6. Final export: screen-record the prototype vs. real-app capture by QAer.

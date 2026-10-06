# Promo video storyboard — "Your trainer remembers every set" (draft)

Status: **draft** (Socialer, 2026-10-07). Needs PO approval; fitness claims need PT approval. Nothing published.
Prototype: `docs/marketing/2026-10-07-promo-video-prototype.html` (open in a browser; loops ~8 s, EN/ES toggle).

## Concept
One real moment from the app: the AI Trainer card reads your last session, raises today's load, explains why,
you tap **Accept**, log the set. Message: *GymStudio is a personal trainer that learns from every set.*

- Format: vertical 9:16 (1080×1920), ~8 s, Reels / TikTok / Shorts. Captions burned in (sound-off viewing).
- Safe area: keep text out of top ~250 px and bottom ~400 px (platform UI); prototype keeps text in the middle band.
- Visual: real dark UI (`src/styles.css` tokens: #0f0f10 bg, #f3f3f1 text, #8d5e63 brand, #c99ca1 accent).

## Shot list
| Time | Shot | On-screen text EN | On-screen text ES |
|---|---|---|---|
| 0.0–1.2 s | Hook: big type over dark bg, phone slides up | Your trainer remembers every set. | Tu entrenador recuerda cada serie. |
| 1.2–2.4 s | AI Trainer card appears; "Last time" line highlights | Last time: 10 kg × 14 · 14 · 14 | Última vez: 10 kg × 14 · 14 · 14 |
| 2.4–3.4 s | "Original today" line | Original today: 10 kg × 12 | Original de hoy: 10 kg × 12 |
| 3.4–4.6 s | "Recommended" line pops (accent) + "Why" | Recommended: 12 kg × 10–12 / Why: you beat your target by 4 reps | Recomendado: 12 kg × 10–12 / Por qué: superaste tu objetivo por 4 reps |
| 4.6–5.4 s | Tap on **Accept** (touch ripple) → "Accepted: 12 kg × 10–12." | Accept | Aceptar |
| 5.4–6.4 s | Set row 1 ticked (12 kg × 11 ✓), rest timer chip starts | Set 1 ✓ · Rest 1:30 | Serie 1 ✓ · Descanso 1:30 |
| 6.4–8.0 s | End card: logo wordmark + tagline | GymStudio — Train with an AI Personal Trainer that learns from every set. | GymStudio — Entrena con un Entrenador Personal IA que aprende de cada serie. |

Note: the app's real "Why" text is longer ("Last time you did 14 reps at 10 kg; the target was 12. I have moved
the load up."). The video uses a shortened paraphrase — Tech Lead/PO must accept that, or we show the real string.

## Captions + hashtags
**EN:** Your trainer remembers every set. GymStudio reads your last session and tells you what to lift today — and why. 
#GymStudio #AIPersonalTrainer #GymTok #WorkoutLog #ProgressiveOverload #FitnessApp

**ES:** Tu entrenador recuerda cada serie. GymStudio lee tu última sesión y te dice qué levantar hoy — y por qué.
#GymStudio #EntrenadorIA #Gym #RutinaDeGimnasio #SobrecargaProgresiva #AppFitness

## Music direction
Short punchy electronic / lo-fi hip-hop beat, ~110–125 BPM, hit on the Accept tap (~4.8 s), soft out on end card.
Use only royalty-free, commercially licensed tracks (e.g. the platform's own commercial music library, or a paid
licence from a stock library). Keep the licence receipt; avoid trending copyrighted songs on a brand account.
**PO decision:** which source/licence.

## Claims needing approval
1. "Train with an AI Personal Trainer that learns from every set." (PO tagline; PT: "learns" wording)
2. "Your trainer remembers every set." (hook; PT/Tech Lead: it uses logged history — accurate only for logged sets)
3. Example progression 10 kg × 14·14·14 → 12 kg × 10–12 (PT: is the engine output / jump realistic? Tech Lead: engine really produces it)
4. "Why: you beat your target by 4 reps" (paraphrase of the real reason string)
5. Rest timer 1:30 shown (Tech Lead: confirm default)
6. Spanish copy (PO language check)

## Producing the final MP4
- **Option A (recommended for credibility): screen-record the live demo** (`https://sebpabonc.github.io/gymstudio/?demo=1`)
  on an iPhone (built-in screen recording) or the iOS Simulator, with a seeded history that produces exactly this
  recommendation (QAer/Tech Lead to set it up). Then edit in CapCut / DaVinci Resolve: add hook + end card, captions, music.
- **Option B (fast): record this animated prototype.** Open the HTML in Chrome, device toolbar at 405×720 (or zoom so the
  frame is 1080×1920), record with QuickTime / OBS, crop to the frame, export H.264 MP4 1080×1920, 30 fps.
  It's a faithful recreation, not a real capture — label internally as such and keep strings in sync with the app.
- Export: MP4, H.264, 1080×1920, 30 fps, < 60 MB, ~8 s; also a cover frame (end card).

# GymStudio marketing and launch plan (DRAFT)

- **Status:** draft by Socialer, 2026-10-18. Nothing here has been posted, sent, created or bought.
- **Builds on:** `2026-10-10-rollout-and-monetization.md` (phases, pricing, metrics), `2026-10-10-rollout-plan.html`,
  `2026-10-07-promo-video-storyboard.md` (8 s), `2026-10-07-promo-30s-storyboard.md` (30 s).
- **Prototypes delivered with this plan:** `2026-10-18-promo-15s.html`, `2026-10-18-promo-30s.html`,
  `2026-10-18-app-store-screenshots.html`.
- **Approvals:** every fitness or results claim is marked **[PT]**; product, money and brand decisions **[PO]**;
  "is this how the app really works" **[TL]** (Tech Lead); visual identity **[UX]**.

---

## 0. What the app really does today (source of truth for every asset)

Checked on 2026-10-18 against `AGENTS.md`, `src/` and the live demo (`https://sebpabonc.github.io/gymstudio/?demo=1`, 375 px, EN and ES).

| Feature | What a user sees (real labels) | Where | OK to market? |
|---|---|---|---|
| **AI Trainer load for today** | In Workout mode each exercise shows **"Today: 42.5 kg × 8"**. The engine (`src/trainer/engine.ts`) applies PT-approved rules (spec v2 + R20–R24) to your last sessions. Steps: dumbbells 2 kg, machines/cables 2.5 kg, barbell/plate-loaded 2.5 kg. Invariants block 0 kg, impossible weights and big jumps. | Workout mode, cue sheet | Yes **[PT][TL]** |
| **"Why" for every load** | Cue sheet → **TODAY**: "3 sets × 8 reps at 42.5 kg · Last time you reached the top of the 8-rep target at 40 kg, so I moved the load up." (ES: "La última vez alcanzaste el máximo del objetivo de 8 repeticiones con 40 kg, así que subí el peso.") | Tap the squeeze cue (#327) | Yes **[PT]** |
| **Last time** | "Last time · Tue 6 Oct: 40×11·8·8" above the set table; per-round "Last time: 14×10" in supersets | Workout mode | Yes |
| **Set-by-set hint** | When a straight set beats the top of the range by 3+ reps at the planned load: "11 reps at 42.5 kg — consider 45 kg for the next set" + **Use 45 kg** | Workout mode (straight sets) | Yes **[PT]** |
| **Reps left in the tank?** | 0 / 1–2 / 3+ / Skip after an exercise | Today + Workout mode | Yes |
| **Squeeze cue + posture tips** | "Squeeze — Drive your elbows behind your body…"; sheet with **POSTURE TIPS** (PT-approved content, EN/ES). Short cues approved 2026-10-18 ("Elbows back, squeeze shoulder blades together"). | Workout mode | Yes (content is PT-approved) |
| **Supersets by rounds** | "Superset · C1 + C2 · Round 1 of 3", one card per round, "Do C1, rest ~10 s, then C2; rest after the pair." | Workout mode (#308) | Yes |
| **Rest timer** | "Start rest", block rest (e.g. 150 s); iOS Live Activity in code (Dynamic Island) | Workout mode | Timer yes; Dynamic Island **not yet** (iOS not distributed) |
| **6-week plan + weekly bar** | "6-week plan · 4 days/week", "Week 4 of 6", **This week · 1 of 4 days done** bar with weekday + date, swipe to other weeks; next-week preview "Projected from your current performance" | Today | Yes **[PT]** for "projected" wording |
| **Personal plan** | "Create your plan — Answer a few questions and we'll build your 6-week plan." (PT templates: 3–6 days, gym or dumbbells) | New user | Yes **[TL]** confirm new-user flow end to end |
| **Session summary** | "Session complete", **Today's performance** (12 kg × 15 vs 10–12, Next (D1): …), **Personal records** (Weight PR, Rep PR, e1RM PR) | End of workout | Yes **[PT]** (UXer flagged the ↑/→/↓ meaning, see risks) |
| **Progress v3** | Tabs **Overview · Trends · Muscles · Consistency**; tiles Training days, Plan adherence, Main-lift e1RM, Beat last time; strength trend lines (3-session average); **Weekly sets by muscle** with the common range band 10–20; "Since the last equivalent session: Improved / Held / Worth a look" | Progress | Yes **[PT]** wording, never as a result promise |
| **Ask AI** | Sparkle button → "Ask anything about your training. Your current block and recent sessions help shape the answer." | Help & AI | Mention lightly **[TL]** (needs sign-in + consent; cost per user) |
| **EN / ES** | Toggle in the header; full UI and PT content in both | Everywhere | Yes |
| **Offline + sync** | Works without network; Google sign-in syncs history | Everywhere | Yes **[TL]** |
| **Web + iOS** | Web app (GitHub Pages, add to home screen). iOS app via Capacitor runs on the PO's phone; **not on TestFlight/App Store yet** | — | Say "iPhone app coming" until TestFlight is live |

**Do not market (not built):** Android app, Apple Watch, paywall/Pro, social feed, friends/leaderboards,
referral rewards, nutrition, coach marketplace, body-composition tracking, exercise videos/illustrations (parked).

**Found while preparing this plan (for Tech Lead/PO, not blockers for drafts):**
1. The demo's Progress tabs mostly say "Not enough data yet" (Overview: "Building"). That makes poor marketing
   screenshots. Option: richer demo history (`src/demo/generateDemoHistory.ts`) for marketing captures, or
   use clearly labelled recreations (what the prototypes here do). **[TL][PO]**
2. The old 30 s promo (2026-10-07) shows an "AI Trainer" card with **Accept / Keep original**. In today's
   Workout mode the target appears as "Today: … kg × …" and the reason is in the cue sheet. The new promos
   follow the current UI. **[TL]** confirm before export.
3. The in-app wordmark is **GYM STUDIO** with the eyebrow **TRAIN WITH INTENT / ENTRENA CON INTENCIÓN**,
   while store/marketing copy says "GymStudio". Brand round 2 (`docs/ux/proposals/2026-10-05-brand-*`) is
   still undecided. Pick one spelling before any public asset. **[PO][UX]**

---

## 1. Positioning

**One line (core value, unchanged):**
- EN: **Train with an AI Personal Trainer that learns from every set.**
- ES: **Entrena con un entrenador personal con IA que aprende de cada serie.**

**Positioning statement.** For gym-goers who follow a plan but guess their weights, GymStudio is the training app
that tells you **what to lift today and why**, from your own last sessions, using rules written by a personal
trainer. Unlike loggers (Hevy, Strong) it doesn't stop at recording; unlike black-box AI coaches it shows
the reason for every number, in English or Spanish.

**Honesty rule for "AI".** The load is decided by PT-written rules (deterministic engine); AI explains and
answers questions. We say "AI Personal Trainer" (the product name for this system) and always pair it with
"…and tells you why". We never claim it "knows your body", "prevents injury" or "guarantees gains". **[PT][PO]**

### Messaging pillars

| # | Pillar | EN message | ES message | Proof in the app |
|---|---|---|---|---|
| 1 | **Stop guessing** | Walk in knowing today's weight. | Entra sabiendo qué peso te toca hoy. | "Today: 42.5 kg × 8" |
| 2 | **It tells you why** | Every number comes with a reason. | Cada número viene con su porqué. | Cue sheet "Last time you reached the top…" |
| 3 | **Learns from every set** | Your last sets shape your next ones, even mid-workout. | Tus últimas series deciden las siguientes, incluso a mitad del entreno. | Last time, set hint "consider 45 kg", next-week preview |
| 4 | **A real plan, written by a trainer** | 6-week plans built from a personal trainer's templates. | Planes de 6 semanas creados a partir de plantillas de un entrenador personal. | "6-week plan · 4 days/week", PT blocks/templates **[PT]** |
| 5 | **Fast in the gym** | Big logger, supersets by rounds, rest timer. Made for one hand between sets. | Registro rápido, superseries por rondas, temporizador. Hecho para usar con una mano entre series. | Workout mode |
| 6 | **Bilingual for real** | Fully in English and Spanish. | Completamente en español e inglés. | EN/ES toggle |

**Tone:** calm, confident, a bit nerdy about training; short sentences; numbers over adjectives; no hype
words ("insane gains", "shred", "transform"). Spanish: neutral Latin American, "tú", no Spain-only slang. **[PO]** confirm.

---

## 2. Target personas

| Persona | Who | Pain | What we show | Channel |
|---|---|---|---|---|
| **A. "Plan follower" Laura, 27** (primary) | Trains 3–4×/week for 1–3 years, follows a PDF/Notes/Instagram program | Doesn't know when to add weight; writes logs in Notes | Today's weight + why, last time, weekly bar | Instagram Reels, TikTok, friends |
| **B. "Data lifter" Andrés, 32** | Intermediate, already uses Hevy/Strong or a spreadsheet | Logs but gets no decision; wants progression logic | Rules, set hint, Progress trends, muscle sets | YouTube Shorts, Reddit-style long captions, TikTok |
| **C. "Coming back" Carlos, 38** | Returning after a break, busy | Starts too heavy or too light; no time to plan | Personal 6-week plan, "long break" reduction **[PT]**, rest timer | WhatsApp/friends, gym partners |
| **D. "Bilingual gym" Mariana, 24** | Spanish-first, many apps feel translated | English-only apps, gym jargon | Full ES UI + ES technique tips | Instagram/TikTok in ES, LatAm creators |
| **E. Gym owner / trainer** (B2B2C, later) | Small local gym or independent PT | Members drop off; no app of their own | Free beta access for members; plan + logging | In-person, WhatsApp, email (PO sends) |

Exclude for now: absolute beginners who need video coaching (no exercise videos yet), athletes needing sport-specific periodisation.

---

## 3. Channel plan

| Channel | Role | Cadence (Phase 1+) | Format | Owner | Notes |
|---|---|---|---|---|---|
| **Instagram** (Reels + carousels + stories) | Main brand + ES/EN reach | 3 Reels + 1 carousel / week | 9:16 Reels 7–30 s; 4:5 carousels | PO posts; Socialer drafts | Bio link → landing page with UTM |
| **TikTok** | Reach / discovery | 4–5 / week (same edits, native captions) | 9:16, 7–30 s, hook in first second | PO posts | Commercial Music Library only |
| **YouTube Shorts** | Search + evergreen | 2–3 / week (re-cuts) | 9:16 ≤ 60 s | PO posts | 60 s "how it works" lives here |
| **WhatsApp / friends** | Phase 0 recruitment, feedback | Personal messages, 1 beta group | Text + link + 15 s video | PO only | Highest-trust channel; no broadcasts to people who didn't opt in |
| **Gym partnerships** | Phase 1 cohorts | 1–2 gyms | In-person pitch + 1-page flyer + QR | PO | Free beta access for members; no payment exchanged in beta |
| **Referrals** | Phase 1–2 growth | Always on | "Invite a gym partner" link | — | **Reward needs a build (not built)**. In beta: manual ask + personal thank-you |
| **App Store (ASO)** | Phase 2 conversion | Listing + screenshots, update monthly | 6 screenshots, EN + ES | PO submits | Draft in §8 |
| **Landing page** | Hub for all links | Live from Phase 1 | Single page, EN/ES, waitlist | TL builds (issue) | Outline in §9 |
| Reddit / forums | Optional, B persona | Founder posts, no spam | Long text | PO | Follow each community's self-promo rules |
| Paid ads | Only Phase 2, medium budget | — | Spark Ads/Boosted Reels of best organic | PO buys | Not before App Store launch |

---

## 4. 12-week launch calendar (aligned to the rollout phases)

Week 1 = the week the PO starts the friends beta (proposed **Mon 26 Oct 2026**; shift all dates if later).
Gates come from the rollout doc; if a gate isn't met, the calendar pauses rather than skipping ahead.

| Wk | Phase | Product / ops (dependencies) | Marketing (drafts by Socialer, posts by PO) |
|---|---|---|---|
| 1 | **0 Friends beta** | QAer week-flow pass; new-user plan works **[TL]**; feedback form live; privacy note | PO picks 5–15 friends; send invite (draft §11); PO reserves handles (Instagram, TikTok, YouTube) **[PO]** |
| 2 | 0 | Onboard first 5 in person; weekly triage → issues | No public posting yet. Capture real screens with QAer (richer demo data if approved) |
| 3 | 0 | Week-2 interviews | Film 3 "founder in the gym" clips (PO's own phone, no other gym members visible without consent) |
| 4 | 0 → review | Phase 0 exit review (activation ≥70%, week-4 ≥50%, no P1) | Soft profile launch: 3 posts (pillars 1, 2, 6) to warm accounts; landing page + waitlist live **[TL]** |
| 5 | **1 Open beta** | TestFlight public link (Apple beta review) **[TL]**; crash reporting | **Beta announcement**: 15 s promo (EN + ES), story with link, WhatsApp to friends-of-friends |
| 6 | 1 | Gym partner #1 pitch | 30 s feature tour; carousel "How GymStudio picks today's weight" **[PT]**; gym flyer/QR |
| 7 | 1 | — | Series "Why this weight?" (3 shorts using demo data) **[PT]**; first beta quotes **only with written consent** |
| 8 | 1 | Mid-beta review; pricing questions in feedback form | 60 s "how it works" (Shorts/IG); Spanish-first week (pillar 6) |
| 9 | 1 | Gym partner #2; paywall build starts **[TL]** if pricing approved | Superset + rest timer short; "Progress explained" carousel **[PT]** |
| 10 | 1 → review | Phase 1 exit review (week-4 retention ≥30%, crash-free ≥99%, NPS ≥30) | Waitlist push: "App Store soon" countdown (only once a date is realistic) |
| 11 | **2 App Store prep** | Paywall + restore purchases; privacy policy + terms; App Store listing + screenshots; App Review submission **[TL][PO]** | Final screenshots (§8); launch-day kit: 15 s + 30 s EN/ES, captions, story frames, email/WhatsApp text |
| 12 | **2 Launch** | App Store release (manual release on chosen day) | Launch day posts on all channels; founder story; ask beta users (who agreed) to rate honestly — **never incentivise reviews** |

Realistic note: App Store launch in week 12 assumes the paywall, policy pages and App Review go smoothly. If
Pro isn't ready, launch free on the App Store and add Pro later (see §10).

---

## 5. Content pillars and 20 post ideas

Pillars (rotation per week): **Trainer brain** (40%) · **In the gym** (25%) · **Plan & progress** (20%) · **Builder story / behind the scenes** (15%).

All examples use demo data or the PO's own data; any load or progress example **[PT]**.

| # | Pillar | Format | Hook EN / ES | Content |
|---|---|---|---|---|
| 1 | Trainer brain | Reel 7 s | "Guessing your weights?" / "¿Adivinas tus pesos?" | Today: 42.5 kg × 8 pops in → why line |
| 2 | Trainer brain | Reel 12 s | "Why 42.5 kg today?" / "¿Por qué 42.5 kg hoy?" | Tap squeeze cue → TODAY reason, last time 40×11·8·8 **[PT]** |
| 3 | Trainer brain | Carousel 6 slides | "How GymStudio picks today's weight" / "Cómo elige GymStudio tu peso de hoy" | Last sessions → PT rules → step (2 / 2.5 kg) → reason **[PT]** |
| 4 | Trainer brain | Reel 10 s | "Beat your set? It notices." / "¿Superaste la serie? Se da cuenta." | 11 reps → "consider 45 kg" → Use 45 kg **[PT]** |
| 5 | Trainer brain | Reel 10 s | "It also tells you when to hold." / "También te dice cuándo mantener." | Reason "Some reps were below the 8-rep target, so I kept the load steady." **[PT]** |
| 6 | Trainer brain | Reel 12 s | "Back after two weeks off?" / "¿Vuelves tras dos semanas?" | Long-break reason: load reduced **[PT]** (only if the demo can show it truthfully **[TL]**) |
| 7 | Trainer brain | Carousel | "Your trainer never jumps 10 kg." / "Tu entrenador nunca salta 10 kg." | Safety guardrails in plain words (no 0 kg, one step at a time) **[PT][TL]** |
| 8 | In the gym | Reel 8 s | "Supersets without the chaos" / "Superseries sin caos" | Round 1 of 3, C1 then C2 |
| 9 | In the gym | Reel 7 s | "One hand. Between sets." / "Con una mano. Entre series." | Big +/− logger, ✓, rest starts |
| 10 | In the gym | Reel 10 s | "Forgot the cue mid-set?" / "¿Olvidaste la técnica a mitad de serie?" | Squeeze cue + posture tips (approved content) |
| 11 | In the gym | Story poll | "Do you rest 90 s or 150 s?" / "¿Descansas 90 s o 150 s?" | Rest timer, engagement |
| 12 | In the gym | POV Reel 15 s | "POV: you finally know what to lift" / "POV: por fin sabes qué levantar" | Founder's real workout, screen + gym B-roll |
| 13 | Plan & progress | Reel 10 s | "Your week in one bar" / "Tu semana en una barra" | Weekly bar 1 of 4 → 4 of 4 |
| 14 | Plan & progress | Carousel | "Are you training each muscle enough?" / "¿Entrenas cada músculo lo suficiente?" | Weekly sets by muscle, common range 10–20 (educational, not a prescription) **[PT]** |
| 15 | Plan & progress | Reel 12 s | "Session complete. Here's what's next." / "Sesión completada. Esto es lo que sigue." | Summary: Today's performance + Personal records **[PT]** |
| 16 | Plan & progress | Reel 10 s | "See next week before you get there" / "Mira la próxima semana antes de llegar" | Next-week preview "Projected from your current performance" **[PT]** |
| 17 | Plan & progress | Reel 8 s | "English or Spanish. Your call." / "Español o inglés. Tú decides." | EN→ES toggle flip |
| 18 | Builder story | Talking head 30–45 s | "I built the gym app I needed" / "Creé la app de gimnasio que necesitaba" | PO story, why "why" matters |
| 19 | Builder story | Carousel | "A personal trainer writes the rules" / "Un entrenador personal escribe las reglas" | How PT rules + approval work (no credentials claimed unless verified) **[PT][PO]** |
| 20 | Builder story | Reel 15 s | "Beta week 4: what testers changed" / "Semana 4 de beta: lo que cambiaron los testers" | Real fixes from feedback (anonymous unless consent) |

---

## 6. Promo-video script set

Common specs: 9:16, 1080×1920, burned-in captions (sound-off first), safe area — keep text out of the top ~250 px,
bottom ~420 px and right ~120 px. Music only from a licensed library (TikTok Commercial Music Library, Meta Sound
Collection, YouTube Audio Library, or a paid Artlist/Epidemic licence) — **[PO]** chooses and keeps the licence.
Example data comes from the live demo (T-bar row 40×11·8·8 → 42.5 kg × 8) and engine rules; all **[PT][TL]**.

### 6.1 "Stop guessing" — 15 s hook (prototype: `2026-10-18-promo-15s.html`)

| Time | Visual | Caption EN | Caption ES |
|---|---|---|---|
| 0.0–1.5 | Big "? kg" blinking, barbell plate ticks | **Guessing your weights?** | **¿Adivinas tus pesos?** |
| 1.5–3.5 | Phone rises into Workout mode, "Today: 42.5 kg × 8" slides in with rose bar | GymStudio knows what to lift today. | GymStudio sabe qué te toca hoy. |
| 3.5–7.0 | Tap the cue → sheet: TODAY 3 × 8 at 42.5 kg + why; LAST TIME 40×11·8·8 | And tells you **why**. | Y te dice **por qué**. |
| 7.0–10.5 | Set 1 logged 42.5 × 11 ✓ → hint "consider 45 kg" → **Use 45 kg** | It learns from every set. | Aprende de cada serie. |
| 10.5–12.5 | EN → ES flip on the same screen | English or Spanish. | En español o inglés. |
| 12.5–15 | End card: GYM STUDIO wordmark, tagline, "Try the demo" | Train with an AI Personal Trainer that learns from every set. | Entrena con un entrenador personal con IA que aprende de cada serie. |

VO (optional, EN ~30 words): "Guessing your weights? GymStudio knows what to lift today, and tells you why. Beat a
set and it notices. In English or Spanish. Train with an AI personal trainer that learns from every set."
ES: "¿Adivinas tus pesos? GymStudio sabe qué te toca hoy y te dice por qué. Si superas una serie, lo nota. En español
o inglés. Entrena con un entrenador personal con IA que aprende de cada serie."

### 6.2 "A workout with your trainer" — 30 s feature tour (prototype: `2026-10-18-promo-30s.html`)

| Time | Scene | Caption EN | Caption ES |
|---|---|---|---|
| 0–2 | Hook: "? kg" | Still guessing your weights? | ¿Sigues adivinando tus pesos? |
| 2–5 | Today screen: 6-week plan · Week 4 of 6, weekly bar 1 of 4 days | A 6-week plan, week by week. | Un plan de 6 semanas, semana a semana. |
| 5–9 | Workout mode: Today 42.5 kg × 8, Last time 40×11·8·8 | Today's weight, from your last session. | El peso de hoy, según tu última sesión. |
| 9–13 | Cue sheet: TODAY why + SQUEEZE + POSTURE TIPS | With the reason, and the cue. | Con el porqué y la técnica. |
| 13–17 | Log set 42.5 × 11 → hint → Use 45 kg; rest 2:30 counts | Beat a set? Go up next set. | ¿Superaste la serie? Sube en la siguiente. |
| 17–21 | Superset: Round 1 of 3, C1 14 kg × 11, C2 35.5 kg × 10 ✓ ✓ | Supersets, round by round. | Superseries, ronda a ronda. |
| 21–25 | Session complete: Today's performance + Weight PR | See how you did — and what's next. | Mira cómo te fue — y qué sigue. |
| 25–28 | Progress: weekly sets by muscle, common range band | Track every muscle, every week. | Sigue cada músculo, cada semana. |
| 28–30 | End card (EN↔ES) | Train with an AI Personal Trainer that learns from every set. Try the demo. | Entrena con un entrenador personal con IA que aprende de cada serie. Prueba la demo. |

### 6.3 "How it works" — 60 s (script only; film = screen recording + PO in the gym)

| Time | Visual | VO / caption EN | VO / caption ES |
|---|---|---|---|
| 0–3 | PO under the bar, hesitates; text "? kg" | "Every set, the same question: how much today?" | "En cada serie, la misma pregunta: ¿cuánto hoy?" |
| 3–9 | "Create your plan" questions → 6-week plan · 4 days/week | "Answer a few questions and GymStudio builds your 6-week plan from a personal trainer's templates." **[PT]** | "Responde unas preguntas y GymStudio crea tu plan de 6 semanas a partir de plantillas de un entrenador personal." |
| 9–15 | Today screen, weekly bar, Start workout | "Open today's workout. Your week is one bar: what's done and what's next." | "Abre el entreno de hoy. Tu semana es una barra: lo hecho y lo que falta." |
| 15–24 | Today: 42.5 kg × 8 → cue sheet reason | "Each exercise shows today's weight. Not a guess: it comes from your last sets, with rules written by a trainer, and it tells you why." **[PT]** | "Cada ejercicio muestra el peso de hoy. No es una suposición: sale de tus últimas series, con reglas escritas por un entrenador, y te dice por qué." |
| 24–32 | Log sets with big +/−, ✓, rest timer 2:30 | "Log a set in two taps. Rest starts. Beat the target by a lot and it suggests the next step up." | "Registra una serie en dos toques. Empieza el descanso. Si superas mucho el objetivo, te sugiere subir un paso." |
| 32–38 | Superset rounds | "Supersets go round by round, so you never lose your place." | "Las superseries van ronda a ronda, para que no te pierdas." |
| 38–44 | Squeeze cue + posture tips; EN→ES | "Technique cues are one tap away, in English or Spanish." | "La técnica está a un toque, en español o inglés." |
| 44–51 | Session complete → Progress (trends, muscles) | "Finish and see today's performance. Over weeks, see trends and sets per muscle." **[PT]** | "Termina y mira tu rendimiento de hoy. Con las semanas, verás tendencias y series por músculo." |
| 51–56 | Next week preview / next session | "Next time, it starts from where you left off." | "La próxima vez empieza donde lo dejaste." |
| 56–60 | End card | "GymStudio. Train with an AI personal trainer that learns from every set. Try the demo." | "GymStudio. Entrena con un entrenador personal con IA que aprende de cada serie. Prueba la demo." |

Filming notes: film only the PO (or people who signed a release); no other gym members, gym logos or TV screens
in shot; ask the gym for permission to film **[PO]**. No before/after bodies.

### Captions and hashtags (reuse across videos)

- EN: "Stop guessing your weights. GymStudio sets today's load from your last sets and tells you why. Free beta — link in bio."
  `#GymStudio #AIPersonalTrainer #ProgressiveOverload #WorkoutTracker #GymTok #StrengthTraining`
- ES: "Deja de adivinar tus pesos. GymStudio ajusta el peso de hoy según tus últimas series y te dice por qué. Beta gratis — link en la bio."
  `#GymStudio #EntrenadorIA #SobrecargaProgresiva #RutinaGym #Gimnasio #Entrenamiento`

---

## 7. Launch offer and pricing (consistent with the rollout doc)

| Phase | What users pay | Offer |
|---|---|---|
| 0 Friends beta | Free | Thank-you: **12 months of Pro free** when Pro exists (rollout doc asked lifetime vs 12 months **[PO]**) |
| 1 Open beta | Free | **Founding member**: join the waitlist/beta before launch → first year of Pro at **$29.99** (≈40% off $49.99) **[PO]** |
| 2 App Store | Freemium | Free: logging, history, exercise library, one starter plan, basic progress. **GymStudio Pro: $7.99/mo or $49.99/yr**, 7-day free trial on annual; AI Trainer loads + reasons, all plans/personal plan, Progress v3 insights, Ask AI. Regional pricing for LatAm via App Store tiers **[PO]** |

Notes: the paywall is **not built** — Pro copy can't appear in any store asset until it exists **[TL]**. Subscription
copy must show price, period, auto-renewal and how to cancel. Apple Small Business Program (15%) — PO enrols.
Open question for PO: putting the AI Trainer behind Pro is the strongest monetisation but also hides the core
value from free users; alternative = free users get the AI Trainer on 1 plan, Pro unlocks all plans + insights.

---

## 8. App Store listing draft (Phase 2)

Character limits: name 30, subtitle 30, keywords 100 (comma-separated, no spaces needed), promotional text 170.
Check name availability in App Store Connect **[PO]**. Category: Health & Fitness.

| Field | EN (US) | ES (Mexico / Spain) |
|---|---|---|
| **Name** (30) | GymStudio: AI Personal Trainer | GymStudio: Entrenador IA |
| **Subtitle** (30) | Plan, log sets, smart weights | Tu plan y pesos que se ajustan |
| **Keywords** (100) | workout,planner,log,tracker,progressive,overload,strength,routine,lifting,weights,coach,sets,reps | rutina,gimnasio,entrenamiento,pesas,fuerza,registro,series,coach,progreso,plan,gym,hipertrofia,reps |
| **Promotional text** (170) | Know what to lift today. GymStudio sets each exercise's weight from your last sets, using rules written by a personal trainer, and tells you why. | Sabe qué levantar hoy. GymStudio ajusta el peso de cada ejercicio según tus últimas series, con reglas de un entrenador personal, y te dice por qué. |

**Description (EN)**
> Stop guessing your weights. GymStudio is a training app with an AI Personal Trainer that learns from every set.
>
> KNOW WHAT TO LIFT TODAY
> Every exercise shows today's weight and reps, calculated from your last sessions with rules written by a personal trainer. Tap to see why: "Last time you reached the top of the 8-rep target at 40 kg, so I moved the load up."
>
> A REAL PLAN
> Answer a few questions and get a 6-week plan for 3 to 6 days a week, at the gym or with dumbbells. Your week is one bar, so you always know what's next.
>
> FAST IN THE GYM
> • Big, one-hand set logger with your last time next to it
> • Hints between sets when you beat your target
> • Supersets logged round by round
> • Rest timer
> • Technique cues and posture tips for every exercise
>
> SEE YOUR PROGRESS
> Session summary with personal records, strength trends, weekly sets per muscle and consistency.
>
> IN ENGLISH OR SPANISH
> Switch language any time. Works offline; sign in with Google to sync.
>
> GymStudio does not give medical advice. Check with a health professional before starting a new training program.
> [Subscription terms block — add only when Pro exists: price, period, auto-renew, cancel in Settings, Terms + Privacy links.]

**Description (ES)**
> Deja de adivinar tus pesos. GymStudio es una app de entrenamiento con un entrenador personal con IA que aprende de cada serie.
>
> SABE QUÉ LEVANTAR HOY
> Cada ejercicio muestra el peso y las repeticiones de hoy, calculados a partir de tus últimas sesiones con reglas escritas por un entrenador personal. Toca para ver por qué: "La última vez alcanzaste el máximo del objetivo de 8 repeticiones con 40 kg, así que subí el peso."
>
> UN PLAN DE VERDAD
> Responde unas preguntas y recibe un plan de 6 semanas de 3 a 6 días por semana, en el gimnasio o con mancuernas. Tu semana es una barra: siempre sabes qué sigue.
>
> RÁPIDA EN EL GIMNASIO
> • Registro grande, con una mano, junto a tu última vez
> • Sugerencias entre series cuando superas el objetivo
> • Superseries por rondas
> • Temporizador de descanso
> • Técnica y consejos de postura para cada ejercicio
>
> MIRA TU PROGRESO
> Resumen de la sesión con récords personales, tendencias de fuerza, series semanales por músculo y constancia.
>
> EN ESPAÑOL O INGLÉS
> Cambia de idioma cuando quieras. Funciona sin conexión; inicia sesión con Google para sincronizar.
>
> GymStudio no ofrece consejo médico. Consulta a un profesional de la salud antes de empezar un nuevo programa de entrenamiento.

**Screenshot list** (6.7"/6.9" iPhone, 1290×2796; mockups in `2026-10-18-app-store-screenshots.html`)

| # | Screen | Caption EN | Caption ES |
|---|---|---|---|
| 1 | Workout mode, "Today: 42.5 kg × 8" | Know what to lift today | Sabe qué levantar hoy |
| 2 | Cue sheet with TODAY reason + LAST TIME | Every weight comes with a why | Cada peso viene con su porqué |
| 3 | Set logged + "consider 45 kg" hint | Learns from every set | Aprende de cada serie |
| 4 | Superset Round 1 of 3 + rest timer | Supersets, round by round | Superseries, ronda a ronda |
| 5 | Today: 6-week plan + weekly bar | Your 6-week plan, week by week | Tu plan de 6 semanas, semana a semana |
| 6 | Progress: weekly sets by muscle + trend tiles | See every muscle's week | Mira la semana de cada músculo |

Also needed **[PO][TL]**: app icon (brand decision), privacy policy URL, support URL, App Privacy "nutrition
label" (Google sign-in, workout history, AI questions sent to the model provider), age rating, review notes with a demo path.

---

## 9. Landing page outline (single page, EN/ES, built by Tech Lead as an issue)

1. **Hero:** headline "Know what to lift today." / "Sabe qué levantar hoy."; sub "An AI Personal Trainer that learns
   from every set — and tells you why."; buttons **Try the demo** (`?demo=1`) + **Join the beta** (waitlist form);
   15 s promo loop (muted, captioned) in a phone frame.
2. **How it works (3 steps):** Get your 6-week plan → Train with today's weight + why → Watch your progress.
3. **Feature strip:** Why for every weight · Set hints · Supersets by rounds · Rest timer · Technique cues · EN/ES.
4. **Trust:** "Rules written by a personal trainer" (name/credentials only if verified and approved **[PT][PO]**);
   "Never 0 kg, never a big jump" guardrails **[TL]**; privacy in one paragraph.
5. **Pricing:** "Free during beta" (Phase 1) → Free vs Pro table (Phase 2, when built).
6. **FAQ:** Android? (not yet) · Works offline? · Is my data private? · Is this medical advice? (no) · Spanish? (yes).
7. **Footer:** privacy policy, terms, contact email (PO's), language toggle.
Tracking: only privacy-friendly page analytics (e.g. Plausible/Cloudflare Web Analytics, no cookies) and UTM
links per channel; cookie banner not needed if no cookies **[TL][PO]**. Waitlist stores email only, with consent text.

---

## 10. KPIs and weekly reporting

**North-star:** weekly active trainers (users who log ≥1 workout in the week).

| Funnel stage | KPI | Phase 0 target | Phase 1 target | Phase 2 target (assumption) |
|---|---|---|---|---|
| Awareness | Reach / views per week (IG+TikTok+Shorts) | — | 10k | 50k |
| Interest | Link clicks → landing; landing → demo or waitlist conversion | — | 300 clicks; 25% | 1,500 clicks; 20% |
| Acquisition | New sign-ups / installs per week | 5–15 total | 15–40 | 75–250 |
| Activation | % logging a first workout within 7 days | ≥70% | ≥50% | ≥40% |
| Retention | Week-1 / week-4 retention | ≥80% / ≥50% | ≥50% / ≥30% | ≥40% / ≥25% |
| Engagement | Workouts per active user per week | ≥2.5 | ≥2.5 | ≥2.5 |
| Trust | % of sessions where the recommended load was used (needs read-only count **[TL]**) | track | ≥70% | ≥70% |
| Satisfaction | NPS week 4 | ≥30 | ≥30 | ≥40 |
| Revenue | Trial start rate, trial→paid | — | WTP survey | 4% install→paid by month 2 |
| Quality | Crash-free sessions | — | ≥99% | ≥99.5% |

Every target is an assumption to be replaced by beta data.

**Weekly report template (copy into a doc every Monday)**

```
GymStudio weekly marketing report — week N (dd Mon – dd Mon)
Phase: 0 / 1 / 2        Prepared by: Socialer (draft)   Reviewed by: PO

1. Headline (1 sentence): …
2. Funnel
   Views:  IG __  TikTok __  Shorts __      Link clicks: __   Landing→waitlist/demo: __%
   New users: __   Activated (first workout ≤7 d): __%   Weekly active trainers: __ (Δ __ vs last week)
   W1 retention: __%   W4 retention: __%   Workouts / active user: __
3. Content
   Posts published: __ (list)   Best post: __ (views, saves, link clicks)   Worst post: __
   What we learned: …
4. Beta feedback (top 3 themes, anonymised): …
5. Product issues raised to Tech Lead (issue links): …
6. Claims / approvals pending: PT __  PO __
7. Spend this week: $__ (by channel)   Cumulative: $__
8. Next week: 3 priorities
```

---

## 11. Budget options (assumptions, monthly, USD)

| Item | 0 budget | Low (~$150–300/mo) | Medium (~$800–1,500/mo) |
|---|---|---|---|
| Fixed: Apple Developer Program | $99/yr (needed for TestFlight/App Store in any option) | same | same |
| Music | Platform free libraries (TikTok CML, Meta Sound Collection, YouTube Audio Library) | Artlist or Epidemic personal/creator plan (~$10–20/mo) | Business licence if running ads (~$30–50/mo) |
| Video editing | CapCut / iMovie free, screen recording of prototypes | CapCut Pro / similar (~$10/mo) | Freelance editor 4–8 shorts/mo ($200–500) |
| Landing page | GitHub Pages (free) | Custom domain (~$12/yr) + email (~$6/mo) | same + privacy-friendly analytics (~$9/mo) |
| Waitlist / forms | Google Forms / Tally free | Tally Pro (~$29/mo) optional | same |
| Creators | Friends who train (no payment; disclose as #ad if any perk) | 2–3 micro-creators gifted Pro + small fee ($50–100 each) with written brief, #ad disclosure | 5–8 micro-creators ($100–250 each), ES + EN |
| Paid ads | none | none before App Store | Phase 2 only: $300–800 boosting best organic posts (Spark Ads / Boosted Reels) |
| Gym partnerships | Free beta access, printed flyer (~$20) | Flyers/posters + small event ($50–100) | Branded gym event or class sponsorship ($200–400) |

Recommendation: **0 budget through Phase 1** (learn what message works organically), **Low** at App Store prep,
**Medium** only after week-4 retention ≥30% (paying to acquire users who leave is waste). All prices are
estimates to verify **[PO]**.

---

## 12. Legal and claims checklist (every asset, before the PO approves it)

- [ ] Feature shown exists in the live app or is labelled "coming" (§0 table) **[TL]**
- [ ] Every load, rep, progress or "learns" example is PT-approved and comes from demo or consented data **[PT]**
- [ ] No medical, injury-prevention, rehab, weight-loss, body-transformation or "guaranteed results" claims; no before/after bodies
- [ ] "AI" claims are accurate: rules decide, AI explains; no "knows your body" or "medical-grade"
- [ ] No fake reviews, ratings, user counts, press logos or "#1" claims; testimonials only with written consent
- [ ] Comparisons with competitors are factual and verifiable on the date of posting, or left out
- [ ] Music/stock/fonts licensed for commercial use; licence saved by the PO
- [ ] People in footage signed a release; gym gave permission to film; no third-party logos
- [ ] Creator/influencer posts disclose the relationship (#ad / "colaboración pagada"); perks count as payment
- [ ] Prices, trial and auto-renewal stated wherever Pro is mentioned; only once Pro exists
- [ ] Privacy policy + terms live and linked before collecting emails (waitlist) or launching on the App Store; App Privacy label accurate
- [ ] Waitlist/emails: explicit consent, unsubscribe, store minimal data (GDPR for EU friends, Ley Federal de Protección de Datos for MX, Habeas Data for CO **[PO]** confirm markets)
- [ ] App Store screenshots show the real app UI (Apple rejects misleading screenshots)
- [ ] Health disclaimer in store description and landing page FAQ
- [ ] Trademark: check "GymStudio"/"Gym Studio" name availability in App Store and basic trademark search before spending on brand **[PO]**

---

## 13. What the PO must do (checklist)

**Accounts (your login; Socialer never creates accounts)**
- [ ] Reserve handles: Instagram, TikTok, YouTube (try `@gymstudio.app` / `@gymstudioapp`; decide one) — business/creator accounts
- [ ] Apple Developer Program ($99/yr) if not done; enrol in the App Store Small Business Program
- [ ] App Store Connect app record (reserves the name) — confirm the name with Tech Lead
- [ ] Contact email for the app (e.g. a dedicated Gmail) for support URL and store listing
- [ ] Optional: domain for the landing page; Tally/Google Forms for the waitlist and beta feedback
- [ ] Music licence choice (free platform libraries vs paid)

**Approvals (reply in chat; items are numbered so you can answer "1 yes, 2 no…")**
1. Positioning line and the 6 pillars (§1), including the "AI" honesty rule
2. Personas A–E and channel priorities (§2–3)
3. Week 1 start date (proposed Mon 26 Oct) and the 12-week calendar (§4)
4. The 20 post ideas — which 6 to produce first (§5)
5. The three scripts and the two prototypes (§6) — voiceover yes/no and whose voice
6. Pricing + launch offer: beta thank-you (12 months vs lifetime), founding price $29.99, Pro $7.99/$49.99, what's free (§7)
7. App Store name, subtitle, keywords, descriptions, 6 screenshots (§8)
8. Landing page go-ahead (Tech Lead issue) (§9)
9. Budget level per phase (§11)
10. Brand: "GymStudio" vs "GYM STUDIO" spelling; logo/icon direction (UXer brand round 2)
11. Richer demo data for marketing screenshots (Tech Lead issue) or recreations only
12. Which language leads each platform (EN, ES, or two posts)

**Things only you can do later:** pick the friends-beta list, send invites, post every piece of content, talk to
gym owners, sign up creators, buy anything, submit to the App Store.

---

## 14. Claims needing PT approval (collected)

| Claim / example | Where | Owner |
|---|---|---|
| "AI Personal Trainer that learns from every set" (tagline) and "rules written by a personal trainer" | Everywhere | PT + PO |
| T-bar row: last 40×11·8·8 → "Today: 42.5 kg × 8", reason "reached the top of the 8-rep target at 40 kg, so I moved the load up" | 15 s, 30 s, screenshots 1–2 | PT + TL (taken from the live demo) |
| Set hint: 42.5 kg × 11 (target 8) → "consider 45 kg" (+3 reps over top, 2.5 kg plate-loaded step) | 15 s, 30 s, screenshot 3 | PT + TL |
| Superset: C1 14 kg × 11, C2 35.5 kg × 10, rest ~10 s between | 30 s, screenshot 4 | PT |
| Session summary rows and "Weight PR" example | 30 s | PT |
| Weekly sets by muscle, common range 10–20; trend tiles (+6.6% main-lift e1RM, 25% beat last time — demo-style values) | 30 s, screenshot 6, post 14 | PT |
| "Never 0 kg / never a big jump" guardrail wording | Landing, post 7 | PT + TL |
| "Long break → lighter load", "hold when below target" | Posts 5–6 | PT |
| "Projected from your current performance" next-week preview | Post 16, 60 s | PT |

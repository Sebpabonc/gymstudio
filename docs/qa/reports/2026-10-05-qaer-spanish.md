# QAer report — 2026-10-05 (Spanish / ES pass)
Build: 1ba3ee2 · Live: https://sebpabonc.github.io/gymstudio/?demo=1 · Viewports: 390x844 (main pass) / 768x1024 / pane width (~534 px, overflow check only)

Scope: PO request "make sure everything is properly in Spanish". The EN | ES toggle was set to ES and every
screen was walked in demo mode (never signed in). Text was read with `innerText` / ARIA attributes; layout
was checked for clipped text and horizontal overflow. The source (`src/i18n/`) was read only to locate root
causes.

## Summary
| Area | Result | Notes |
|---|---|---|
| Header, dock, welcome card | ✅ | All Spanish incl. aria labels (Idioma, Diseño de tarjetas/hoja, Navegación principal). |
| Today — block card, About this block, Change block (9 blocks) | ⚠️ | Texts translated; "Coach" badge, "drop sets" in names, Title Case chips. |
| Today — D1–D6, all cards opened | ⚠️ | Names, details, PT notes, "Aprieta" cues, set table all Spanish. Muscle chips English (expected). "Drop Set"/"Drop" English; "Serie" header overflows at 390 px. |
| Today — logging, toasts, Undo, superset rounds, rest timer | ✅ | "Ingresa al menos una serie", "Registrado: … · 1 serie", "Deshacer", "Registrar rondas", "Terminar superserie", "+15 s / Omitir" all Spanish. |
| Exercises — search, chips, card, Track it as you go, confirmation | ❌ | Log confirmation toast English ("2 sets · top"); suggestion meta English ("Legs · Quads"); Spanish muscle/region words not searchable; squeeze label differs from Today. |
| Exercises — Create your own day | ⚠️ | Field label "Tip" English. |
| Progress | ⚠️ | Spanish overall; "PR" terms mixed, "1 hechas" agreement, decimal points, "Isquios" vs "Isquiotibiales". |
| You — demo panel, sign-in screen (after Exit demo) | ⚠️ | Spanish; but exiting demo switches the app back to English (language stored per mode). |
| EN regression + persistence | ✅ | Switching back to EN renders English everywhere checked; choice persists after reload. |
| Layout with longer Spanish strings | ⚠️ | No page-level horizontal overflow at 390/768; one clipped header ("Serie"). |

P1: 0 · P2: 3 · P3: 13 · Tracking issue: #166 (one issue with the full table, per PO request)

## Findings

### [P2] F1 — Exercises: log confirmation toast is English
- Where: Exercises tab → any exercise → Regístralo sobre la marcha → Registrar ejercicio (390 px, ES)
- Steps: 1. Switch to ES. 2. Exercises → pick "Curl bayesiano en polea". 3. Enter 12.5 kg × 12 on set 1, tap Registrar ejercicio.
- Expected: "Registrado · 2 series · mejor 12.5 kg"
- Actual: "Registrado · 2 sets · top 12.5 kg"
- Root cause (read-only): `src/App.tsx:304` calls `summarizeCompletedEntry(nextEntry)` without the `language` argument, so it defaults to `'en'`. (The Today card path in `WorkoutPlan.tsx:1852` passes `language` and is correct.)

### [P2] F2 — Exercises: search suggestion subtitles show English region + muscle
- Where: Exercises → search box suggestions (ES)
- Steps: type "sentadilla".
- Expected: "Piernas · Cuádriceps · Glúteos" (region chips above already say Piernas/Espalda/Pecho…)
- Actual: "Legs · Quads · Glutes", "Back · Lats", "Chest · Upper Chest", "Arms · Biceps", "Core · Abs"
- Root cause: `getExerciseSubtitle` in `src/utils/exerciseFilters.ts` joins raw `bodyRegion` + English muscle names. The region part is UI and already has Spanish labels; the muscle part falls under the "muscle names" leftover below.

### [P2] F3 — Exercises: searching Spanish muscle/region words finds nothing
- Where: Exercises → search (ES)
- Steps: search "espalda", "glúteos", "dorsales", "abdomen", "pantorrillas", "gemelos".
- Expected: matching exercises (as "back", "glutes", "lats", "abs", "calves" do in English).
- Actual: "No se encontraron ejercicios." for all of them. "pecho" only finds exercises with "pecho" in the name (e.g. Jalón al pecho), not chest exercises. Spanish exercise names and English terms ("squat", "lat pulldown", "calves") work.
- Root cause: `filterExercises` searches `name`, `nameEs`, English muscles and equipment only. There are no Spanish muscle/region terms to search.

### [P3] F4 — Drop-set labels are English
- Where: Today, any drop-set exercise (e.g. Block 9 D1 B1 "Press de pecho en máquina") and block names in Change block.
- Actual: chip "Drop Set", row label "Drop", aria "Peso drop de la serie 1…", block names "… + drop sets II".
- Suggested: "Serie descendente" / row "Descarga" (or keep "drop set" as accepted gym jargon, but then lowercase and use it the same way everywhere). Needs a PO decision.

### [P3] F5 — "Coach" origin badge and legend are English
- Where: Today block card, Change block sheet.
- Actual: badge "Coach"; legend "Coach = Diseñado por tu coach · PT = Diseñado por el PT".
- Suggested: "Entrenador" / "Entrenador = Diseñado por tu entrenador". "PT" can stay or become "EP" (entrenador personal); PO decision.

### [P3] F6 — Create your own day: field label "Tip"
- Where: Exercises → Crear un día propio → Manual form.
- Suggested: "Consejo".

### [P3] F7 — Squeeze cue label differs between screens
- Where: Today cards say "Aprieta — …"; the Exercises card says "Contracción — …".
- Suggested: use one term in both places ("Aprieta" matches the PO's wording).

### [P3] F8 — "abs" in day focus lines
- Where: Today D1/D4: "Pecho, espalda y abs · pesado / volumen".
- Suggested: "Pecho, espalda y abdomen · pesado".

### [P3] F9 — PR wording is mixed English/Spanish
- Where: Progress headline "Esta semana: 1 de 6 sesiones · 0 PR · en ritmo"; Personal records badges "PR 1RM", "PR reps", "PR peso"; toasts "Nuevo PR de e1RM".
- Suggested: choose one form. Either keep "PR" (common in Spanish gyms) and write "PR de 1RM", "PR de reps", or use "Récord". Also "e1RM" in the toast vs "1RM est." elsewhere.

### [P3] F10 — Weekly sets by muscle: agreement and term consistency
- "1 hechas / 22 planeadas" → "1 hecha / 22 planeadas" (singular).
- "Isquios" while every other place says "isquiotibiales" → "Isquiotibiales".
- "Hombros (lateral y posterior)" next to "Deltoide frontal" → "Deltoide lateral y posterior".
- Aria: "Espalda: 1 series hechas" → "1 serie hecha".

### [P3] F11 — Decimal separator uses a point
- Where: Progress "2.5 hechas", "82.5 kg"; Exercises "12.5 kg"; block texts "2.5-3 minutos", "1-2.5 kg".
- Suggested: format numbers with the Spanish locale ("2,5", "82,5 kg"), or accept the point as a product decision (common in Latin America). Inputs can stay as they are.

### [P3] F12 — Set table header "Serie" overflows into "Anterior" at phone width
- Where: Today → any expanded exercise card, 390 px, ES.
- Actual: the "Serie" header (21 px of text in a 14 px column) runs into "Anterior" and reads "SerieAnterior". English "Set" fits (14/14 px). The Exercises screen table is fine (28 px column).
- Suggested: widen the first column, or use "#"/"N.º" as the header.

### [P3] F13 — Title Case on Spanish labels
- Technique chips show "Series Rectas", "Pirámide Inversa", "Drop Set" because of `text-transform: capitalize` on `.technique-chip`. The source strings are already sentence case ("Series rectas").
- Day names "Pecho y Espalda A", "Hombros y Brazos A" use Title Case, while focus lines and block texts use sentence case.
- Suggested: no capitalize transform for ES (or none at all); "Pecho y espalda A".

### [P3] F14 — Awkward or unnatural Spanish
| Screen | Current | Suggested |
|---|---|---|
| Progress headline | "en ritmo" | "al día" / "vas al ritmo" |
| Plan meta line | "150 s descanso" | "150 s de descanso" |
| Block name / chip | "Series rectas" (literal "straight sets") | "Series fijas" (or keep; PO decision) |
| Welcome card | "Sigue un plan…" / "Sigue tus entrenamientos…" (same verb twice) | 3rd line: "Lleva el control de tus entrenamientos y tu progreso." |
| Create day | "Aún no agregas ejercicios." | "Aún no has agregado ejercicios." |
| AI buttons | "Inicia sesión para usar IA" / "Preguntar a IA" vs "Inicia sesión para usar la IA" | Use "la IA" everywhere |
| Block descriptions | "pirámides inversas … más drop sets" ("más" reads as "more") | "… y drop sets" / "además de drop sets" |
| Progress section toggles | aria "Cerrar Sugerencias" (cards use "Contraer …") | "Contraer Sugerencias" |

### [P3] F15 — Gender/number agreement of detail words
- Detail words are shared masculine singular forms: "Aperturas con mancuernas (inclinado)", "Elevaciones laterales con mancuernas (sentado)", "Aperturas con mancuernas (declinado)", while "Flexiones (declinadas)" agrees.
- Suggested: agree with the noun ("inclinadas", "sentado" → "sentado/a" is fine for the person; "(banco inclinado)" avoids the problem).

### [P3] F16 — Catalogue naming inconsistencies (ES names)
- "Curl con barra Z" / "Curl predicador con barra Z" vs "Pullover con barra EZ" → pick one ("barra Z").
- "Jalón al pecho en polea (agarre ancho)" and "Jalón en polea al pecho (agarre ancho)" both exist (two different ids) → align word order if they are different exercises, or check for a duplicate.
- "Abdominales (banco declinado)" vs "Crunch abdominal (banco declinado)".

### [P3] F17 — Language choice is not shared between demo and your own data
- Steps: 1. In demo, choose ES. 2. You → "Salir de la demo".
- Expected: the app stays in Spanish (a language is a device preference).
- Actual: the app switches back to English. Demo uses `gym-studio.demo.language`, normal mode uses `gym-studio.language`. Choosing ES again in normal mode works and persists. Product decision whether this is intended.

### Minor accessibility-text notes (not separate findings)
- Superset rows say "Ronda 1" visually but aria says "Marcar serie 1 de la superserie…".
- Set table aria uses "Bajar peso…" / "Reps de la serie 1" on Today and "Disminuir: Peso…" / "Repeticiones de la serie 1" on Exercises.

### Not verified (code observation only)
- Sign-in errors: `src/auth/AuthProvider.tsx` `resultError` passes the Supabase `error.message` through, which is English (e.g. "Invalid login credentials"). Not triggered because QAer does not sign in.

## Expected English leftovers (not bugs unless the PO wants them translated)
- Muscle chips and muscle lists: Upper Chest, Chest, Lats, Upper Back, Front/Side/Rear Delts, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Abs, Forearms, Lower Back (Today chips and Exercises "MÚSCULOS PRINCIPALES/SECUNDARIOS").
- Detail word "pec deck" (Aperturas inversas en máquina).
- Accepted gym words: "Core" (region chip and weekly-sets group), "Reps", "kg", "1RM", "PT", "Smith", "Hip thrust", "Face pull", "Swing", "Burpee", "Thruster", D1–D6, B2–B4.
- Language toggle labels "English" / "Español" (correct as is).

## Passed checks
- Header, tagline ("ENTRENA CON INTENCIÓN"), layout pill, sync aria ("Datos de demostración"), dock labels (Hoy, Ejercicios, Progreso, Tú) and `html lang="es"`.
- Block card: dates ("5 oct – 15 nov 2026"), method, summary, About this block (Objetivo, Cómo funciona, Días A vs. días B, …, Consejos clave) fully Spanish; "pantorrillas" and "superserie" used consistently (no "gemelos"/"superset" in ES).
- Change block: all 9 blocks with Spanish names, dates, descriptions and status (Completado / Actual / Próximo).
- D1–D6 tab aria labels, day names and focus lines; every exercise card on block 6 D1–D6 opened: Spanish name + detail, PT note, "Aprieta" cue, "Igual que la serie 1", set table, "Registrar ejercicio", "Ingresa al menos una serie", "Hecho · 11:00 a.m. · 1 serie · mejor 20 kg", toast "Registrado: … · 1 serie" + "Deshacer". Posture tips (5, Spanish) checked on A1 Press de banca con mancuernas and on Curl bayesiano en polea.
- Superset panel: "Registrar rondas", "0/3 rondas", "Copiar pesos de la ronda 1 a todas", "Ronda N", "Terminar superserie"; rest timer pill "+15 s" / "Omitir" with aria "Pausar temporizador de descanso".
- Exercises: region chips, placeholder "Press de banca, sentadilla, remo...", empty state "No se encontraron ejercicios.", card sections (Último máx., Último volumen, Rendimiento anterior, Regístralo sobre la marcha, + Agregar serie, Notas, Progreso, Ver progreso completo), all library names in the Create-day picker are Spanish.
- Progress: section titles, empty states, strength-trend takeaways ("la primera sesión marca tu base", "No está en el Bloque 6 · última tendencia +22% en el Bloque 4"), A/B/Todos, chart title, PR tooltips, weekly sets legend and status, block report card.
- You: demo panel ("Modo demo", "Salir de la demo"); sign-in screen (Bienvenido de nuevo, Nota de privacidad, Iniciar sesión / Crear cuenta, Correo electrónico, Contraseña, Mostrar, ¿Olvidaste tu contraseña?, Continuar con Google).
- EN regression: switching back to EN shows English everywhere checked, and EN stays after reload.
- No page-level horizontal overflow at 390 px or 768 px with Spanish strings. The region chip row scrolls sideways by design.
- Demo isolation: picking a block in demo writes `gym-studio.demo.active-block-id` only. The real `gym-studio.active-block-id` was unchanged.

## Test hygiene
Demo data only. Block choice was restored to the date-based block, the demo language was set back to EN, and
the `gym-studio.language` key created during the sign-in-screen check was removed.

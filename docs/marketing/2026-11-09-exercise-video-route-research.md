# Exercise technique videos: which production route (research, 2026-11-09)

Owner: Socialer. Status: **draft for the PO**. Nothing was bought, signed up for, generated or published.
Context: `docs/marketing/exercise-videos.md` (routes A-D), `docs/marketing/exercise-video-prompts.md`, the Kling and
Google Flow tests of 2026-11-07/08, and the clip spec in issue #442 (5 s, 1:1 or 16:10, one rep, side view, silent
loop, about 1.6 MB H.264).

## Scope in numbers
- Catalogue: **227 exercises** (`docs/fitness/approved/catalogue-v2/*.json`), not 170.
- Current block (`block-2026-10-05-hypertrophy-flat-pyramid-ii`): **20 exercises**.
- Next block (`block-2026-11-16-strength-hypertrophy-ii`, starts in one week): **19 exercises**, 3 shared with the
  current block, so **36 different exercises** cover the next ~3 months of the plan.
- All 9 blocks together use about 113 exercises. The rest of the catalogue (about 114) is the long tail.

## What our own tests already showed
| Test | Result | Lesson |
|---|---|---|
| Kling text/image-to-video, 20 exercises, up to 2 takes | **8 of 20 usable (40%)** | When the AI invents the motion it adds a second rep, swaps uncommon machines (rear-delt fly to chest fly, chest-supported row to press, T-bar to sled, leg curl to leg extension), raises lateral raises too high, adds watches, tattoos and text |
| Google Flow / Veo, incline curl, 2 takes | 0 of 2 | Ignored camera angle, grip and "no watch" |
| Kling **Motion Control from a real clip** (lat pulldown) | Worked first try | When the motion and the machine come from real footage, the AI only has to change the person |

The failures are all the AI *inventing* the movement or the machine. The one success started from **real
footage**. So the question is how to get real footage of our exact exercises, and whether to restyle it.

## Research findings

### 1. AI video in 2026: motion transfer beats prompting
- **Kling Motion Control** (VIDEO 3.0) copies the motion of a reference video onto a character image. Third-party
  pricing pages quote 6-9 credits/s at 720p and 8-12 credits/s at 1080p (sources disagree), so 30-60 credits per 5 s
  clip; we paid 45. Plans quoted at about US$7-10/month for 660 credits (Standard), about US$37 for 3,000 (Pro),
  about US$92 for 8,000 (Premier); credits expire monthly. Paid tiers are described as allowing commercial use; free
  output is not, and free clips do not become commercial after upgrading. Kling gives no indemnity, so likeness and
  infringement risk stays with us. [1][2][3][4]
- **Runway**: Act-Two transfers a performance from a driving video to a character (about 5 credits/s); Aleph edits an
  existing video (change person, clothes, background) at about 28 credits/s, or US$0.28/s by API, about US$1.40 per
  5 s clip. Plans from about US$15/month (625 credits). Third-party sources say commercial use is allowed on paid tiers;
  confirm in Runway's terms. [5][6]
- **Wan 2.2 Animate** (Alibaba, open weights, reported Apache 2.0): "replacement" mode swaps the person in a real video
  for a character image and keeps the motion, lighting and colour; the authors claim it beats VACE and commercial
  tools. It needs a strong GPU or a pay-per-use host (WaveSpeed, Runware). The licence covers the model, not the
  likeness of the person in the clip. [7][8]
- **Luma Ray3 Modify**: video-to-video that keeps the original performance and swaps wardrobe, environment, or the
  actor's look, with character references; up to about 18 s. No verified 2026 price found. [9][10]
- **Veo / Google Flow**: tested ourselves, did not follow instructions; Veo 3.1 leaves Flow on 5 Dec 2026.
  **Sora**: not tested or researched here.

Conclusion: in 2026 the reliable AI tools all **start from a real video**. Plain text- or image-to-video should not
be used for technique clips. It is still fine for marketing B-roll, where exact technique matters less.

### 2. Filming once (Sebas or a trainer)
- Gear: the phone Sebas already has, a tripod or clamp (about US$20-40 if he has none), the gym's own lighting.
- Effort (Socialer estimate): about 5-8 minutes per exercise (set the machine, 2-3 takes of one rep), so **20-25
  exercises in a 2.5-3 hour session**, off-peak so no other members are in frame.
- Rights: if Sebas films himself, the footage is his. If a trainer or friend appears, they sign a **model release**
  that names the app, App Store listing, social media, worldwide, no end date, and **AI editing of their likeness**.
  The gym may need to give permission to film (a location release), and gym membership terms rarely cover a
  third-party app. [11][12] Governancer can draft both forms; Sebas gets them signed.
- Optional AI restyle on top of the real footage: replace the person with the PT character (privacy, one consistent
  coach) with our working Kling recipe, or clean up the background (Aleph or Luma Modify). Because motion and machine
  come from the real clip, the main failures from our test should go away. What is left are cosmetic faults (hands
  through handles, a watch coming back), and there is always the raw clip to fall back on.

### 3. Licensed 3D or animated libraries
| Source | What it offers | Price found | Fit for a paid iOS app |
|---|---|---|---|
| **Gymvisual** | Large 3D image and animation catalogue | No public price (site blocks automated reading); ask for a quote | Probably the closest match to our machines; buy only from Gymvisual itself. A May 2026 Reddit post says a reseller (gym-animations.com) sold copied Gymvisual GIFs and a developer then got a legal notice [13] |
| **MoveKit** | 3D exercise clips, packs, white-label bundles | From US$1.99 per clip, US$5-99 packs (aggregator listing, unconfirmed) [14] | Commercial licence for paid apps (vendor claim) |
| **Exercise Animatic** | Animated exercise video bundles, aimed at apps | No public price found; customer reviews praise value and correct motion [15] | Licence terms not published; ask |
| **Fiverr / Upwork packs** | Ready packs of 100-400 3D clips, or custom animations | US$95 for 100, US$195 for 130 (bodyweight), custom from US$35 per tier [16][17] | Non-exclusive app licences; packs are mostly bodyweight and common lifts |
| **Hyperhuman** | Licensed fitness video via API plans | No price shown [18] | Commercial use within API plans |
| **ExerciseDB** | 11,000+ exercises, GIFs/videos via RapidAPI or a Gumroad one-off | Not published; Gumroad seller's link to the project unconfirmed [19] | Licence unclear; not recommended without written terms |
| **MuscleWiki** | Real filmed videos via API | Dashboard pricing | **Not usable**: Jan 2026 terms forbid storing or re-hosting videos and posting them on social media; a commercial licence needs written permission [20] |

Coverage risk: our plan relies on gym-specific machines (plate-loaded pendulum squat, chest-supported T-bar row,
reverse pec deck, plate-loaded lat pulldown and low row, single-leg seated leg curl). Off-the-shelf libraries
usually have a generic version or none at all. A 3D library also looks different from real footage, so mixing the
two in one app looks inconsistent.

## Comparison
Costs are US$. The "PT reject" column is **measured** for text/image-to-video and a **Socialer estimate**
everywhere else, to be checked in the pilot.

| Route | First 20 clips: cost | Time to first 20 | Full 227 | Consistency | PT reject risk |
|---|---|---|---|---|---|
| A1. AI text/image-to-video (what we tested) | about US$37 (Pro month), 2 takes each | 1-2 weeks of retries | Months; about 60% need another route anyway | Medium (character drifts, props appear) | **60% measured** |
| A2. AI Motion Control from someone else's clip | about US$37 | 1 week | Limited by which reference clips we are allowed to use; using other people's videos as input is a rights problem | Good | 20-30% est. |
| **C. Film once, raw clips** | **US$0-40** (tripod) | **1 session + 2-3 days for PT review and cutting** | About 9-10 sessions, for exercises his gym has | High (same person, gym, camera) | **10-20% est.**, fixed with a quick reshoot |
| **C+A. Film once, restyle with AI** | US$0-40 + about 1,400 Kling credits (one Pro month, about US$37) | Raw clips in week 1, restyled in week 2 | About 16,000 credits (about 2 Premier months, about US$185) + filming | Highest (one PT coach, clean background) | Motion 10-20% est.; cosmetic redo 20-35% est.; raw clip is the fallback |
| B. Licensed 3D library | Quote needed; packs US$95-200 | Days, if they have our machines | Possibly a few hundred US$, but gaps for plate-loaded machines | High within the library, mismatched with anything else | Low on technique; **coverage gap estimated 30-50% of our 20** (check vendor lists) |
| B2. Custom 3D freelancer | From about US$35 per tier; quote per exercise | 2-4 weeks | Expensive for 227 | High | Depends on the animator; needs reference footage anyway |
| D. Code-drawn figure | Our time only | Weeks | Slow | Basic look | Low technique risk, weak look |

## Recommendation: "film once, restyle optional, license the long tail"
1. **Film the real movement first.** Sebas (or a trainer with a signed release) films the 36 exercises of the
   current and next block in **2 sessions** at his own gym. This removes the main AI failures (wrong machine, extra
   rep, wrong range of motion) because nothing is invented, and the clips show the machines he actually trains on.
2. **The PT reviews the raw clips** (frames at start, bottom, end) before any AI work. Faults are fixed with a
   reshoot next session.
3. **Pick the look on 5 clips**: raw footage (cleaned up and colour-matched) vs the same clip restyled into the PT
   character with Kling Motion Control (our working recipe), and optionally one Wan 2.2 Animate or Runway Aleph
   comparison if Sebas opens those accounts. Choose by PT score first, look second, cost third.
4. **Long tail (about 114 exercises never in a plan):** ask Gymvisual, MoveKit and Exercise Animatic for quotes
   and their exercise lists, and decide later whether to license 3D for these or keep filming. Until then, the
   exercise sheet keeps the current text cues.
5. **Stop using text-to-video for technique clips**; keep it for marketing only.

## Pilot plan (2 weeks)
**Week 1: filming session 1 (current block, 20 exercises)**
`cable-crunch`, `cable-lat-pulldown-underhand-grip`, `cable-lateral-raise`, `cable-straight-arms-pull-downs`,
`dumbbell-bench-press`, `dumbbell-bulgarian-split-squat`, `dumbbell-curl-incline`, `ez-bb-preacher-curls`,
`high-cable-fly`, `incline-dumbbell-press`, `leg-extensions-toes-dorsiflexed-neutral`, `plate-loaded-pendulum-squat`,
`plate-loaded-t-bar-row-chest-supported`, `reverse-pec-deck-fly`, `romanian-deadlift`,
`rope-low-cable-oh-tricep-extensions`, `seated-leg-curl-toes-dorsiflexed-neutral`, `smith-machine-shoulder-press`,
`standing-calf-raises-toes-neutral`, `standing-db-lateral-raises`.

Shot rules (one page Sebas can keep on his phone):
- Phone horizontal (landscape), 1080p or 4K, 30 or 60 fps, exposure and focus locked (long-press on screen).
- Tripod at hip height, **exact 90-degree side view**, whole body and machine in frame, 1-2 m of space around.
- Plain dark t-shirt and shorts, **no watch, earrings or logos**; nobody else in frame; no screens or posters with
  text behind.
- Each take: 1 s still at the start, **exactly one rep** at a controlled tempo, 1 s still at the end (so the loop cut
  is clean). 2-3 takes. Light-to-moderate load so form stays clean. Safety arms or pins visible on Smith and bench.
- Say the exercise name to the camera before each set (it makes naming the files easy).

**Week 1, days 2-3:** Socialer cuts each take to 5 s, crops 1:1 and 16:10, extracts frames; the PT reviews every
clip. Tech Lead confirms the size target (about 1.6 MB H.264) and where the files live (#442).
**Week 2:** restyle the 5 clips Kling got wrong before (`plate-loaded-t-bar-row-chest-supported`,
`reverse-pec-deck-fly`, `seated-leg-curl-toes-dorsiflexed-neutral`, `standing-db-lateral-raises`,
`plate-loaded-pendulum-squat`) with Kling Motion Control, at about 47 credits each including the reference frame.
The PT scores raw vs restyled; Sebas picks the look.
**Before 16 Nov if possible:** filming session 2 for the 16 new exercises of the next block.

Pilot success: at least 17 of 20 raw clips approved by the PT within one reshoot, and a clear look decision.

## What the PT and PO approve
- **PT:** the technique in every clip (raw and restyled), the shot rules above (tempo, range, safety arms), and
  that the person filmed shows correct form. No new fitness claims are made in this document; the clips get no
  captions beyond the exercise name.
- **PO:** everything below.

## Decisions only Sebas can make (para Sebas)
1. **¿Quién sale en los videos?** Tú mismo (sin trámites) o un entrenador o amigo (tiene que firmar una autorización
   de imagen que incluya la app, las redes y la edición con IA; puede pedir un pago).
2. **¿Qué estilo?** Video real tal cual, el personaje "PT" hecho con IA encima del video real, o una mezcla. Lo
   decidimos después de ver 5 clips de prueba.
3. **Permiso del gimnasio** para grabar (mejor en hora valle, sin otros socios en cuadro).
4. **Compras:** un trípode si no tienes (unos US$20-40); un mes del plan Pro de Kling (unos US$37) para la prueba
   de estilo. Opcional: cuentas de Runway o de un servicio de Wan 2.2 para comparar.
5. **Pedir precios** de librerías 3D (Gymvisual, MoveKit, Exercise Animatic) para los ~114 ejercicios que no salen
   en ningún plan. Yo redacto el correo; tú lo envías.
6. **Presupuesto máximo** para la librería completa (227 ejercicios).

## Sources (all accessed 2026-11-09; most are third-party summaries, confirm with each vendor before buying)
1. thedroidguy.com, "How much does Kling AI Motion Control cost per video?" (2026): https://thedroidguy.com/how-much-does-kling-ai-motion-control-cost-per-video-1269896
2. aireiter.com, Kling Motion Control guide (2026): https://aireiter.com/de/blog/kling-motion-control-guide
3. eesel.ai, "Kling AI pricing (2026)": https://eesel.ai/blog/kling-ai-pricing ; diyai.io, Kling AI pricing 2026: https://diyai.io/ai-tools/video-generation/kling-ai-pricing/
4. Kling Terms of Paid Service (release 2026-04-21): https://kling.ai/docs/payment-policy ; bloomeria.jp, Kling commercial use: https://bloomeria.jp/blog/kling-ai-commercial-use ; clipjury, "Can you monetize Kling" (verified 2026-06-13): https://clipjury.pages.dev/can-you-monetize/kling
5. creatify.ai, "Runway pricing (2026)": https://creatify.ai/blog/runway-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay ; gptprompts.ai, Runway pricing 2026: https://gptprompts.ai/runway-pricing
6. OpenRouter, Aleph 2 listing: https://openrouter.ai/compare/bytedance/seedance-2.0-mini/runway/aleph-2
7. Wan-Animate paper (arXiv 2509.14055): https://www.emergentmind.com/papers/2509.14055
8. aifilms.ai, "Wan2.2-Animate": https://studio.aifilms.ai/blog/wan-2-2-animate ; Runware, Wan2.2 Animate: https://runware.ai/models/wan2-2-animate
9. dataconomy.com, "Luma AI brings character consistency to video with Ray3" (2025-12-18): https://dataconomy.com/2025/12/18/luma-ai-brings-character-consistency-to-video-with-ray3
10. cliprise.app, Luma Modify Ray3 guide 2026: https://www.cliprise.app/learn/guides/model-guides/luma-modify-ray3-complete-guide-2026
11. markus-hagner-photography.com, model release guide 2026: https://markus-hagner-photography.com/when-do-you-need-a-model-release-form-and-what-should-it-include/
12. filmdaft.com, model release form (2025-12-17): https://filmdaft.com/what-is-a-model-release-form-definition-uses-free-template/ ; Paperform gym video release template: https://paperform.co/templates/fitness-gym-member-photo-and-video-release-form
13. Reddit snapshot (2026-05-25), gym-animations.com and Gymvisual GIFs: https://reddit.sentinel-team.org/posts/1tnjhg2/snapshots/2026-05-25T20%3A18%3A25.2497Z
14. AlternativeTo, MoveKit: https://alternativeto.net/software/movekit/about/
15. Trustpilot, Exercise Animatic reviews: https://uk.trustpilot.com/review/exerciseanimatic.com
16. Upwork, 130 3D bodyweight library: https://www.upwork.com/services/product/video-audio-130-3d-bodyweight-home-fitness-library-for-apps-and-courses-2011048238385457234 ; 100-animation library: https://www.upwork.com/services/product/video-audio-100-workout-and-exercise-animation-library-for-apps-coaches-2011072366940827674
17. Upwork, custom 3D exercise animations: https://www.upwork.com/services/product/video-audio-premium-3d-workout-and-exercise-animations-with-anatomy-highlights-2011080495145043325 ; Fiverr 400-video pack: https://fiverr.com/lifechangerlabs/provide-a-400-video-3d-virtual-trainer-workout-routine
18. Hyperhuman, fitness content licensing: https://hyperhuman.cc/fitness-content-licensing
19. ExerciseDB v2 intro: https://exercisedb.notion.site/Table-of-Contents-1a6983b728ca80b69e85c5c74133220e ; Gumroad listing: https://exercisedb.gumroad.com/l/exercisedb
20. MuscleWiki API Terms of Use (2026-01-28 version): https://api.musclewiki.com/api-terms

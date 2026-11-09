# Exercise technique videos: one visual style, and what the tile must do at 375 px

- **Status:** UXer proposal, not approved. No code, content, config or data changed. Nothing signed in to.
- **Date:** 2026-11-09. Web sources read 2026-11-09 unless a date is given.
- **Scope:** the user/UX side of the *style* decision only. Placement is already decided by the PO (issue #442,
  "option A": silent looping tile under the exercise name, tap for full screen with slow-mo). Production route
  (AI video, filmed trainer, licensed 3D) is Marketing's call (`docs/marketing/exercise-videos.md`); technique
  standards are the PT's. Hosting, caching and file formats are Tech Lead decisions; this file states UX needs only.
- **Inputs read:** `docs/ux/proposals/2026-11-01-fitbod-review.md`, `2026-10-06-exercise-illustrations.md`
  (untracked in the main checkout, not in this worktree), `docs/marketing/exercise-videos.md`, issue #442, the Kling
  test notes (20-exercise test, 2026-11-08), `src/styles.css`, `src/components/WorkoutLogging.css`,
  `src/components/WorkoutPlan.tsx`.

## 1. Summary

**Recommended look: "Studio coach".** One realistic coach (the PT character Marketing already uses), true 90° side
profile, camera at hip height, full movement in frame, one rep that loops seamlessly, on a dark, plain, low-detail gym
background that blends into GymStudio's near-black cards. No text, logos, jewellery, watches or tattoos. No colour
burned into the clip; muscles and cues are shown by the app around the video, not inside it.

Why: the market splits between real people (Fitbod, Ladder, Nike, Gymshark, MuscleWiki, Apple Fitness+) and 3D
figures (Hevy, Strong, JEFIT-style libraries). Real people read as premium and trustworthy, which suits a PT-designed
plan; 3D figures win on consistency and cost. A realistic coach on a near-black set gives us the premium read while
staying close to how 3D libraries get their consistency: one model, one camera, one set, every clip.

**The one rule that matters more than the style chosen:** never mix looks in one library. If the route ends up being
3D, switch the whole library to the 3D spec in §5.3; do not have a real coach on bench press and a grey mannequin on
lat pulldown.

## 2. Problem (evidence from the app and our tests)

1. **No in-app visual today.** The workout card offers a Google search link for the exercise
   (`src/components/WorkoutPlan.tsx:4280`, `onGoogle` → `exerciseImageSearchUrl`). It leaves the app, needs a network,
   and shows mixed and sometimes wrong variants (Fitbod review §G12; illustrations proposal §1).
2. **Demos are the most praised feature of the leading app.** About 10 of 26 sampled Fitbod reviews praised video and
   form help (Fitbod review, `2026-11-01-fitbod-review.md:149`, [C]).
3. **The clips we can make today are inconsistent.** In the 20-exercise Kling test only 8 of 20 were usable: a second
   rep slipped in, uncommon machines were swapped for other machines, lateral raises went above the shoulder, and
   watches, earrings and on-screen text kept appearing. A style spec that is strict about framing, outfit and set
   gives the PT fewer things to reject and makes the passes look like one library.
4. **The issue's tile and the clips don't match yet.** Issue #442 specifies a **16:10** tile with `object-fit: cover`
   and 1080p clips; Marketing's clips are **1:1, 720p** (Kling Flash 720p, PO cheapest setting 2026-11-08). Cropping a
   1:1 clip to 16:10 removes about 37% of its height: on a lat pulldown or squat that is the bar or the feet. This
   needs a framing rule (§4.2), not just a CSS value.

## 3. What leading apps do (research)

Evidence labels as in the Fitbod review: **[V]** the vendor's own page or store listing, **[S]** independent
reviewer, **[C]** competitor, low-confidence or second-hand source. Several vendor pages (Hevy help center,
MuscleWiki) returned HTTP 403 to the fetch tool; their content below comes from search-result summaries and is
marked accordingly. Reddit was not read directly.

| App | Demo type | Length / loop | Angle and set | Muscles | Offline | What users say |
|---|---|---|---|---|---|---|
| **Fitbod** | Filmed people [V] | Short loop at the top of the logging sheet [H, our Fitbod review] | Multi-angle, two angles, playback speed control [V, H] | Separate tabs: target, equipment [H] | Videos don't play offline [V, Fitbod review] | Most praised feature [C]; one Trustpilot reviewer says many videos show improper form, Fitbod asks users to flag them [S] |
| **Hevy** | Animation (3D figure in screenshots of the "How to" tab) [V help center, via search; C screensdesign] | Short loop | Single angle, plain background | Primary and secondary muscles listed beside the demo [V via search] | Not verified | A rival calls them reference material rather than coaching [C, biased] |
| **Strong** | "Growing library of animated videos" [V, App Store] | Short loop | Single angle | Text | Not verified | Competitor blog calls the visuals weaker than rivals' [C] |
| **JEFIT** | Store lists "HD video exercise instructions", 1,400+ exercises [V] | Not verified | Not verified | Not verified | Not verified | Format not confirmed in this session |
| **Ladder** | The team's coach films and demonstrates each movement [S] | The exercise video loops while you do the set [S, Garage Gym Reviews] | Coach in their own gym | Not verified | Not verified | Praised as coach-led; demos don't analyse your form [C] |
| **Future** | Coach-led app; no source in this session described its demo format | Not verified | Not verified | Not verified | Not verified | Value is the human coach and Apple Watch data [S] |
| **Apple Fitness+** | Filmed trainers in full classes, not per-exercise loops [S] | Class length | Studio, multiple cameras | No | Downloads for offline exist (not re-verified) | Described as more natural than Nike's plain recorded clips [S] |
| **Nike Training Club** | Filmed trainers; each exercise has steps, photos and video [S] | Short demo with brief audio in the basic version [S] | Studio | No | Not verified | Content praised; video crashes and playback failures reported [S, user review] |
| **MuscleWiki** | Filmed people, explicitly "no animated videos, no AI" [V via search] | Short loops | Front and side views; male and female versions [S, 2021] | Interactive body map is the entry point [V via search] | Web | Positioned on authenticity |
| **Gymshark Training** | "Guided exercise tutorials provided by athletes and trainers" [V] | Video per exercise during the workout [S, Tom's Guide] | Branded gym | Not verified | Not verified | Reviewer liked being guided through each exercise by video [S] |

**Patterns worth copying**

- **Silent, short, looping clip right where you log.** Fitbod (top of the logging sheet) and Ladder (loops during the
  set) both put it in the workout, not in a separate library. This matches the PO's option A.
- **Same model, same set, same camera across the library.** Every library above keeps one consistent look; none mixes
  real people with animated figures.
- **Muscles shown outside the clip.** Fitbod and Hevy put target muscles in text or tabs next to the video; MuscleWiki
  uses a body map. None of them depends on colour drawn into the video.
- **A second angle and slow playback as an option, not the default.** Fitbod offers two angles and speed control in its
  How-To [H]. We have slow-mo in full screen; a second angle can come later (§8).

**Patterns to avoid**

- **Video that needs the network mid-set.** Fitbod's videos don't work offline [V]; NTC users report playback failures
  [S]. GymStudio is offline-first, so a clip that fails must vanish cleanly (issue #442 already says so) and the day's
  clips should be cached before the gym (§4.4).
- **Demos that are wrong.** The Fitbod form complaint shows that one bad clip costs trust in all of them [S].

### Trust and AI-generated people

- **Detection and penalty.** In an Animoto survey (September 2025) about 83% of US consumers said they had seen video
  they suspected was AI, and about a third said it lowered their view of the brand; respondents named stiff movement
  and flat expression as giveaways (Adweek / NetInfluencer coverage) [S]. A Meltwater/YouGov report found 86% want AI
  content disclosed, with 32% trusting a brand less and 15% more [S]. HeyGen's own report says transparency raises
  engagement, but HeyGen sells AI video [C].
- **Fitness specifically.** An AI workout clip shared publicly was mocked by commenters (The Cool Down) [S]; a gym-video
  vendor argues that AI video routinely gets joint angles, depth and bar paths wrong and that viewers copy what they see
  (Flowjam, 2026) [C, vendor]. MuscleWiki markets its library *against* AI [V via search]. Our own test agrees: the
  failures were exactly joint angles, wrong machines and extra reps.
- **Real vs animated demos for learning.** Evidence is thin and mixed. A small 2024 dissertation found individual
  differences between human and animated models; an AR pilot found 13 of 16 participants preferred a realistic human
  avatar because it was more convincing and showed which muscles to move [S, academic, small samples]. No study found
  here measured adherence.
- **Reading for us:** realism helps only when the movement is right. A realistic coach who moves wrongly is worse than
  a plain 3D figure, because users trust and copy it. PT approval per clip (already required by #442) is the safety net,
  and disclosure (§6) protects trust.

### App Store points (Governancer and Tech Lead to confirm)

From Apple's App Review Guidelines, read 2026-11-09 (the fetch covered most of the page, not the last ~13%):
- **5.2 / 5.2.1:** only content we created or have a licence to use. For AI clips that means the generator's
  commercial terms on the plan used (Marketing notes Kling Standard is cited as watermark-free with commercial use);
  for 3D or filmed footage, the licence or a signed model release.
- **2.3.9:** we must hold the rights to everything in screenshots and previews, which includes clips shown in the store
  listing.
- **1.2:** now names "AI content creation apps". GymStudio does not let users generate content, so this should not
  apply; the clips are our own pre-made media.
- **1.4.1:** health apps that could give inaccurate information get extra scrutiny. Technique video is instructional;
  keep it out of anything that sounds like rehab or medical advice.
- Secondary sources say the 2025 (iOS 26) guidelines require disclosure of AI-generated content; I did not find that
  wording in the part of Apple's page I read. **Treat it as unverified**, but disclose anyway (§6), because it is
  cheap and the survey data favours it.
- **Likeness and consent:** the PT character is built from the PO's photos and changed on purpose. The memory notes
  say each person consented; that consent should be written down (Governancer) before store screenshots use it.
  `docs/governance/app-store/ai-disclosure.md` does not mention generated media today; it should.

## 4. Proposal

### 4.1 The visual style ("Studio coach") – one spec for every clip

| Element | Rule | Why |
|---|---|---|
| Model | One coach for the whole library (the PT character). A second, female coach only as a full second set later, never mixed per exercise | Consistency; MuscleWiki-style male/female choice is a later option |
| Outfit | Plain charcoal or black top and shorts, no logos, no text, no jewellery, no watch, no tattoos, dark shoes | Removes the most common Kling rejections; nothing competes with the movement |
| Camera | True 90° side profile, lens at hip height, locked off (no zoom, no pan) | Joint angles are readable from the side; same horizon in every clip |
| Exceptions | Movements where side view hides the fault (lateral raise, hip abduction, cable crossover) use a front view, chosen by the PT per exercise and recorded with the clip | One rule plus a short, PT-owned exception list |
| Framing | Whole body and whole load path inside the **centre 16:10 band** of the 1:1 frame (§4.2), with about 5% margin | The tile can crop 1:1 to 16:10 without cutting the bar or the feet |
| Background | Dark, low-detail gym or studio, near-black to dark grey (target luminance close to `--bg-dark` `#0f0f10` / `--bg-soft` `#171719`), soft key light from the camera side, slight rim light so the body separates from the background | The clip sits inside dark cards without a bright rectangle; the figure stays readable |
| Equipment | Matte black, real-looking, correct for the catalogue variant (PT checks the machine, not just the motion) | Kling swapped machines in 4 of 20 clips |
| Colour | Neutral grade, no brand tint in the footage. The burgundy (`--brand` `#8d5e63`) appears only in UI around the clip (play badge, focus ring, slow-mo toggle) | Brand colour on skin looks wrong; keeps footage reusable |
| Motion | Exactly one rep at the tempo the PT sets, starting and ending in the same position so the loop has no jump | A visible jump reads as a second rep or a glitch |
| Length | Target 3–5 s per loop (one rep). Longer only if the PT's tempo needs it | Glanceable between sets; matches the 5 s generation length |
| Audio | None. Remove the audio track from the file | Gym use; #442 already says no sound ever |
| Text in clip | None (no captions, arrows or muscle overlays burned in) | Bilingual app: text belongs in the UI; overlays break when cropped |

### 4.2 Aspect ratio and framing at 375 px

The workout card is a 16 px padded grid (`src/components/WorkoutLogging.css:1-7`) and the workout screen now runs
edge to edge on phones (#446, #448), so the tile is roughly **343 px wide** at 375 px (estimate from CSS, not measured
on device).

| Tile ratio | Height at ~343 px | Effect on the card at 375 × 812 |
|---|---|---|
| 1:1 (clip as delivered) | ~343 px | Pushes the set rows and Done button below the fold on most exercises. Not recommended in the card |
| **16:10 (issue #442)** | **~214 px** | Name, tile, cue line and the first set rows fit together. **Recommended** |
| 4:3 | ~257 px | A fallback if the PT finds 16:10 cuts too much on tall movements |

**Recommendation:** keep **16:10 in the card** and **show the full 1:1 master in full screen**. Make it a production
rule that everything that matters sits inside the centre 16:10 band (a 1:1 frame with ~18.75% top and bottom that may
be cropped). Marketing can add a 16:10 guide to its frame-check step; the PT checks the cropped poster, not only the
full frame. For tall movements that cannot fit (overhead press lockout, pull-up), the PT can mark a per-clip vertical
offset (`object-position`) instead of a different ratio. This is a Tech Lead/Copilot detail.

### 4.3 Must-haves for the tile (375 px)

The tile is already specified in #442. These items are what the style decision adds or tightens:

1. **Poster = the clearest frame**, usually the start position, chosen by the PT, not frame 1 by default. It is what
   reduced-motion users, slow connections and the first paint all see.
2. **Reserved space** with `aspect-ratio: 16 / 10` and a background of `--bg-soft` so there is no layout shift and no
   white flash before the poster loads (#442 already requires the ratio).
3. **Rounded like the rest of the card** (`--radius-inner` 14 px), no border, no shadow: the dark background of the
   clip should melt into the card.
4. **A visible pause/play control** of at least 44 × 44 px in a corner, separate from "tap to open full screen". A
   5 s clip that loops for the whole set is moving content that runs over 5 s next to other content, so WCAG 2.2.2
   (Pause, Stop, Hide) and the vendored rules (`command.md:59`) require a way to stop it. Alternative the PO may prefer:
   play three loops, then stop on the poster with a replay badge (still add a settings switch "Play technique videos
   automatically", which also saves data).
5. **One small badge** (play or expand icon in `--brand` on a dark scrim) so users know the tile opens; no text on the
   tile itself.
6. **Accessible name** on the tile button that names the exercise, e.g. "Watch lat pulldown technique, full screen", in
   EN and ES; the pause button gets its own label.
7. **Full screen:** the 1:1 master, centred on black, Close at top, Normal / Slow 0.5× toggle, and the PT's squeeze cue
   as text under the video (already in #442). Add the muscle names as text there (primary / secondary from the
   catalogue), so muscle information never depends on colour.
8. **No tile, no gap** for exercises without an approved clip (already in #442). Never show a placeholder silhouette:
   an empty frame on half the exercises would make the library look unfinished.
9. **Superset:** only the active exercise's tile plays (#442 already pauses inactive cards); the partner's tile shows
   its poster.

### 4.4 File and offline needs (for the Tech Lead to size)

- **Per clip:** silent H.264 MP4 at 720 × 720 for the master is enough for a ~343 px tile at 3× density in practice;
  aim for roughly **0.4–0.8 MB per 5 s clip** after re-encoding (the #442 estimate of 1.6 MB is for 1080p). Plus a
  JPG/WebP poster of about 30–60 KB.
- **Offline:** when today's workout opens with a connection, cache the posters and clips for that day only (6–10 clips,
  about 3–8 MB). Mid-set, with no signal, the tile shows the poster or disappears, never a spinner.
- **Data saver:** honour Low Data Mode / the new autoplay switch by showing posters only.

These are UX targets; formats, bucket and caching design stay with the Tech Lead.

## 5. How the style interacts with each production route

| Route | Fits "Studio coach"? | What the style spec adds | Main UX risk | UX verdict |
|---|---|---|---|---|
| **A. AI video (Kling, Flow)** | Yes; this is the look Marketing is already testing | The outfit, background and framing rules go into every prompt; the PT checks the cropped 16:10 poster and the loop point | Low yield (8/20), machine swaps, uncanny moments that cost trust if seen; disclosure needed | **Good for common equipment** (barbell, dumbbell, cable, standard machines) once the spec is in the prompt. Not for uncommon machines |
| **B. Licensed 3D figure** | No, it is a different look | Use §5.3 for the whole library instead | Feels less premium than filmed apps; vendor style may not match dark UI (often white backgrounds); mixing with A or C | **Strong fallback** if A's yield stays low, but only as a whole-library switch |
| **C. Filmed real trainer** | Yes; this is the reference version of the style | Shoot once with the same set, light, lens height and outfit, using the 16:10 band on a monitor | Logistics, consent and release; reshoots for new exercises | **Best quality and trust per clip**; also the best reference footage for route A |
| **D. Code-drawn 2D figure** | No | Not recommended for the tile | Looks basic next to every app in §3 | Not recommended |

### 5.1 The hybrid that keeps one look

Routes **A and C share the same look**, so they can be mixed safely if they share the spec: film a real trainer on the
exercises the AI gets wrong (uncommon machines, rear-delt fly, chest-supported row, T-bar, seated leg curl), and use AI
for the rest. Marketing's best Kling recipe already starts from a real reference video (Motion Control: same machine
and motion, PT character swapped in), so filmed reference clips also raise the AI pass rate. The viewer must not be
able to tell which clips came from which route: same coach, outfit, set and grade.

### 5.2 What breaks consistency (avoid)

- Two coaches, or the same coach in different outfits or gyms, across the library.
- Mixing realistic video with 3D figures or illustrations in the same place.
- Background brightness that varies clip to clip (a white gym next to a dark one inside a dark card).
- Clips with a jump at the loop point, a second rep, or text on plates and clothes.
- Kling watermarks (download without watermark per the workflow notes) and any vendor logo.

### 5.3 If the route becomes 3D

Use the same composition rules (side view, hip-height camera, one rep, seamless loop, 16:10 safe band, no text), with:
one neutral figure (mid grey, matte), dark background to match the cards (ask the vendor for dark or transparent
backgrounds; the earlier "light plate" idea from the illustrations proposal is for still images, not for a moving
tile), and muscle highlight only if every clip in the library has it in the same colour. Even then, keep the text
muscle names in full screen.

## 6. AI transparency and trust (if any clip is AI-generated)

- **In-app line, full screen only:** a small caption under the cue, e.g. "Demonstration made with AI and checked by our
  trainer" (EN/ES; final wording via Governancer and the PT). Not on the tile, where it would be noise.
- **Store and docs:** Governancer adds generated media to `docs/governance/app-store/ai-disclosure.md` and records
  the consent for the PT character's likeness; Marketing does not use AI clips in store previews without that.
- **Report a clip:** a "Something looks wrong" action in full screen (sends nothing automatically; design to be decided
  with the Tech Lead). Fitbod's form complaint was answered with "flag the video", and it gives the PT a queue.
- Never present the coach as a real, named trainer giving advice. "Our trainer checked this" refers to the PT approval
  process, and the PT confirms that wording.

## 7. Web Design Guidelines audit (vendored Vercel rules)

- **Source:** `.claude/skills/web-design-guidelines/command.md`, from
  `https://github.com/vercel-labs/web-interface-guidelines` commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`.
  **SHA-256 verified 2026-11-09:** `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`, matching
  `docs/governance/skill-checksums.json`. Rules treated as reference material only.
- **What was audited:** the tile is not built yet, so the audit applies the rules to the #442 spec and the insertion
  point in the current code.

| Rule (`command.md` line) | Applies to | Finding |
|---|---|---|
| 59: autoplay motion over 5 s alongside other content needs pause/stop/hide | #442 tile (continuous loop) | **Gap.** Add a pause control or auto-stop (§4.3 item 4) |
| 60: muted decorative loops stop under reduced motion | #442 | Covered (poster + play badge) |
| 92–93: prefer muted, looping, inline H.264 video over GIF; still fallback | #442 | Covered (MP4, `muted loop playsInline`, poster) |
| 80: media needs explicit size to prevent layout shift | #442 | Covered by `aspect-ratio`; also set `width`/`height` on the poster image |
| 16: icon-only buttons need `aria-label` | Tile, pause and close buttons | **Add** labelled buttons in EN/ES (§4.3 item 6); #442 lists `workout.video.open` but no pause label |
| 31, 33: visible focus with `:focus-visible` | Tile and player controls | Specify a `--brand` focus ring |
| 104: `touch-action: manipulation` | Tile | Add, so a quick tap opens without delay |
| 109: gestures need tap/keyboard alternatives | Full-screen player (if swipe-down to close is added) | Close button and Esc already planned |
| 90 (`preconnect` for CDN/asset domains) | Supabase Storage host | Tech Lead to consider when the workout opens |
| Insertion point | `src/components/WorkoutPlan.tsx:4271` (`h2.effortless-name`), followed by the partner line, superset status and actions | The tile sits between name and partner line; with 16:10 it keeps the first set rows above the fold (estimate) |

No compliance is claimed for code that does not exist yet; QAer should re-run these checks on the built tile.

## 8. Impact / effort (ranked)

| # | Recommendation | Impact | Effort | Owner / dependency |
|---|---|---|---|---|
| 1 | Adopt the "Studio coach" style spec (§4.1) for every clip, whatever the route | High (consistency, fewer PT rejections) | S | PO approves; Marketing adds it to prompts and shot list; PT checks |
| 2 | 16:10 tile + 1:1 full screen + centre-band framing rule (§4.2) | High (no cut-off movements, sets stay visible) | S | Marketing framing; Tech Lead updates #442 |
| 3 | Pause control or auto-stop + autoplay setting (§4.3 item 4) | Medium-high (accessibility, data, calm UI) | S | Tech Lead amends #442 |
| 4 | PT-chosen poster frame per clip (§4.3 item 1) | Medium | S | PT + Marketing |
| 5 | Cache today's clips on open; poster-only when offline (§4.4) | High in the gym | M | Tech Lead |
| 6 | AI disclosure line + consent record + ai-disclosure doc update (§6) | Medium (trust, store review) | S | Governancer, PT, PO |
| 7 | Hybrid production: film a trainer for the machines AI fails on (§5.1) | High for coverage | M (a filming day) | Marketing, PO budget |
| 8 | "Something looks wrong" report in full screen | Medium | M | Tech Lead design |
| 9 | Later: second angle (front) in full screen; female coach as a full second set | Medium | L | Marketing, PT |

**Quick wins:** 1–4 and 6 are decisions and spec changes, no new production.
**Bigger bets:** 5 (offline caching), 7 (filming day), 9 (second angle or second coach).

## 9. Risks

- **A realistic clip with wrong technique** is the biggest risk: users copy what they see. Mitigation: PT approval per
  clip on the cropped poster and the full loop; report action; no clip without approval (#442).
- **Uncanny AI moments** (hands, faces, morphing equipment) lower trust in the whole app. Mitigation: medium framing,
  short loops, reject on any artefact, disclose.
- **Library drift** as Kling or Flow models change (Flow's Veo models leave Flow on 5 Dec 2026 per the notes).
  Mitigation: the style spec, a reference still per clip, and the hybrid plan.
- **Cost and data** if clips are large or autoplay over mobile data. Mitigation: §4.4 targets and the autoplay setting.

## 10. How to measure success

- **PT first-pass approval rate** per batch, before and after the style spec is in the prompts (baseline: 8 of 20).
- **Google image link taps** on exercises with a clip (target: down sharply; baseline to be measured once events exist).
- **Full-screen opens** per new exercise, and slow-mo use (shows the tile is useful, not decoration).
- **Clip reports** per 100 views (target: near zero after PT approval).
- **QAer check at 375 px:** no layout shift, sets visible with the tile, pause works, reduced motion shows the poster,
  offline shows poster or nothing.
- **PO rating** after two weeks in the gym: "does it look like one app?"

## 11. Decisions for the PO

1. **Style:** approve "Studio coach" (one realistic coach, side view, dark plain set, no text) as the only look for the
   library. Yes / no.
2. **Tile shape:** keep 16:10 in the card with the full square in full screen, and require Marketing to frame inside
   the 16:10 band. Yes / no.
3. **Movement on screen:** a pause button on the tile, or play three times then stop on the still picture. Either way,
   add a setting to turn autoplay off.
4. **AI label:** show "made with AI, checked by our trainer" in full screen for AI clips. Yes / no.
5. **Hybrid:** if AI keeps failing on uncommon machines, film a real trainer for those (same look) rather than switching
   to 3D. Yes / no (budget is a Marketing/PO decision).

## Sources

External (read 2026-11-09 unless stated):
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ (1.2, 1.4.1, 2.3.9, 5.2)
- W3C, Understanding SC 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
- Hevy help center, exercise library: https://help.hevyapp.com/hc/en-us/articles/35688251991575 (403 to the fetch tool; search summary) · https://www.hevyapp.com/features/exercise-library/
- screensdesign, Hevy screens: https://screensdesign.com/apps/hevy-workout-tracker-gym-log/
- FitCraft vs Hevy (competitor): https://getfitcraftcom.pages.dev/compare/fitcraft-vs-hevy
- Strong App Store listing: https://apps.apple.com/gb/app/id464254577
- GiFit, Strong review (competitor): https://gifit-2wu.pages.dev/blog/strong-workout-app-review/
- Fitbod App Store listing: https://apps.apple.com/gb/app/id1041517543 · Trustpilot reviews: https://www.trustpilot.com/review/fitbod.me?page=2 · Fitbod 3.0 coverage (2021): https://www.hotelgyms.com/blog/big-news-ahead-for-fitbod-members-in-2022
- JEFIT App Store listing: https://apps.apple.com/us/app/id449810000
- Ladder: https://www.garagegymreviews.com/ladder-app-review · https://www.joinladder.com/llms.txt · https://www.sensai.fit/blog/ladder-app-review-2026
- Future: https://www.garagegymreviews.com/future-app-review
- Apple Fitness+ vs Nike Training Club: https://www.stuff.tv/features/nike-training-club-vs-apple-fitness-which-app-gives-best-workout · https://www.techradar.com/news/apple-fitness-plus-vs-nike-training-club
- Nike Training Club: https://reviewed.com/health/content/nike-training-club-review-workout-app · https://www.garagegymreviews.com/nike-training-club-review · https://tomsguide.com/reviews/nike-training-club-app
- MuscleWiki about page: https://musclewiki.com/about (403 to the fetch tool; search summary) · Gigazine (2021): https://gigazine.net/gsc_news/en/20210122-muscle-wiki
- Gymshark Training review (Tom's Guide): https://tomsguide.com/wellness/fitness/gymshark-training-app-review-effective-workouts-for-free · listing: https://apps.apple.com/GB/app/id1139151320
- Animoto survey coverage (Sep 2025): https://www.adweek.com/adweek-wire/83-of-consumers-can-spot-ai-videos-36-say-it-hurts-brand-trust-new-animoto-report/ · https://www.netinfluencer.com/consumers-detect-ai-generated-video-content-while-marketers-embrace-tools-study-finds/
- Meltwater/YouGov coverage: https://www.bernama.com/lite/news.php?id=2547934
- HeyGen 2025 AI sentiment report (vendor): https://www.heygen.com/2025-ai-sentiment-report
- AI workout clip reaction: https://www.thecooldown.com/?p=425646 · Flowjam, AI video for gyms (vendor, 2026): https://www.flowjam.com/blog/ai-video-for-fitness-2026
- Human vs animated exercise models (2024 dissertation): https://uknowledge.uky.edu/edsrc_etds/150 · AR vs image vs video exercise learning: https://arxiv.org/pdf/2209.02161
- Apple guideline changes, secondary coverage (unverified on AI disclosure): https://appsops.store/news/app-store-review-guidelines-ios26-ai-disclosure · https://www.ithinkdiff.com/app-store-rules-ai-deepfakes-nudify-apps/

Internal: `docs/ux/proposals/2026-11-01-fitbod-review.md`, `docs/ux/proposals/2026-10-06-exercise-illustrations.md`
(main checkout, untracked), `docs/marketing/exercise-videos.md`, issue #442, Kling workflow notes (2026-11-08),
`src/styles.css:8-24,71-72`, `src/components/WorkoutLogging.css:1-7`, `src/components/WorkoutPlan.tsx:4271-4280`,
`.claude/skills/web-design-guidelines/command.md`, `docs/governance/app-store/ai-disclosure.md`.

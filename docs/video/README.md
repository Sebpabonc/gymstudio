# Video department (Videoer)

Created 2026-11-07 at the PO's request ("necesitamos ese departamento, porque eso genera mucho valor").
Agent: `.claude/agents/videoer.md`. Goal: our own short technique video for every catalogue exercise, in one
consistent style, that GymStudio is allowed to use.

## Why
The Fitbod review (`docs/ux/proposals/2026-11-01-fitbod-review.md`) showed per-exercise video as a core part of
how a gym app teaches technique. Today GymStudio shows text cues and a Google image search link.

## Ways to produce the library

| Route | What it looks like | Rights | Cost and effort | Main risk |
|---|---|---|---|---|
| **A. AI video generator** | Realistic person, any gym look | Commercial use only if the service's terms grant it | Account and credits (PO); a few minutes per clip plus retries | Wrong technique (sliding feet, bad joint angles); needs strict PT review |
| **B. 3D animated figure** | Neutral 3D model on a dark background, like Gymvisual but moving | Ours if we buy the 3D assets or commission them | Paid 3D library or a freelancer; consistent once set up | Upfront cost; animation quality depends on the animator |
| **C. Film a real person** | One trainer, one gym, same camera setup | Ours with a signed release | A filming day for about 20-30 exercises at a time | Logistics; needs a model and a gym |
| **D. Code-drawn animation** | Simple 2D line figure drawn in code, fully ours | Ours | No purchase; slow to make look good | Looks basic next to competitors |

### What these cost (third-party figures found 2026-11-07, to confirm with each vendor)
- **AI generators:** about US$0.03-0.75 per second of video through APIs; Kling at about US$0.03/s, so a 6 s clip costs
  cents, retries included. Kling's Standard plan (about US$7/month) is cited as watermark-free with commercial use; free
  tiers of Kling, Pika and HeyGen are not cleared for commercial use. A licence to use the output is not the same as owning it.
  Sources: artlist.io (best AI video generator with commercial licensing, 2026), fluxnote.io (AI video tool pricing, June 2026).
- **3D animated libraries:** MoveKit sells clips from about US$1.99 with a commercial licence for paid apps (vendor claim);
  freelancers on Fiverr/Upwork sell 50-400 exercise 3D packs as MP4 loops under non-exclusive app licences. No public
  prices found for Gymvisual or RepDB video; ask for quotes. Sources: alternativeto.net (MoveKit), fiverr.com, upwork.com.
- **Filmed, licensed:** Fitscope licenses trainer-filmed video from about US$20-30 per video per month (fitscope.com),
  a benchmark only.

Recommendation: run a **pilot of 5 exercises** before choosing, ideally comparing route A with route B or C on the
same exercises. Pick the route by PT technique score first, look second, cost third.

## Pilot (5 exercises, one per equipment type)

| Catalogue id | Why it is in the pilot |
|---|---|
| `barbell-bench-press` | Barbell, most common lift, easy to judge |
| `lat-pulldown` | Cable, seated, arm path matters |
| `dumbbell-romanian-deadlift` | Dumbbell hinge, back position is the classic AI failure |
| `leg-extensions-toes-dorsiflexed-neutral` | Machine, needs the machine to look right |
| `push-up` | Bodyweight, full-body line |

For each clip: PT checklist (start, range, tempo, end, common errors absent), the format spec in the agent file,
and the asset record in `assets.md`.

## Decisions for the PO
1. Which route(s) to pilot. Routes A and B need a purchase or account that only the PO can make.
2. Budget ceiling for the pilot and for the full library (about 230 exercises).

## Not started yet (Tech Lead, after the pilot)
Where videos live (Supabase Storage or the app bundle), a `video` field per catalogue exercise, how the app shows
them (exercise sheet and first-time card), offline caching, and size limits.

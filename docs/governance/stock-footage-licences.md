# Stock footage licences (AI motion reference)

Status: **draft** (Governancer, 2026-11-15). Not legal advice; the author is not a lawyer. Items marked
`⚠️ VERIFY` are open and need checking (and, where noted, a lawyer's view) before output is published.

Purpose: a log of every third-party clip used as a motion reference for GymStudio exercise videos
(`docs/marketing/exercise-videos.md`), with its source, licence and how we used it. Add one entry per clip.
Never store the downloaded files or any credentials in the repo.

## How to add an entry

Copy the template below. Record the source page and file URL, the licence URL and the date it was read,
what was done to the clip, and the open points. Licence summaries are paraphrased, not quoted.

---

## SF-001: Standing two-arm dumbbell curl (Pexels 4159059)

| Field | Value |
|---|---|
| Source | Pexels, video id 4159059 |
| Page | https://www.pexels.com/video/a-man-doing-dumbbell-curls-4159059/ |
| File | https://videos.pexels.com/video-files/4159059/4159059-hd_1080_1920_24fps.mp4 |
| Content | About 2.7 s, standing two-arm dumbbell curl, white background, one identifiable adult man |
| Selected by | PT, for technique |
| Licence | Pexels License, https://www.pexels.com/license/ |
| Licence read | 2026-11-15, by the Tech Lead (facts recorded here as reported; not re-read by Governancer) |
| Recorded by | Governancer, 2026-11-15 |

**Licence summary (paraphrased).** Free to use; attribution not required; modification allowed.
Not allowed: showing identifiable people in a bad light or an offensive way; selling unaltered copies;
implying that people or brands in the footage endorse our product; redistributing on other stock or
wallpaper platforms; using it as a trademark or business name.

**How we used it.** Slowed to 4.0 s and uploaded to Kling (Motion Control) as the motion reference only.
The person is replaced by our character "Seb", a GymStudio partner who consented to AI videos of him.
The original person's face and identity are not intended to appear in the output.

**Intended output.** In-app technique videos; possibly marketing (not decided).

**Open points (not resolved).**
1. ⚠️ VERIFY: Pexels gives no model-release guarantee for the person in the clip. Matters most if output is
   used in marketing. Lawyer review recommended before marketing use.
2. ⚠️ VERIFY: check each AI output for any remaining trace of the original person (face, body features,
   clothing, tattoos). If any remains, do not use that output, and do not imply that person endorses GymStudio.
3. ⚠️ VERIFY, not checked: whether the Pexels Terms of Service (beyond the licence page) restrict AI or
   machine-learning use, such as uploading footage to a third-party AI service.
4. ⚠️ VERIFY, not checked: Kling's own terms for uploaded reference material (rights we grant to Kling).

**Required before publishing output:** points 1 to 3 closed, the PT approves the technique, and the PO approves.

**Outcome (2026-11-15).** Two Kling takes; the PT rejected both (grip drifted to a hammer curl, logos on clothing). Not used.

---

## SF-002: Standing alternating dumbbell curl (Pexels 6547797)

| Field | Value |
|---|---|
| Source | Pexels, video id 6547797 |
| Page | https://www.pexels.com/video/man-lifting-dumbbells-in-front-of-the-mirror-6547797/ |
| Content | About 10 s, alternating hex-dumbbell curls filmed into a gym mirror; one identifiable adult man, other gym users in the background |
| Selected by | PT, for technique (round 2, 2026-11-15) |
| Licence | Pexels License, https://www.pexels.com/license/ (same terms as SF-001) |
| Licence read | 2026-11-15, by the Tech Lead |
| Recorded by | Tech Lead, 2026-11-15 |

**How we used it.** Trimmed to 3.3–7.3 s (4.0 s) and uploaded to Kling Motion Control as the motion reference
only. The person and the gym are replaced by our character "Seb" in a plain black studio.

**Outcome.** Take 3 was approved by the PT as a prototype only (supinated grip at the top). It is not for
publishing: the catalogue entry is bilateral and the clip shows an alternating curl, a neutral grip at the bottom, and a watch.

**Open points.** Same as SF-001, points 1 to 4. Other gym users also appear in the source, so check that none
of them remain in any output.

---

## Template

```
## SF-NNN: <exercise> (<source> <id>)
| Field | Value |
|---|---|
| Source / Page / File | |
| Content | |
| Selected by | |
| Licence / URL | |
| Licence read | <date, by whom> |
| Recorded by | |
Licence summary (paraphrased):
How we used it:
Intended output:
Open points:
```

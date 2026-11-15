/**
 * Exercise technique clips shown in the workout card (#442, option A).
 *
 * `status: 'approved'` clips passed PT review. `status: 'test'` clips are NOT PT-approved: the PO decided on
 * 2026-11-15 to ship every existing clip so he can test the feature in the gym this week. Replace each test clip
 * with an approved take (or remove it) before a public release.
 * Hosting (Tech Lead 2026-11-15): clips and posters are bundled as static files in
 * `public/exercise-videos/` and referenced with relative paths, so they work on GitHub Pages
 * and inside Capacitor (`base: './'`). `src` and `poster` are plain strings, so moving to
 * Supabase Storage later only changes this file.
 */
export type ExerciseVideo = {
  src: string
  poster: string
  /** The model in the clip (Marketing cast, docs/marketing/exercise-videos.md). */
  model: string
  /** 'approved' = PT-approved; 'test' = shipped for the PO's gym test only (see above). */
  status: 'approved' | 'test'
}

const clip = (id: string, model: string, status: ExerciseVideo['status']): ExerciseVideo => ({
  src: `exercise-videos/${id}.mp4`,
  poster: `exercise-videos/${id}.jpg`,
  model,
  status,
})

export const exerciseVideos: Readonly<Record<string, ExerciseVideo>> = {
  // PT 2026-11-08
  'incline-dumbbell-press': clip('incline-dumbbell-press', 'Seb', 'approved'),
  // PT 2026-11-08
  'dumbbell-bench-press': clip('dumbbell-bench-press', 'Seb', 'approved'),
  // PT 2026-11-08
  'dumbbell-bulgarian-split-squat': clip('dumbbell-bulgarian-split-squat', 'Ram', 'approved'),
  // PT 2026-11-08
  'dumbbell-shoulder-press': clip('dumbbell-shoulder-press', 'Ram', 'approved'),
  // PT 2026-11-08
  'cable-straight-arms-pull-downs': clip('cable-straight-arms-pull-downs', 'Ram', 'approved'),
  // PT 2026-11-08
  'cable-crunch': clip('cable-crunch', 'Seb', 'approved'),
  // PT 2026-11-08
  'high-cable-fly': clip('high-cable-fly', 'Seb', 'approved'),
  // PT 2026-11-08
  'lat-pulldown': clip('lat-pulldown', 'Seb', 'approved'),
  // PT rejected 2026-11-15: watch, last frame
  'standing-dumbbell-curl': clip('standing-dumbbell-curl', 'Seb', 'test'),
  // PT rejected 2026-11-15: cap, bar to neck
  'smith-machine-bench-press': clip('smith-machine-bench-press', 'Seb', 'test'),
  // PT rejected 2026-11-15: torso rises
  'barbell-bent-over-row': clip('barbell-bent-over-row', 'Seb', 'test'),
  // PT rejected 2026-11-15: grip too narrow
  'pull-up-wide-grip': clip('pull-up-wide-grip', 'Seb', 'test'),
  // PT rejected 2026-11-15: cap, shallow
  'dip': clip('dip', 'Seb', 'test'),
  // PT rejected 2026-11-15: two reps
  'dumbbell-chest-supported-row': clip('dumbbell-chest-supported-row', 'Seb', 'test'),
  // not PT-reviewed
  'back-squat': clip('back-squat', 'Seb', 'test'),
  // not PT-reviewed
  'barbell-bench-press': clip('barbell-bench-press', 'Juandi', 'test'),
  // not PT-reviewed
  'dumbbell-romanian-deadlift': clip('dumbbell-romanian-deadlift', 'Seb', 'test'),
  // not PT-reviewed
  'ez-bb-preacher-curls': clip('ez-bb-preacher-curls', 'Seb', 'test'),
  // not PT-reviewed
  'dumbbell-curl-incline': clip('dumbbell-curl-incline', 'PT', 'test'),
}

/** The clip for an exercise id, or undefined when it has none. */
export function getExerciseVideo(exerciseId: string | undefined | null): ExerciseVideo | undefined {
  if (!exerciseId) return undefined
  return Object.prototype.hasOwnProperty.call(exerciseVideos, exerciseId) ? exerciseVideos[exerciseId] : undefined
}

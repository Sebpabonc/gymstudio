/**
 * Exercise technique clips shown in the workout card (#442, option A).
 *
 * Only PT-approved clips go in this list; each entry names its approval.
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
}

export const exerciseVideos: Readonly<Record<string, ExerciseVideo>> = {
  // PT-approved 2026-11-08 (docs/marketing/exercise-video-prompts.md)
  'incline-dumbbell-press': {
    src: 'exercise-videos/incline-dumbbell-press.mp4',
    poster: 'exercise-videos/incline-dumbbell-press.jpg',
    model: 'Seb',
  },
  // PT-approved 2026-11-08 (docs/marketing/exercise-video-prompts.md)
  'dumbbell-bench-press': {
    src: 'exercise-videos/dumbbell-bench-press.mp4',
    poster: 'exercise-videos/dumbbell-bench-press.jpg',
    model: 'Seb',
  },
}

/** The approved clip for an exercise id, or undefined when it has none. */
export function getExerciseVideo(exerciseId: string | undefined | null): ExerciseVideo | undefined {
  if (!exerciseId) return undefined
  return Object.prototype.hasOwnProperty.call(exerciseVideos, exerciseId) ? exerciseVideos[exerciseId] : undefined
}

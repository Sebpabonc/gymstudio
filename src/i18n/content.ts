import { useEffect, useState } from 'react'
import type { Exercise, TrainingBlock } from '../types'
import type { Language } from './translate'
// PT-approved Spanish versions of fitness content (docs/fitness/approved/es). English is the source;
// anything missing here falls back to English.
type ExerciseTextEs = { squeeze_cue?: string; posture_tips?: string[] }
type BlockTextEs = {
  name?: string
  summary?: string
  insights?: { title: string; body: string }[]
  days?: Record<string, { name?: string; focus?: string }>
  notes?: Record<string, string>
}

let EXERCISES_ES: Record<string, ExerciseTextEs> = {}
let BLOCKS_ES: Record<string, BlockTextEs> = {}
let spanishContent: Promise<void> | null = null

/** Loads the Spanish content in its own chunk the first time Spanish is selected. */
export function loadSpanishContent() {
  spanishContent ??= Promise.all([
    import('../../docs/fitness/approved/es/catalogue-arms-core.json'),
    import('../../docs/fitness/approved/es/catalogue-back.json'),
    import('../../docs/fitness/approved/es/catalogue-chest-shoulders.json'),
    import('../../docs/fitness/approved/es/catalogue-legs-glutes.json'),
    import('../../docs/fitness/approved/es/blocks.json'),
  ]).then(([armsCore, back, chestShoulders, legsGlutes, blocks]) => {
    EXERCISES_ES = {
      ...(armsCore.default as Record<string, ExerciseTextEs>),
      ...(back.default as Record<string, ExerciseTextEs>),
      ...(chestShoulders.default as Record<string, ExerciseTextEs>),
      ...(legsGlutes.default as Record<string, ExerciseTextEs>),
    }
    BLOCKS_ES = blocks.default as Record<string, BlockTextEs>
  })
  return spanishContent
}

/** True once the Spanish content is available; components add it to their memo dependencies. */
export function useSpanishContentReady(language: Language) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (language !== 'es') return
    let active = true
    void loadSpanishContent().then(() => {
      if (active) setReady(true)
    })
    return () => {
      active = false
    }
  }, [language])
  return ready
}

/** Exercise with Spanish squeeze cue and posture tips when available. */
export function localizeExercise(exercise: Exercise, language: Language): Exercise {
  if (language !== 'es') return exercise
  const es = EXERCISES_ES[exercise.id]
  if (!es) return exercise
  return {
    ...exercise,
    squeezeCue: es.squeeze_cue?.trim() || exercise.squeezeCue,
    postureTips: es.posture_tips?.length ? es.posture_tips : exercise.postureTips,
  }
}

export function localizeCatalogue(exercises: Exercise[], language: Language): Exercise[] {
  return language === 'es' ? exercises.map((exercise) => localizeExercise(exercise, language)) : exercises
}

/** Block with Spanish name, summary, insights, day names/focus and notes when available. Ids, keys and codes never change. */
export function localizeBlock(block: TrainingBlock, language: Language): TrainingBlock {
  if (language !== 'es') return block
  const es = BLOCKS_ES[block.id]
  if (!es) return block
  return {
    ...block,
    name: es.name?.trim() || block.name,
    summary: es.summary?.trim() || block.summary,
    insights: es.insights?.length === block.insights.length ? es.insights : block.insights,
    days: block.days.map((day) => ({
      ...day,
      name: es.days?.[day.key]?.name?.trim() || day.name,
      focus: es.days?.[day.key]?.focus?.trim() || day.focus,
      exercises: day.exercises.map((exercise) => {
        const note = exercise.code ? es.notes?.[`${day.key}/${exercise.code}`] : undefined
        return note ? { ...exercise, notes: note } : exercise
      }),
    })),
  }
}

export function localizeBlocks(blocks: TrainingBlock[], language: Language): TrainingBlock[] {
  return language === 'es' ? blocks.map((block) => localizeBlock(block, language)) : blocks
}

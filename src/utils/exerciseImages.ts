import imageQueries from '../../docs/fitness/approved/exercise-image-queries.json'

// PT-approved Google Images queries per catalogue exercise id (docs/fitness/approved).
const QUERIES = imageQueries as Record<string, string>

/** Best search terms to see the exercise and its machine; falls back to name (+ equipment). */
export function exerciseImageQuery(exerciseId: string | undefined, name: string, equipment?: string) {
  const approved = exerciseId ? QUERIES[exerciseId] : undefined
  if (approved?.trim()) return approved.trim()
  const base = name.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  const addEquipment = equipment && !base.toLowerCase().includes(equipment.toLowerCase().replace('-', ' '))
  return `${base}${addEquipment ? ` ${equipment.replace('-', ' ')}` : ''} exercise`.trim()
}

export function exerciseImageSearchUrl(query: string) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
}

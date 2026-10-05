import type { Language } from './translate'

// Spanish names for the catalogue's English muscle names. The first entry is the display name;
// the rest are extra words people search with. English stays the stored/source value.
const MUSCLES_ES: Record<string, string[]> = {
  Abductors: ['Abductores'],
  Abs: ['Abdominales', 'Abdomen'],
  Adductors: ['Aductores'],
  Biceps: ['Bíceps'],
  Calves: ['Pantorrillas', 'Gemelos'],
  Chest: ['Pecho'],
  Forearms: ['Antebrazos'],
  'Front Delts': ['Deltoide frontal'],
  Glutes: ['Glúteos'],
  Hamstrings: ['Isquiotibiales', 'Femorales'],
  'Hip Flexors': ['Flexores de cadera'],
  Lats: ['Dorsales'],
  'Lower Back': ['Espalda baja'],
  Obliques: ['Oblicuos'],
  Quads: ['Cuádriceps'],
  'Rear Delts': ['Deltoide posterior'],
  'Side Delts': ['Deltoide lateral'],
  Traps: ['Trapecios'],
  Triceps: ['Tríceps'],
  'Upper Back': ['Espalda alta'],
  'Upper Chest': ['Pecho superior'],
}

/** Muscle name for the UI language; unknown names fall back to the original. */
export function localizeMuscle(muscle: string, language: Language) {
  if (language !== 'es') return muscle
  return MUSCLES_ES[muscle]?.[0] ?? muscle
}

/** Spanish names and synonyms for a muscle, used so Spanish search words find English-named muscles. */
export function getMuscleSearchTermsEs(muscle: string) {
  return MUSCLES_ES[muscle] ?? []
}

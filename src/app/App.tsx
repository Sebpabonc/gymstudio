import { useState } from 'react'
import { getExercise } from '../data/exercises'
import { ExerciseScreen } from '../features/exercise/ExerciseScreen'
import { SearchScreen } from '../features/search/SearchScreen'
import { useRoute } from './router'

export default function App() {
  const route = useRoute()
  // Lives here so the query survives going into an exercise and back.
  const [query, setQuery] = useState('')

  if (route.name === 'exercise') {
    const exercise = getExercise(route.exerciseId)
    if (exercise) return <ExerciseScreen key={exercise.id} exercise={exercise} />
  }

  return <SearchScreen query={query} onQueryChange={setQuery} />
}

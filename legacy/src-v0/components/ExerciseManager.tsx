import React, { useEffect, useMemo, useState } from 'react'
import { Exercise } from '../types'
import { getMuscleGroupForExercise } from '../data/workoutPlan'
import { loadExercises, saveExercises } from '../utils/storage'

export default function ExerciseManager() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [name, setName] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    setExercises(loadExercises())
  }, [])

  useEffect(() => {
    saveExercises(exercises)
  }, [exercises])

  const muscleGroups = useMemo(() => {
    const list = Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup ?? getMuscleGroupForExercise(exercise.name))))
    return ['All', ...list.filter(Boolean)]
  }, [exercises])

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const muscleGroup = exercise.muscleGroup ?? getMuscleGroupForExercise(exercise.name)
      return filter === 'All' || muscleGroup === filter
    })
  }, [exercises, filter])

  function add() {
    if (!name.trim()) return
    const trimmed = name.trim()
    const newExercise: Exercise = {
      id: trimmed.toLowerCase().replace(/\s+/g, '-'),
      name: trimmed,
      muscleGroup: getMuscleGroupForExercise(trimmed),
    }
    setExercises((s) => [...s, newExercise])
    setName('')
  }

  function remove(id: string) {
    setExercises((s) => s.filter((e) => e.id !== id))
  }

  return (
    <div className="card">
      <h2>Exercises</h2>

      <div className="row filter-row">
        <label htmlFor="muscle-filter">Muscle</label>
        <select id="muscle-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <input placeholder="New exercise" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>

      <ul className="list">
        {filteredExercises.map((ex) => (
          <li key={ex.id} className="list-item">
            <div className="exercise-item-meta">
              <span>{ex.name}</span>
              <small>{ex.muscleGroup ?? getMuscleGroupForExercise(ex.name)}</small>
            </div>
            <button className="danger" onClick={() => remove(ex.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

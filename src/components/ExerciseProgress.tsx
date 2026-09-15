import React, { useEffect, useMemo, useState } from 'react'
import { Chart as ChartJS, LinearScale, CategoryScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { loadExercises, loadSessions } from '../utils/storage'

ChartJS.register(LinearScale, CategoryScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function ExerciseProgress(){
  const exercises = loadExercises()
  const sessions = loadSessions()
  const [selected, setSelected] = useState(exercises[0]?.id || '')

  useEffect(()=>{
    if(!selected && exercises[0]) setSelected(exercises[0].id)
  },[exercises])

  const data = useMemo(()=>{
    if(!selected) return { labels:[], datasets:[] }
    const points = sessions
      .slice()
      .reverse()
      .filter(s=> s.exercises.some(e=>e.exerciseId===selected))
      .map(s=>{
        const e = s.exercises.find(x=>x.exerciseId===selected)!
        const max = Math.max(...e.sets.map(ss=>ss.weight))
        return { date: s.date, value: max }
      })
    return {
      labels: points.map(p=> new Date(p.date).toLocaleDateString()),
      datasets: [{ label: 'Max weight', data: points.map(p=>p.value), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.3)' }]
    }
  },[selected, sessions])

  return (
    <div className="card">
      <h2>Progress</h2>
      <div className="row">
        <select value={selected} onChange={(e)=>setSelected(e.target.value)}>
          {exercises.map(ex=> <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>
      <div style={{height:230}}>
        <Line data={data} />
      </div>
    </div>
  )
}

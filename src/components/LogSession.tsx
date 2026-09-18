import React, { useEffect, useState } from 'react'
import { Exercise, Session, ExerciseEntry, SetEntry } from '../types'
import { loadExercises, loadSessions, saveSessions } from '../utils/storage'

function uid() { return Math.random().toString(36).slice(2,9) }

export default function LogSession({ onSaved }:{ onSaved:()=>void }){
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [search, setSearch] = useState('')

  useEffect(()=>{
    setExercises(loadExercises())
  },[])

  function addExercise(exId:string){
    // prevent duplicate exercise entries in the same session
    setEntries((s)=> (s.some(se=>se.exerciseId===exId) ? s : [...s,{ exerciseId: exId, sets: [{ reps: 5, weight: 0 }] }]))
  }

  function updateSet(exIndex:number,setIndex:number, field:'reps'|'weight', value:number){
    setEntries((prev)=>{
      const copy = JSON.parse(JSON.stringify(prev)) as ExerciseEntry[]
      copy[exIndex].sets[setIndex][field]=value
      return copy
    })
  }

  function addSet(exIndex:number){
    setEntries((prev)=>{
      const copy = JSON.parse(JSON.stringify(prev)) as ExerciseEntry[]
      copy[exIndex].sets.push({ reps:5, weight:0 })
      return copy
    })
  }

  function removeEntry(i:number){
    setEntries((s)=>s.filter((_,idx)=>idx!==i))
  }

  function findLastSessionForExercise(exId: string) {
    const sessions = loadSessions()
    for (const s of sessions) {
      const found = s.exercises.find((e) => e.exerciseId === exId)
      if (found) return { session: s, entry: found }
    }
    return null
  }

  function save(){
    const sessions = loadSessions()
    const session: Session = { id: uid(), date, exercises: entries }
    saveSessions([session, ...sessions])
    setEntries([])
    onSaved()
  }

  return (
    <div className="card">
      <h2>Log Session</h2>
      <div className="row">
        <label>Date</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
      </div>

      <div className="row">
        <label>Search exercise</label>
        <input placeholder="Search exercises..." value={search} onChange={(e)=>setSearch(e.target.value)} />
      </div>

      {search.trim() !== '' && (
        <ul className="list">
          {exercises
            .filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 10)
            .map((ex) => (
              <li key={ex.id} className="list-item">
                <div>
                  <strong>{ex.name}</strong>
                  <div style={{fontSize:12,color:'#6b6b66'}}>{ex.muscleGroup}</div>
                </div>
                <div>
                  <button onClick={()=>addExercise(ex.id)}>Add</button>
                </div>
              </li>
          ))}
        </ul>
      )}

      {entries.map((entry,exIndex)=>{
        const ex = exercises.find(e=>e.id===entry.exerciseId)
        const last = findLastSessionForExercise(entry.exerciseId)
        return (
          <div key={exIndex} className="entry">
            <div className="entry-header">
              <strong>{ex?.name || entry.exerciseId}</strong>
              <button className="danger" onClick={()=>removeEntry(exIndex)}>Remove</button>
            </div>
            {last && (
              <div style={{marginTop:8, fontSize:12, color:'#666'}}>
                <strong>Último:</strong> {new Date(last.session.date).toLocaleDateString()} — {last.entry.sets.map(s=>`${s.reps}x${s.weight}`).join(', ')}
              </div>
            )}
            <table className="sets">
              <thead><tr><th>#</th><th>Reps</th><th>Weight</th></tr></thead>
              <tbody>
                {entry.sets.map((s,setIndex)=> (
                  <tr key={setIndex}>
                    <td>{setIndex+1}</td>
                    <td><input type="number" min={0} value={s.reps} onChange={(e)=>updateSet(exIndex,setIndex,'reps',Number(e.target.value))} /></td>
                    <td><input type="number" min={0} value={s.weight} onChange={(e)=>updateSet(exIndex,setIndex,'weight',Number(e.target.value))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row"><button onClick={()=>addSet(exIndex)}>Add Set</button></div>
          </div>
        )
      })}

      <div className="row">
        <button onClick={save} className="primary">Save Session</button>
      </div>
    </div>
  )
}

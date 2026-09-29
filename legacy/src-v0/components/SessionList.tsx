import React, { useEffect, useMemo, useState } from 'react'
import { loadExercises, loadSessions, saveSessions } from '../utils/storage'
import { Exercise, Session } from '../types'

export default function SessionList({onSelect}:{onSelect?:(s:Session)=>void}){
  const [sessions, setSessions] = useState<Session[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(()=>{
    const nextSessions = loadSessions()
    setSessions(nextSessions)
    setExercises(loadExercises())
  },[])

  const exerciseMap = useMemo(() => {
    return Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.name]))
  }, [exercises])

  const toggleSession = (session: Session) => {
    const nextId = expandedId === session.id ? null : session.id
    setExpandedId(nextId)
    if (nextId) onSelect?.(session)
  }

  const removeSession = (sessionId: string) => {
    const nextSessions = sessions.filter((session) => session.id !== sessionId)
    setSessions(nextSessions)
    saveSessions(nextSessions)
    setExpandedId((current) => (current === sessionId ? null : current))
  }

  return (
    <div className="card">
      <h2>Past Sessions</h2>
      <ul className="list">
        {sessions.map((session) => {
          const isExpanded = expandedId === session.id

          return (
            <React.Fragment key={session.id}>
              <li className="list-item session-item">
                <div onClick={() => toggleSession(session)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div className="muted">{new Date(session.date).toLocaleDateString()}</div>
                    <div>{session.exercises.length} exercises</div>
                  </div>
                  <span className="session-toggle">{isExpanded ? 'Hide' : 'View'}</span>
                </div>
                <button className="danger session-remove-button" onClick={() => removeSession(session.id)}>Remove</button>
              </li>

              {isExpanded && (
                <li className="session-details">
                  {session.exercises.map((entry, index) => {
                    const exerciseName = exerciseMap[entry.exerciseId] ?? 'Unknown exercise'

                    return (
                      <div key={`${session.id}-${entry.exerciseId}-${index}`} className="session-detail-item">
                        <div className="session-detail-header">
                          <strong>{exerciseName}</strong>
                          <span>{entry.sets.length} sets</span>
                        </div>

                        <div className="session-set-list">
                          {entry.sets.map((set, setIndex) => (
                            <div key={`${session.id}-${entry.exerciseId}-${index}-${setIndex}`} className="session-set">
                              <span>Set {setIndex + 1}</span>
                              <strong>{set.weight} kg</strong>
                              <span>x {set.reps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </li>
              )}
            </React.Fragment>
          )
        })}
        {sessions.length === 0 && <li className="muted">No sessions yet</li>}
      </ul>
    </div>
  )
}

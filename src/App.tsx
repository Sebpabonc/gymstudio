import React, { useMemo, useState } from 'react'
import ExerciseManager from './components/ExerciseManager'
import LogSession from './components/LogSession'
import SessionList from './components/SessionList'
import ExerciseProgress from './components/ExerciseProgress'
import WorkoutPlan from './components/WorkoutPlan'
import { loadSessions } from './utils/storage'

const AUTH_KEY = 'borcelle_auth_user'

type AuthUser = {
  email?: string
  phone?: string
  provider: 'gmail' | 'phone'
}

function isRepeatedDigitValue(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 4 && /^((\d)\2{3,})$/.test(digits)
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed || (!parsed.email && !parsed.phone)) return null
    if (parsed.phone && isRepeatedDigitValue(parsed.phone)) {
      localStorage.removeItem(AUTH_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export default function App(){
  const [tab, setTab] = useState<'log'|'list'|'exs'|'progress'|'plan'>('log')
  const [refreshKey, setRefreshKey] = useState(0)
  const [authMode, setAuthMode] = useState<'gmail'|'phone'>('gmail')
  const [authValue, setAuthValue] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const sessions = useMemo(() => loadSessions(), [refreshKey])

  const summary = useMemo(() => {
    const totalSessions = sessions.length
    const totalVolume = sessions.reduce((sum, session) => {
      return sum + session.exercises.reduce((exerciseSum, entry) => {
        return exerciseSum + entry.sets.reduce((setSum, set) => setSum + (set.reps * set.weight), 0)
      }, 0)
    }, 0)

    const allWeights = sessions.flatMap((session) =>
      session.exercises.flatMap((entry) => entry.sets.map((set) => set.weight))
    )

    const bestLift = allWeights.length ? Math.max(...allWeights) : 0
    const latest = sessions[0]?.date ? new Date(sessions[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No sessions'

    return {
      totalSessions,
      totalVolume,
      bestLift,
      latest,
    }
  }, [sessions])

  const statCards = [
    { label: 'Sessions', value: String(summary.totalSessions), detail: 'logged' },
    { label: 'Volume', value: `${summary.totalVolume} kg`, detail: 'total' },
    { label: 'Best lift', value: `${summary.bestLift} kg`, detail: 'max' },
  ]

  const handleLogin = () => {
    const normalized = authValue.trim()

    if (authMode === 'gmail') {
      const validGmail = /^[^\s@]+@gmail\.com$/i.test(normalized)
      if (!validGmail) {
        setError('Use a valid Gmail address ending in @gmail.com')
        return
      }

      const nextUser: AuthUser = { email: normalized, provider: 'gmail' }
      localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
      setError('')
      return
    }

    const digitsOnly = normalized.replace(/[^\d]/g, '')
    const validPhone = /^\d{10,15}$/.test(digitsOnly)
    const repeatedDigits = isRepeatedDigitValue(normalized)

    if (!validPhone || repeatedDigits) {
      setError('Use a valid phone number with at least 10 digits')
      return
    }

    const nextUser: AuthUser = { phone: normalized, provider: 'phone' }
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    setError('')
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
    setAuthValue('')
    setError('')
  }

  if (!user) {
    return (
      <div className="app-shell auth-shell">
        <div className="auth-card">
          <div className="brand-row auth-brand-row">
            <span className="brand-name">Borcelle Fitness</span>
          </div>

          <div className="auth-header">
            <p className="eyebrow">Welcome</p>
            <h1>Sign in</h1>
          </div>

          <div className="auth-toggle" role="tablist" aria-label="Login method">
            <button
              type="button"
              className={authMode === 'gmail' ? 'active' : ''}
              onClick={() => setAuthMode('gmail')}
            >
              Gmail
            </button>
            <button
              type="button"
              className={authMode === 'phone' ? 'active' : ''}
              onClick={() => setAuthMode('phone')}
            >
              Phone
            </button>
          </div>

          <div className="auth-form">
            <label className="auth-label" htmlFor="auth-input">
              {authMode === 'gmail' ? 'Google email' : 'Phone number'}
            </label>
            <input
              id="auth-input"
              type={authMode === 'gmail' ? 'email' : 'tel'}
              value={authValue}
              onChange={(event) => setAuthValue(event.target.value)}
              placeholder={authMode === 'gmail' ? 'name@gmail.com' : '+1 555 123 4567'}
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="button" className="primary auth-button" onClick={handleLogin}>
              {authMode === 'gmail' ? 'Continue with Gmail' : 'Continue with phone'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app">
        <header className="header">
          <div className="brand-row">
            <span className="brand-name">Borcelle Fitness</span>
            <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
          <h1>Gym Studio</h1>
          <p className="tagline">Performance tracking</p>
          <p className="user-pill">{user.email ?? user.phone}</p>
        </header>

        <nav className="tabs" aria-label="App sections">
          <button className={tab==='log'? 'active':''} onClick={()=>setTab('log')}>Log</button>
          <button className={tab==='list'? 'active':''} onClick={()=>setTab('list')}>History</button>
          <button className={tab==='progress'? 'active':''} onClick={()=>setTab('progress')}>Progress</button>
          <button className={tab==='plan'? 'active':''} onClick={()=>setTab('plan')}>Plan</button>
          <button className={tab==='exs'? 'active':''} onClick={()=>setTab('exs')}>Exercises</button>
        </nav>

        <main className="container">
          {tab==='log' && <LogSession key={refreshKey} onSaved={()=>setRefreshKey(k=>k+1)} />}
          {tab==='list' && <SessionList key={refreshKey} />}
          {tab==='progress' && <ExerciseProgress key={refreshKey} />}
          {tab==='plan' && <WorkoutPlan />}
          {tab==='exs' && <ExerciseManager key={refreshKey} />}
        </main>

        <footer className="footer">Borcelle Fitness • local tracking</footer>
      </div>
    </div>
  )
}

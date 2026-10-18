import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WorkoutPlan from './components/WorkoutPlan'
import ExerciseFinder from './components/ExerciseFinder'
import RestTimer from './components/RestTimer'
import { syncRestTimerActivity } from './native/restTimerActivity'
import { localizeCatalogue, useSpanishContentReady } from './i18n/content'
import HelpAndAi from './components/HelpAndAi'
import { localIsoDate } from './lib/dates'
import { AppTab, getNavigationTitle, navigationTabs } from './navigation'
import { Exercise, WorkoutEntry } from './types'
import { useAuth } from './auth/AuthProvider'
import { useTextEntryFocused } from './utils/textEntryFocus'
import { loadDemoBlocks } from './plans/demoBlock'
import { exitDemoMode, isDemoMode } from './utils/demoMode'
import {
  dismissWelcome,
  hasDismissedWelcome,
  loadExercises,
  loadRestTimerState,
  loadWorkoutHistory,
  deleteWorkoutEntry,
  refreshCatalogue,
  restoreWorkoutEntry,
  saveWorkoutHistory,
  saveRestTimerState,
  recordHelpAiAppOpen,
} from './utils/storage'
import { useT } from './i18n'
import { RestTimerState, startRestTimer } from './utils/restTimer'

const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))
const ProfileDataSections = lazy(() => import('./screens/ProfileDataSections'))
const ProgressScreen = lazy(() => import('./screens/ProgressScreen'))

export default function App() {
  const demoMode = isDemoMode()
  const { status, syncStatus, user, pendingSyncCount, syncSignInRequired } = useAuth()
  const [rawExercises, setExercises] = useState<Exercise[]>([])
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [demoHistoryReady, setDemoHistoryReady] = useState(!demoMode)
  const [findExerciseId, setFindExerciseId] = useState('')
  const [activeTab, setActiveTab] = useState<AppTab>('today')
  const [workoutModeActive, setWorkoutModeActive] = useState(false)
  const [showHelpPulse] = useState(() => recordHelpAiAppOpen() <= 3)
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(() => loadRestTimerState())
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const headerSentinelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const dockHidden = useTextEntryFocused()
  const [showWelcome, setShowWelcome] = useState(() => !hasDismissedWelcome())
  const [exerciseMode, setExerciseMode] = useState<'lookup' | 'custom'>('lookup')
  const [progressExerciseId, setProgressExerciseId] = useState('')
  const { t, language, setLanguage } = useT()
  const spanishReady = useSpanishContentReady(language)
  const exercises = useMemo(() => localizeCatalogue(rawExercises, language), [rawExercises, language, spanishReady])

  const restLabel = useRef(t('rest.label'))
  const updateRestTimer = useCallback((timer: RestTimerState | null) => {
    saveRestTimerState(timer)
    setRestTimer(timer)
    void syncRestTimerActivity(timer, restLabel.current, false)
  }, [])
  const startRest = useCallback((durationSeconds: number, label?: string) => {
    restLabel.current = label || t('rest.label')
    const timer = startRestTimer(durationSeconds)
    saveRestTimerState(timer)
    setRestTimer(timer)
    void syncRestTimerActivity(timer, restLabel.current, true)
  }, [t])

  const [scrollToPlan, setScrollToPlan] = useState(false)
  const openPlanSection = useCallback(() => {
    setScrollToPlan(true)
    setActiveTab('you')
  }, [])

  useEffect(() => {
    if (!scrollToPlan || activeTab !== 'you') return
    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      const target = document.getElementById('profile-plan-title')
      if (target || attempts >= 30) {
        window.clearInterval(timer)
        target?.scrollIntoView({ block: 'start' })
        setScrollToPlan(false)
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [scrollToPlan, activeTab])

  useEffect(() => {
    const sentinel = headerSentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderCollapsed(!entry.isIntersecting),
      { root: contentRef.current, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    const readHistory = async () => {
      const savedHistory = await loadWorkoutHistory()
      if (!demoMode) return savedHistory
      if (savedHistory.length > 0) {
        setDemoHistoryReady(true)
        return savedHistory
      }

      const blocks = await loadDemoBlocks()
      const { generateDemoHistory } = await import('./demo/generateDemoHistory')
      const generatedHistory = generateDemoHistory({ blocks, endDate: localIsoDate(), months: 6, seed: 26 })
      saveWorkoutHistory(generatedHistory)
      setDemoHistoryReady(true)
      return generatedHistory
    }

    void (async () => {
      const refresh = refreshCatalogue()
      const cachedExercises = await loadExercises(false)
      if (cancelled) return
      if (cachedExercises.length) {
        setExercises(cachedExercises)
        setHistory(await readHistory())
      }

      const refreshedCatalogue = await refresh
      if (!refreshedCatalogue?.length && !cachedExercises.length) {
        const [offlineExercises, offlineHistory] = await Promise.all([loadExercises(), readHistory()])
        if (cancelled) return
        setExercises(offlineExercises)
        setHistory(offlineHistory)
        return
      }
      if (!refreshedCatalogue?.length || cancelled) return

      const [updatedExercises, updatedHistory] = await Promise.all([loadExercises(false), readHistory()])
      if (cancelled) return
      setExercises(updatedExercises)
      setHistory(updatedHistory)
    })()

    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (activeTab !== 'exercises') {
      setFindExerciseId('')
    }
  }, [activeTab])



  return (
    <div className={`app-shell layout-boxes${workoutModeActive ? ' workout-mode-active' : ''}`}>
      <div className="phone-frame">
        <main className={`app-content${restTimer ? ' with-rest-timer' : ''}`} ref={contentRef}>
          <div className="header-sentinel" ref={headerSentinelRef} aria-hidden="true" />
          <div className={`brand-bar${headerCollapsed ? ' collapsed' : ''}`}>
            <span className="brand-bar-title" aria-hidden="true">
              <span className="brand-bar-wordmark">Gym Studio</span>
              <span className="brand-bar-screen">{getNavigationTitle(activeTab, t)}</span>
            </span>
            <span className="brand-bar-actions">
            <span className="layout-toggle language-toggle" role="group" aria-label={t('lang.label')}>
              <button
                type="button"
                aria-label={t('lang.en')}
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                aria-label={t('lang.es')}
                aria-pressed={language === 'es'}
                onClick={() => setLanguage('es')}
              >
                ES
              </button>
            </span>
            <span
              className={`sync-indicator ${status === 'signed-in' ? syncStatus : demoMode ? 'demo' : 'local'}`}
              role="status"
              aria-label={syncSignInRequired ? t('profile.syncSignInRequired') : status === 'signed-in' ? t('sync.aria.signedIn', { status: t(`sync.${syncStatus}`) }) : demoMode ? t('sync.aria.demo') : t('sync.aria.local')}
            />
            {status === 'signed-in' && pendingSyncCount > 0 && (
              <span className="sync-pending-count" role="status" aria-label={t('profile.pendingLogs', { count: pendingSyncCount })}>
                {pendingSyncCount}
              </span>
            )}
            </span>
          </div>
          <header className={`brand-header${headerCollapsed ? ' collapsed' : ''}`}>
            <span className="brand-tagline" aria-hidden="true">{t('header.tagline')}</span>
            <span className="brand-wordmark" aria-hidden="true">Gym Studio</span>
            <h1>{getNavigationTitle(activeTab, t)}</h1>
          </header>
          <div className="screen-surface">
          {activeTab === 'exercises' && (
            <div className="exercise-mode-switch" role="group" aria-label={t('exercises.tools')}>
              <button
                type="button"
                className={exerciseMode === 'lookup' ? 'active' : ''}
                aria-pressed={exerciseMode === 'lookup'}
                onClick={() => setExerciseMode('lookup')}
              >
                {t('exercises.find')}
              </button>
              <button
                type="button"
                className={exerciseMode === 'custom' ? 'active' : ''}
                aria-pressed={exerciseMode === 'custom'}
                onClick={() => setExerciseMode('custom')}
              >
                {t('exercises.custom')}
              </button>
            </div>
          )}
          {activeTab === 'you' ? (
            demoMode ? (
              <Suspense fallback={<section className="card account-screen">{t('account.loading')}</section>}>
                <>
                  <ProfileDataSections />
                  <section className="card account-screen">
                    <h2>{t('demo.title')}</h2>
                    <p className="account-message">{t('demo.message')}</p>
                    <button type="button" className="secondary-button" onClick={exitDemoMode}>{t('demo.exit')}</button>
                  </section>
                </>
              </Suspense>
            ) : (
              <Suspense fallback={<section className="card account-screen">{t('account.loading')}</section>}>
                {status === 'signed-in'
                  ? <ProfileScreen onClose={() => setActiveTab('today')} />
                  // Signed out: sign-in first; goal/plan/measurements need an account, so they appear after signing in.
                  : <LoginScreen onClose={() => setActiveTab('today')} />}
              </Suspense>
            )
          ) : activeTab === 'progress' ? (
            demoMode && !demoHistoryReady ? (
              <section className="card" aria-live="polite">
                <p className="empty-state">{t('demo.loadingHistory')}</p>
              </section>
            ) : (
              <Suspense fallback={<section className="card">{t('app.loadingProgress')}</section>}>
                <ProgressScreen
                  entries={history}
                  exercises={exercises}
                  authStatus={status}
                  authUserId={user?.id ?? null}
                  initialExerciseId={progressExerciseId || undefined}
                  onDeleteEntry={async (entryId) => setHistory(await deleteWorkoutEntry(entryId))}
                  onRestoreEntry={async (entry) => setHistory(restoreWorkoutEntry(entry))}
                  onOpenExercise={(exerciseId) => {
                    setFindExerciseId(exerciseId)
                    setExerciseMode('lookup')
                    setActiveTab('exercises')
                  }}
                  onSignIn={() => setActiveTab('you')}
                />
              </Suspense>
            )
          ) : activeTab === 'today' ? (
            demoMode && !demoHistoryReady ? (
              <section className="card" aria-live="polite">
                <p className="empty-state">{t('demo.loadingHistory')}</p>
              </section>
            ) : (
              <>
                {showWelcome && (
                  <section className="card welcome-card" aria-labelledby="welcome-title">
                    <h2 id="welcome-title">{t('welcome.title')}</h2>
                    <ul>
                      <li>{t('welcome.plan')}</li>
                      <li>{t('welcome.log')}</li>
                      <li>{t('welcome.track')}</li>
                    </ul>
                    <div className="welcome-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          dismissWelcome()
                          setShowWelcome(false)
                        }}
                      >
                        {t('welcome.gotIt')}
                      </button>
                      {!demoMode && <a className="secondary-button" href="?demo=1">{t('welcome.demo')}</a>}
                    </div>
                  </section>
                )}
                <WorkoutPlan
                  mode="preset"
                  lockMode
                  authStatus={status}
                  authUserId={user?.id ?? null}
                  onSignIn={() => setActiveTab('you')}
                  onCreatePlan={openPlanSection}
                  onStartRest={startRest}
                  onWorkoutModeChange={setWorkoutModeActive}
                  restTimer={restTimer}
                  onRestTimerChange={updateRestTimer}
                />
              </>
            )
          ) : exerciseMode === 'custom' ? (
            <WorkoutPlan mode="custom" lockMode authStatus={status} authUserId={user?.id ?? null} onSignIn={() => setActiveTab('you')} onStartRest={startRest} />
          ) : (
            <ExerciseFinder
              exercises={exercises}
              history={history}
              onHistoryChange={setHistory}
              onExercisesChange={setExercises}
              onProgress={(id) => {
                setProgressExerciseId(id)
                setActiveTab('progress')
              }}
              authStatus={status}
              initialExerciseId={findExerciseId}
            />
          )}
          </div>
        </main>
        <nav className={`bottom-tab-bar${dockHidden ? ' hidden' : ''}`} aria-label={t('nav.aria')}>
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'exercises') {
                  setFindExerciseId('')
                  setExerciseMode('lookup')
                  void loadWorkoutHistory().then(setHistory)
                }
                if (tab.id === 'progress') {
                  setProgressExerciseId('')
                  void loadWorkoutHistory().then(setHistory)
                }
              }}
            >
              <NavigationIcon name={tab.icon} />
              <span className="visually-hidden">{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>
        {!workoutModeActive && <RestTimer timer={restTimer} hidden={dockHidden} onChange={updateRestTimer} />}
        <HelpAndAi
          activeTab={activeTab}
          hidden={dockHidden}
          showPulse={showHelpPulse}
          onSignIn={() => setActiveTab('you')}
        />
      </div>
    </div>
  )
}

function NavigationIcon({ name }: { name: (typeof navigationTabs)[number]['icon'] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'home' ? (
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z" />
      ) : name === 'search' ? (
        <>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </>
      ) : name === 'chart' ? (
        <>
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 3 3 6-7" />
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
    </svg>
  )
}

import React, { FormEvent, useState } from 'react'
import { askExercise } from '../ai/askExercise'
import { useAuth } from '../auth/AuthProvider'
import { isDemoMode } from '../utils/demoMode'
import type { AskExerciseAiConsent } from '../utils/storage'
import {
  getAskExerciseAiConsent,
  setAskExerciseAiConsent,
} from '../utils/storage'

const suggestedQuestions = [
  'Where should I feel this?',
  'How do I fix my form?',
  'What weight should I try next?',
]

type AskExerciseProps = {
  exerciseId: string
  exerciseName: string
  onSignIn: () => void
}

function initialConsent(): AskExerciseAiConsent | null {
  return getAskExerciseAiConsent()
}

export default function AskExercise({ exerciseId, exerciseName, onSignIn }: AskExerciseProps) {
  const { status } = useAuth()
  const demoMode = isDemoMode()
  const [open, setOpen] = useState(false)
  const [consent, setConsent] = useState<AskExerciseAiConsent | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [remainingToday, setRemainingToday] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const needsSignIn = error === 'Sign in to ask AI.'

  const openSheet = () => {
    if (demoMode) return
    if (status !== 'signed-in') {
      onSignIn()
      return
    }
    setConsent(initialConsent())
    setQuestion('')
    setAnswer('')
    setRemainingToday(null)
    setError('')
    setOpen(true)
  }

  const closeSheet = () => {
    if (pending) return
    setOpen(false)
  }

  const chooseConsent = (choice: AskExerciseAiConsent) => {
    setAskExerciseAiConsent(choice)
    setConsent(choice)
    if (choice === 'declined') setOpen(false)
  }

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || pending) return

    setError('')
    setAnswer('')
    setRemainingToday(null)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError("You're offline.")
      return
    }

    setPending(true)
    try {
      const response = await askExercise(exerciseId, trimmedQuestion)
      setAnswer(response.answer)
      setRemainingToday(response.remainingToday)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'AI is unavailable right now. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="ask-ai-button"
        disabled={demoMode || status === 'loading'}
        onClick={openSheet}
      >
        {demoMode || status === 'signed-out' ? 'Sign in to ask AI' : 'Ask AI'}
      </button>
      {open && (
        <div className="ask-exercise-overlay" role="presentation" onClick={closeSheet}>
          <section
            className="ask-exercise-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-exercise-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ask-exercise-sheet-header">
              <div>
                <p className="field-label">Ask AI</p>
                <h2 id="ask-exercise-title">{exerciseName}</h2>
              </div>
              <button type="button" className="toggle-button" onClick={closeSheet} disabled={pending}>
                Close
              </button>
            </div>

            {consent !== 'enabled' ? (
              <div className="ask-exercise-consent">
                <p>
                  Your question, this exercise and your last 5 sessions of it are sent to OpenAI to answer. Nothing else.
                </p>
                <div className="ask-exercise-actions">
                  <button type="button" className="primary-button" onClick={() => chooseConsent('enabled')}>
                    Turn on AI
                  </button>
                  <button type="button" className="secondary-button" onClick={() => chooseConsent('declined')}>
                    Not now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="ask-exercise-suggestions" aria-label="Suggested questions">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="chip ask-exercise-suggestion"
                      onClick={() => setQuestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <form className="ask-exercise-form" onSubmit={submitQuestion}>
                  <label className="field-label" htmlFor="ask-exercise-question">Your question</label>
                  <textarea
                    id="ask-exercise-question"
                    maxLength={300}
                    rows={3}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    aria-describedby="ask-exercise-counter"
                  />
                  <div className="ask-exercise-form-footer">
                    <span id="ask-exercise-counter">{question.length}/300</span>
                    <button type="submit" className="primary-button" disabled={pending || !question.trim()}>
                      {pending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </form>
                {error && (
                  <div className="ask-exercise-error" role="alert">
                    <p>{error}</p>
                    {needsSignIn && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setOpen(false)
                          onSignIn()
                        }}
                      >
                        Sign in
                      </button>
                    )}
                  </div>
                )}
                {answer && (
                  <div className="ask-exercise-answer" aria-live="polite">
                    <p>{answer}</p>
                    {remainingToday !== null && <small>{remainingToday} questions left today</small>}
                  </div>
                )}
              </>
            )}

            <p className="ask-exercise-disclaimer">AI answers can be wrong. Not medical advice.</p>
          </section>
        </div>
      )}
    </>
  )
}

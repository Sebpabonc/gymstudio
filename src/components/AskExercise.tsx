import React, { FormEvent, useState } from 'react'
import { askExercise, mapAiGatewayError } from '../ai/gateway'
import { useAuth } from '../auth/AuthProvider'
import { isDemoMode } from '../utils/demoMode'
import type { AskExerciseAiConsent } from '../utils/storage'
import AiConsentPrompt from './AiConsentPrompt'
import { useT } from '../i18n'
import {
  getAskExerciseAiConsent,
  setAskExerciseAiConsent,
} from '../utils/storage'

const suggestedQuestionKeys = ['ai.q1', 'ai.q2', 'ai.q3'] as const

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
  const { t, language } = useT()
  const demoMode = isDemoMode()
  const [open, setOpen] = useState(false)
  const [consent, setConsent] = useState<AskExerciseAiConsent | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [remainingToday, setRemainingToday] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const needsSignIn = error === mapAiGatewayError('sign_in_required', language)

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
      setError(mapAiGatewayError('offline', language))
      return
    }

    setPending(true)
    try {
      const response = await askExercise(exerciseId, trimmedQuestion, language)
      setAnswer(response.answer)
      setRemainingToday(response.remainingToday)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : mapAiGatewayError('unknown', language))
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
        {demoMode || status === 'signed-out' ? t('ai.signInToAsk') : t('ai.ask')}
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
                <p className="field-label">{t('ai.ask')}</p>
                <h2 id="ask-exercise-title">{exerciseName}</h2>
              </div>
              <button type="button" className="toggle-button" onClick={closeSheet} disabled={pending}>
                {t('ai.close')}
              </button>
            </div>

            {consent === null ? (
              <div className="ask-exercise-consent">
                <AiConsentPrompt onChoice={chooseConsent} />
              </div>
            ) : consent === 'declined' ? (
              <p className="ask-exercise-consent-message">{t('ai.declinedMessage')}</p>
            ) : (
              <>
                <div className="ask-exercise-suggestions" aria-label={t('ai.suggestedQuestions')}>
                  {suggestedQuestionKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="chip ask-exercise-suggestion"
                      onClick={() => setQuestion(t(key))}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
                <form className="ask-exercise-form" onSubmit={submitQuestion}>
                  <label className="field-label" htmlFor="ask-exercise-question">{t('ai.yourQuestion')}</label>
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
                      {pending ? t('ai.sending') : t('ai.send')}
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
                        {t('ai.signIn')}
                      </button>
                    )}
                  </div>
                )}
                {answer && (
                  <div className="ask-exercise-answer" aria-live="polite">
                    <p>{answer}</p>
                    {remainingToday !== null && <small>{t('ai.questionsLeft', { count: remainingToday })}</small>}
                  </div>
                )}
              </>
            )}

            <p className="ask-exercise-disclaimer">{t('ai.disclaimer')}</p>
          </section>
        </div>
      )}
    </>
  )
}

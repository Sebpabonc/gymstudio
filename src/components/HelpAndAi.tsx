import React, { FormEvent, useEffect, useRef, useState } from 'react'
import packageJson from '../../package.json'
import { askGeneral, mapAiGatewayError } from '../ai/gateway'
import { useAuth } from '../auth/AuthProvider'
import { AppTab, getNavigationTitle } from '../navigation'
import { submitFeedback, FeedbackType } from '../utils/feedback'
import {
  AskExerciseAiConsent,
  getAskExerciseAiConsent,
  setAskExerciseAiConsent,
} from '../utils/storage'
import { TranslationKey, useT } from '../i18n'
import AiConsentPrompt from './AiConsentPrompt'

const suggestedQuestionKeys = ['help.ai.suggestion1', 'help.ai.suggestion2', 'help.ai.suggestion3'] as const
const feedbackTypes: Array<{ value: FeedbackType; label: TranslationKey }> = [
  { value: 'problem', label: 'help.feedback.problem' },
  { value: 'idea', label: 'help.feedback.idea' },
  { value: 'content', label: 'help.feedback.content' },
  { value: 'other', label: 'help.feedback.other' },
]

type ChatMessage = { role: 'user' | 'assistant'; text: string }

type HelpAndAiProps = {
  activeTab: AppTab
  hidden: boolean
  showPulse: boolean
  onSignIn: () => void
}

export default function HelpAndAi({ activeTab, hidden, showPulse, onSignIn }: HelpAndAiProps) {
  const { status } = useAuth()
  const { t, language } = useT()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'ai' | 'feedback'>('ai')
  const [consent, setConsent] = useState<AskExerciseAiConsent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [remainingToday, setRemainingToday] = useState<number | null>(null)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('problem')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, error])

  const openSheet = () => {
    setConsent(getAskExerciseAiConsent())
    setError('')
    setOpen(true)
  }

  const chooseConsent = (choice: AskExerciseAiConsent) => {
    setAskExerciseAiConsent(choice)
    setConsent(choice)
  }

  const ask = async (value: string) => {
    const trimmedQuestion = value.trim()
    if (!trimmedQuestion || pending) return

    setError('')
    setMessages((current) => [...current, { role: 'user', text: trimmedQuestion }])
    setQuestion('')
    setPending(true)
    try {
      const response = await askGeneral(trimmedQuestion, language)
      setMessages((current) => [...current, { role: 'assistant', text: response.answer }])
      setRemainingToday(response.remainingToday)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : mapAiGatewayError('unknown', language))
    } finally {
      setPending(false)
    }
  }

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ask(question)
  }

  const sendFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = feedbackMessage.trim()
    if (!message || pending) return
    setError('')
    setPending(true)
    try {
      await submitFeedback({
        type: feedbackType,
        message,
        appVersion: packageJson.version,
        screen: activeTab,
        language,
      })
      setFeedbackSent(true)
      setFeedbackMessage('')
    } catch {
      setError(t('help.feedback.error'))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`help-ai-button${hidden ? ' hidden' : ''}`}
        aria-label={t('help.button')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSheet}
      >
        {showPulse && <span className="help-ai-pulse" aria-hidden="true" />}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 1.7 4.6L18.3 9.3 13.7 11 12 15.6 10.3 11 5.7 9.3l4.6-1.7z" />
          <path d="m18.5 14.5.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z" />
        </svg>
      </button>
      {open && (
        <div
          className="help-ai-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            className="help-ai-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-ai-title"
          >
            <header className="help-ai-header">
              <div className="help-ai-tabs" role="tablist" aria-label={t('help.tabs')}>
                <button
                  id="help-ai-tab"
                  type="button"
                  role="tab"
                  aria-selected={tab === 'ai'}
                  aria-controls="help-ai-panel"
                  onClick={() => setTab('ai')}
                >
                  {t('help.tab.ai')}
                </button>
                <button
                  id="help-feedback-tab"
                  type="button"
                  role="tab"
                  aria-selected={tab === 'feedback'}
                  aria-controls="help-ai-panel"
                  onClick={() => setTab('feedback')}
                >
                  {t('help.tab.feedback')}
                </button>
              </div>
              <h2 id="help-ai-title" className="visually-hidden">{t('help.button')}</h2>
              <button
                type="button"
                className="help-ai-close"
                aria-label={t('ai.close')}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="help-ai-panel" id="help-ai-panel" role="tabpanel" aria-labelledby={tab === 'ai' ? 'help-ai-tab' : 'help-feedback-tab'}>
              {status !== 'signed-in' ? (
                <div className="help-ai-sign-in">
                  <p>{t('help.signInRequired')}</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setOpen(false)
                      onSignIn()
                    }}
                  >
                    {t('ai.signIn')}
                  </button>
                </div>
              ) : tab === 'ai' ? (
                consent === null ? (
                  <div className="help-ai-consent">
                    <AiConsentPrompt onChoice={chooseConsent} bodyKey="help.ai.consent" />
                  </div>
                ) : consent === 'declined' ? (
                  <div className="help-ai-body">
                    <p>{t('ai.declinedMessage')}</p>
                  </div>
                ) : (
                  <>
                    <div className="help-ai-body" ref={chatRef}>
                      <p className="help-ai-hint">{t('help.ai.hint')}</p>
                      {!messages.length && (
                        <div className="help-ai-suggestions" aria-label={t('ai.suggestedQuestions')}>
                          {suggestedQuestionKeys.map((key) => (
                            <button
                              key={key}
                              type="button"
                              className="help-ai-chip"
                              disabled={pending}
                              onClick={() => void ask(t(key))}
                            >
                              {t(key)}
                            </button>
                          ))}
                        </div>
                      )}
                      {messages.length > 0 && (
                        <div className="help-ai-chat" role="log" aria-live="polite">
                          {messages.map((message, index) => (
                            <p className={`help-ai-message ${message.role}`} key={`${message.role}-${index}`}>
                              {message.text}
                            </p>
                          ))}
                        </div>
                      )}
                      {error && <p className="help-ai-error" role="alert">{error}</p>}
                    </div>
                    <div className="help-ai-footer">
                      <form className="help-ai-composer" onSubmit={submitQuestion}>
                        <textarea
                          maxLength={300}
                          rows={1}
                          value={question}
                          onChange={(event) => setQuestion(event.target.value)}
                          placeholder={t('help.ai.placeholder')}
                          aria-label={t('help.ai.placeholder')}
                        />
                        <button type="submit" className="primary-button" disabled={pending || !question.trim()}>
                          {pending ? t('ai.sending') : t('ai.send')}
                        </button>
                      </form>
                      {remainingToday !== null && (
                        <p className="help-ai-footnote">{t('ai.questionsLeft', { count: remainingToday })}</p>
                      )}
                      <p className="help-ai-footnote">{t('ai.disclaimer')}</p>
                    </div>
                  </>
                )
              ) : feedbackSent ? (
                <div className="help-ai-thanks">
                  <span aria-hidden="true">✓</span>
                  <strong>{t('help.feedback.thanks')}</strong>
                  <p>{t('help.feedback.thanksSub')}</p>
                  <button
                    type="button"
                    className="help-ai-chip"
                    onClick={() => {
                      setFeedbackSent(false)
                      setError('')
                    }}
                  >
                    {t('help.feedback.another')}
                  </button>
                </div>
              ) : (
                <div className="help-ai-feedback">
                  <p className="help-ai-hint">{t('help.feedback.hint')}</p>
                  <div className="help-ai-feedback-types" role="group" aria-label={t('help.feedback.type')}>
                    {feedbackTypes.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        className="help-ai-chip"
                        aria-pressed={feedbackType === value}
                        onClick={() => setFeedbackType(value)}
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                  <p className="help-ai-footnote">{t('help.feedback.metadata', { screen: getNavigationTitle(activeTab, t) })}</p>
                  <form className="help-ai-feedback-form" onSubmit={sendFeedback}>
                    <textarea
                      maxLength={1000}
                      rows={4}
                      value={feedbackMessage}
                      onChange={(event) => setFeedbackMessage(event.target.value)}
                      placeholder={t('help.feedback.placeholder')}
                      aria-label={t('help.feedback.placeholder')}
                    />
                    {error && <p className="help-ai-error" role="alert">{error}</p>}
                    <button type="submit" className="primary-button" disabled={pending || !feedbackMessage.trim()}>
                      {pending ? t('ai.sending') : t('ai.send')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

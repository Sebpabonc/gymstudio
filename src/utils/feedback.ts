import type { Language } from '../i18n/translate'
import { getSupabaseClient } from '../lib/supabaseClient'

export type FeedbackType = 'problem' | 'idea' | 'content' | 'other'

export type FeedbackSubmission = {
  type: FeedbackType
  message: string
  appVersion: string
  screen: string
  language: Language
}

export async function submitFeedback(feedback: FeedbackSubmission) {
  const client = await getSupabaseClient()
  if (!client) throw new Error('feedback_unavailable')

  const { error } = await client.from('feedback').insert({
    type: feedback.type,
    message: feedback.message,
    app_version: feedback.appVersion,
    screen: feedback.screen,
    language: feedback.language,
  })
  if (error) throw new Error('feedback_unavailable')
}

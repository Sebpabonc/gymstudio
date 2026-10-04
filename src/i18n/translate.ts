import { en, Dictionary } from './en'
import type { TranslationKey } from './en'
import { es } from './es'

export type { TranslationKey }
export type Language = 'en' | 'es'
export type TranslationParams = Record<string, string | number>
export type Translate = (key: TranslationKey, params?: TranslationParams) => string

export const dictionaries: Record<Language, Dictionary> = { en, es }

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'es'
}

/** Device language: Spanish when the browser language starts with "es", English otherwise. */
export function detectLanguage(navigatorLanguage?: string): Language {
  const value =
    navigatorLanguage ?? (typeof navigator !== 'undefined' ? navigator.language : '')
  return typeof value === 'string' && value.toLowerCase().startsWith('es') ? 'es' : 'en'
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}

/** Looks up a key in the language dictionary; falls back to English, then to the key itself. */
export function translate(language: Language, key: TranslationKey, params?: TranslationParams): string {
  const template = (dictionaries[language] as Partial<Dictionary>)[key] ?? en[key] ?? key
  return interpolate(template, params)
}

export function createTranslator(language: Language): Translate {
  return (key, params) => translate(language, key, params)
}

export function localeFor(language: Language) {
  return language === 'es' ? 'es-MX' : 'en-US'
}

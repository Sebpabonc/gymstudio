import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getLanguage, setLanguage as persistLanguage } from '../utils/storage'
import { detectLanguage, createTranslator, Language, localeFor, Translate } from './translate'

type LanguageContextValue = {
  language: Language
  locale: string
  t: Translate
  setLanguage: (language: Language) => void
}

const defaultTranslate = createTranslator('en')

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  locale: localeFor('en'),
  t: defaultTranslate,
  setLanguage: () => undefined,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getLanguage() ?? detectLanguage())

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    persistLanguage(next)
    setLanguageState(next)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({ language, locale: localeFor(language), t: createTranslator(language), setLanguage }),
    [language, setLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useT() {
  return useContext(LanguageContext)
}

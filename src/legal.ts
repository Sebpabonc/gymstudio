import type { Language } from './i18n'

// Public legal pages built by scripts/build-legal-pages.mjs from the PO-approved text in docs/governance/app-store/.
// Absolute URLs so the iOS app opens them in Safari instead of looking inside its own bundle.
export const LEGAL_BASE_URL = 'https://sebpabonc.github.io/gymstudio'

export type LegalPage = 'privacy' | 'terms' | 'support'

export function legalUrl(page: LegalPage, language: Language): string {
  return `${LEGAL_BASE_URL}/${page}/${language === 'es' ? 'es/' : ''}`
}

import type { TranslationKey } from './i18n'

export const navigationTabs = [
  { id: 'today', label: 'Today', labelKey: 'nav.today', icon: 'home' },
  { id: 'exercises', label: 'Exercises', labelKey: 'nav.exercises', icon: 'search' },
  { id: 'progress', label: 'Progress', labelKey: 'nav.progress', icon: 'chart' },
  { id: 'you', label: 'You', labelKey: 'nav.you', icon: 'person' },
] as const satisfies ReadonlyArray<{ id: string; label: string; labelKey: TranslationKey; icon: string }>

export type AppTab = (typeof navigationTabs)[number]['id']

export function getNavigationTitle(tab: AppTab, t?: (key: TranslationKey) => string) {
  const item = navigationTabs.find((entry) => entry.id === tab)
  if (!item) return t ? t('nav.today') : 'Today'
  return t ? t(item.labelKey) : item.label
}

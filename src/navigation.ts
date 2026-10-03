export const navigationTabs = [
  { id: 'today', label: 'Today', icon: 'home' },
  { id: 'exercises', label: 'Exercises', icon: 'search' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'you', label: 'You', icon: 'person' },
] as const

export type AppTab = (typeof navigationTabs)[number]['id']

export function getNavigationTitle(tab: AppTab) {
  return navigationTabs.find((item) => item.id === tab)?.label ?? 'Today'
}

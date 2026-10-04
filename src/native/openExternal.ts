import { Capacitor } from '@capacitor/core'

/**
 * Opens an external page without leaving the app: an in-app Safari sheet on iOS/Android,
 * a new tab on the web.
 */
export async function openExternal(url: string) {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url, presentationStyle: 'popover' })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

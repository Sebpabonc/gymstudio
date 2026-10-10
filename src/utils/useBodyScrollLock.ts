import { useEffect } from 'react'

let activeLocks = 0
let originalOverflow = ''
let originalContentOverflow = ''
let originalContentOverscroll = ''
let lockedContent: HTMLElement | null = null

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return undefined

    if (activeLocks === 0) {
      originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      lockedContent = document.querySelector<HTMLElement>('.app-content')
      if (lockedContent) {
        originalContentOverflow = lockedContent.style.overflowY
        originalContentOverscroll = lockedContent.style.overscrollBehavior
        lockedContent.style.overflowY = 'hidden'
        lockedContent.style.overscrollBehavior = 'none'
      }
    }
    activeLocks += 1

    return () => {
      activeLocks -= 1
      if (activeLocks === 0) {
        document.body.style.overflow = originalOverflow
        if (lockedContent) {
          lockedContent.style.overflowY = originalContentOverflow
          lockedContent.style.overscrollBehavior = originalContentOverscroll
        }
        originalOverflow = ''
        originalContentOverflow = ''
        originalContentOverscroll = ''
        lockedContent = null
      }
    }
  }, [locked])
}

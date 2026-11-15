import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ExerciseVideo as ExerciseVideoClip } from '../data/exerciseVideos'
import { prefersReducedMotion } from '../utils/motion'
import { useBodyScrollLock } from '../utils/useBodyScrollLock'

export type ExerciseVideoLabels = {
  /** Accessible name of the tile, e.g. "Watch technique video: Incline press". */
  open: string
  close: string
  normal: string
  slow: string
  /** Text on the play badge shown under reduced motion. */
  badge: string
  /** Label before the squeeze cue in the full-screen player. */
  cue: string
}

type ExerciseVideoProps = {
  video: ExerciseVideoClip
  title: string
  labels: ExerciseVideoLabels
  /** The exercise's squeeze cue, shown in the full-screen player when it has one. */
  cue?: string
  /** True only while this is the active exercise card; otherwise the clip stays paused. */
  active: boolean
}

export const SLOW_PLAYBACK_RATE = 0.5

/** Plays the clip only when it may move: active card, on screen, no reduced motion, player closed. */
export function shouldPlayTile(active: boolean, inView: boolean, reducedMotion: boolean, playerOpen: boolean) {
  return active && inView && !reducedMotion && !playerOpen
}

/** Pauses or plays a video element without surfacing autoplay rejections (the poster stays). */
function syncPlayback(video: HTMLVideoElement | null, play: boolean) {
  if (!video) return
  // React sets `muted` as a property; keep it forced so a clip can never play sound.
  video.muted = true
  if (play) {
    const attempt = video.play?.()
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => undefined)
  } else {
    video.pause?.()
  }
}

/**
 * #442 option A: a silent looping technique clip under the exercise name. Tapping it opens a
 * full-screen player with a Normal / Slow 0.5× toggle. A clip that fails to load hides the tile.
 */
export default function ExerciseVideo({ video, title, labels, cue, active }: ExerciseVideoProps) {
  const tileRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion] = useState(() => prefersReducedMotion())
  const [inView, setInView] = useState(false)
  const [seen, setSeen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const tile = tileRef.current
    if (!tile) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      setSeen(true)
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting)
      setInView(visible)
      if (visible) setSeen(true)
    }, { threshold: 0.25 })
    observer.observe(tile)
    return () => observer.disconnect()
  }, [failed])

  const play = shouldPlayTile(active, inView, reducedMotion, open)
  useEffect(() => {
    syncPlayback(videoRef.current, play)
  }, [play, seen])

  const close = useCallback(() => {
    setOpen(false)
    tileRef.current?.focus()
  }, [])

  if (failed) return null

  return (
    <>
      <button
        ref={tileRef}
        type="button"
        className={`exercise-video${reducedMotion ? ' exercise-video-still' : ''}`}
        aria-haspopup="dialog"
        aria-label={labels.open}
        onClick={() => setOpen(true)}
      >
        <video
          ref={videoRef}
          className="exercise-video-media"
          src={video.src}
          poster={video.poster}
          muted
          loop
          playsInline
          preload={seen && !reducedMotion ? 'auto' : 'none'}
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setFailed(true)}
        />
        {reducedMotion && (
          <span className="exercise-video-badge" aria-hidden="true">
            <span className="exercise-video-badge-icon">▶</span>
            {labels.badge}
          </span>
        )}
      </button>
      {open && (
        <ExerciseVideoPlayer video={video} title={title} labels={labels} cue={cue}
          onClose={close} onError={() => { close(); setFailed(true) }} />
      )}
    </>
  )
}

type PlayerProps = {
  video: ExerciseVideoClip
  title: string
  labels: ExerciseVideoLabels
  cue?: string
  onClose: () => void
  onError?: () => void
}

/** Full-screen player: Close, Normal / Slow 0.5×, and the squeeze cue. Esc closes. Always silent. */
export function ExerciseVideoPlayer({ video, title, labels, cue, onClose, onError }: PlayerProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [slow, setSlow] = useState(false)
  const rate = slow ? SLOW_PLAYBACK_RATE : 1
  useBodyScrollLock(true)

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.muted = true
    videoRef.current.playbackRate = rate
  }, [rate])

  useEffect(() => {
    dialogRef.current?.focus?.()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const targets = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)')
      if (!targets?.length) return
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null
  const cueText = cue?.trim()
  return createPortal(
    <div className="exercise-video-player" ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
      <div className="exercise-video-player-bar">
        <h3 className="exercise-video-player-title">{title}</h3>
        <button type="button" className="exercise-video-player-close" aria-label={labels.close} onClick={onClose}>×</button>
      </div>
      <video
        ref={videoRef}
        className="exercise-video-player-media"
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        onLoadedMetadata={(event) => { event.currentTarget.playbackRate = rate }}
        onError={onError}
      />
      <div className="exercise-video-player-controls">
        <div className="exercise-video-speed" role="group">
          <button type="button" aria-pressed={!slow} className={!slow ? 'is-active' : undefined} onClick={() => setSlow(false)}>{labels.normal}</button>
          <button type="button" aria-pressed={slow} className={slow ? 'is-active' : undefined} onClick={() => setSlow(true)}>{labels.slow}</button>
        </div>
        {cueText && <p className="exercise-video-player-cue"><strong>{labels.cue} — </strong>{cueText}</p>}
      </div>
    </div>,
    document.body
  )
}

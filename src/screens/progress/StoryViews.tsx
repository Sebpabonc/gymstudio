import React from 'react'
import { formatNumber, formatShortDate, useT } from '../../i18n'
import type { TranslationKey } from '../../i18n/en'
import type { BlockStory, LiftGroup, LiftStory, StorySet } from '../../progress/blockStory'
import { storyTakeaways, weekdayRhythm } from '../../progress/blockStory'
import type { MuscleGroup, ProgressV3Tab } from '../../progress/types'
import { MUSCLE_COMMON_RANGE } from '../../progress/muscles'
import { PROGRESS_THRESHOLDS } from '../../progress/thresholds'

/*
 * Progress redesign (PO 2026-11-15): each tab answers one question about the block in plain sentences.
 * Wording and rules: docs/fitness/approved/2026-11-15-progress-story-insights.md.
 */

type T = ReturnType<typeof useT>['t']
type Language = ReturnType<typeof useT>['language']

export type StoryViewProps = {
  story: BlockStory
  t: T
  language: Language
  name: (exerciseId: string) => string
  /** §4.1: main lifts with a verdict, and how many of them are Improving. */
  verdicts: { improving: number; eligible: number }
  /** Approved verdict chip for a lift, or null. */
  chip: (exerciseId: string) => string | null
  onOpenLift: (exerciseId: string) => void
  onTab: (tab: ProgressV3Tab) => void
}

const MUSCLE_KEYS: Record<MuscleGroup, TranslationKey> = {
  Chest: 'progress.muscle.chest',
  Back: 'progress.muscle.back',
  'Shoulders (side and rear)': 'progress.muscle.shoulders',
  'Front delts': 'progress.muscle.frontDelts',
  Biceps: 'progress.muscle.biceps',
  Triceps: 'progress.muscle.triceps',
  Quads: 'progress.muscle.quads',
  Hamstrings: 'progress.muscle.hamstrings',
  Glutes: 'progress.muscle.glutes',
  Calves: 'progress.muscle.calves',
  Core: 'progress.muscle.core',
  Other: 'progress.muscle.other',
}

const GROUP_ORDER: LiftGroup[] = ['not-logged', 'recent', 'holding', 'early', 'other']
const GROUP_KEYS: Record<LiftGroup, TranslationKey> = {
  'not-logged': 'progress.story.group.notLogged',
  recent: 'progress.story.group.recent',
  holding: 'progress.story.group.holding',
  early: 'progress.story.group.early',
  other: 'progress.story.group.other',
}
const GROUP_HINTS: Record<LiftGroup, TranslationKey> = {
  'not-logged': 'progress.story.groupHint.notLogged',
  recent: 'progress.story.groupHint.recent',
  holding: 'progress.story.groupHint.holding',
  early: 'progress.story.groupHint.early',
  other: 'progress.story.groupHint.other',
}
const WEEKDAY_KEYS: TranslationKey[] = [
  'progress.story.day.sun', 'progress.story.day.mon', 'progress.story.day.tue', 'progress.story.day.wed',
  'progress.story.day.thu', 'progress.story.day.fri', 'progress.story.day.sat',
]
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const day = (language: Language, date: string) => formatShortDate(language, `${date.slice(0, 10)}T00:00:00Z`)
const kg = (language: Language, value: number) => formatNumber(language, value, { maximumFractionDigits: 2 })
const setText = (language: Language, set: Pick<StorySet, 'weight' | 'reps'>) => `${kg(language, set.weight)}×${formatNumber(language, set.reps)}`

function weekRange(t: T, language: Language, weeks: number[]) {
  if (!weeks.length) return ''
  return weeks.length === 1
    ? t('progress.story.weekOne', { week: formatNumber(language, weeks[0]) })
    : t('progress.story.weekRange', { from: formatNumber(language, weeks[0]), to: formatNumber(language, weeks[weeks.length - 1]) })
}

function joinList(language: Language, items: string[]) {
  if (items.length <= 1) return items.join('')
  const and = language === 'es' ? ' y ' : ' and '
  return `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`
}

function StoryEyebrow({ story, t, language }: Pick<StoryViewProps, 'story' | 't' | 'language'>) {
  const end = new Date(Date.parse(`${story.block.startDate.slice(0, 10)}T00:00:00Z`) + (story.block.weeks * 7 - 1) * 86_400_000)
  // Personal plans have no block number; their name stands in.
  const blockLabel = story.block.number > 0
    ? t('progress.story.blockNumber', { number: formatNumber(language, story.block.number) })
    : story.block.name
  return (
    <span className="ps-eyebrow">
      {story.finished
        ? t('progress.story.recap', {
            number: blockLabel,
            start: day(language, story.block.startDate),
            end: formatShortDate(language, end),
          })
        : t('progress.story.week', {
            number: blockLabel,
            week: formatNumber(language, story.week ?? 1),
            weeks: formatNumber(language, story.block.weeks),
          })}
    </span>
  )
}

function Sparkline({ values, label, muted }: { values: number[]; label: string; muted?: boolean }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points = values.map((value, index) => [3 + index * (86 / (values.length - 1)), 27 - ((value - min) / span) * 24])
  const last = points[points.length - 1]
  return (
    <svg className={`ps-spark${muted ? ' muted' : ''}`} width="92" height="30" viewBox="0 0 92 30" role="img" aria-label={label}>
      <polyline points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} />
      <circle cx={last[0]} cy={last[1]} r="3" />
    </svg>
  )
}

export function StoryOverview({ story, t, language, verdicts, onTab }: StoryViewProps) {
  const takeaways = storyTakeaways(story, verdicts.eligible > 0)
  const maxSets = Math.max(1, ...story.weeks.map((week) => week.sets))
  const deloadWeek = story.weeks.find((week) => week.deload && week.complete)
  return (
    <>
      <section className="card ps-hero">
        <StoryEyebrow story={story} t={t} language={language} />
        <h2>{verdicts.eligible
          ? t('progress.story.improving', { up: formatNumber(language, verdicts.improving), total: formatNumber(language, verdicts.eligible) })
          : t('progress.story.noVerdict')}</h2>
        <p>{t('progress.story.sessions', {
          logged: formatNumber(language, story.sessionsLogged),
          planned: formatNumber(language, story.sessionsPlanned),
          sets: formatNumber(language, story.totalSets),
        })}</p>
      </section>

      {takeaways.length > 0 && (
        <section className="card ps-card">
          <h3>{t(story.finished ? 'progress.story.takeaways.finished' : 'progress.story.takeaways.current')}</h3>
          <ol className="ps-takeaways">
            {takeaways.map((item, index) => {
              let title = ''
              let tab: ProgressV3Tab = 'trends'
              if (item.kind === 'bests') {
                title = item.count === 0
                  ? t('progress.story.take.noBests')
                  : t(item.count === 1 ? 'progress.story.take.bestsOne' : 'progress.story.take.bests', { count: formatNumber(language, item.count) })
              } else if (item.kind === 'day-group') {
                tab = 'consistency'
                title = t('progress.story.take.dayGroup', {
                  group: item.group.name,
                  logged: formatNumber(language, item.group.logged),
                  planned: formatNumber(language, item.group.planned),
                }) + (item.noneAfter ? t('progress.story.take.noneAfter', { date: day(language, item.noneAfter) }) : '') + '.'
              } else {
                tab = 'muscles'
                title = t('progress.story.take.sets', {
                  early: (item.earlyAbout ? t('progress.story.about') : '') + formatNumber(language, item.early, { maximumFractionDigits: 0 }),
                  earlyWeeks: weekRange(t, language, item.earlyWeeks),
                  late: (item.lateAbout ? t('progress.story.about') : '') + formatNumber(language, item.late, { maximumFractionDigits: 0 }),
                  lateWeeks: weekRange(t, language, item.lateWeeks),
                })
              }
              return (
                <li key={`${item.kind}-${index}`}>
                  <button type="button" className="ps-takeaway" onClick={() => onTab(tab)}>
                    <span className="ps-take-number" aria-hidden="true">{index + 1}</span>
                    <strong>{title}</strong>
                    <span className="ps-chevron" aria-hidden="true">›</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {story.weeks.length > 0 && (
        <section className="card ps-card">
          <h3>{t('progress.story.setsPerWeek')}</h3>
          <div className="ps-week-bars" style={{ gridTemplateColumns: `repeat(${story.weeks.length}, minmax(0, 1fr))` }}>
            {story.weeks.map((week) => (
              <div key={week.week} className={week.deload ? 'deload' : ''}>
                <span>{formatNumber(language, week.sets)}</span>
                <i style={{ height: `${Math.max(4, (week.sets / maxSets) * 80)}px` }} />
                <small>{week.deload ? t('progress.story.deload') : t('progress.story.weekShort', { week: formatNumber(language, week.week) })}</small>
              </div>
            ))}
          </div>
          {deloadWeek && <p className="pv3-caption">{t('progress.story.deloadNote', { week: formatNumber(language, deloadWeek.week) })}</p>}
        </section>
      )}
    </>
  )
}

function liftLine(lift: LiftStory, t: T, language: Language) {
  const line = lift.line
  switch (line.code) {
    case 'S1': return t('progress.story.line.S1', { date: day(language, line.date) })
    case 'S2': return t('progress.story.line.S2', { set: setText(language, line.set), date: day(language, line.set.date) })
    case 'S3': return t('progress.story.line.S3', { heavy: kg(language, line.heavy), date: day(language, line.date), load: kg(language, line.load), sessions: formatNumber(language, line.sessions) })
    case 'S4': return t('progress.story.line.S4', { best: setText(language, line.best), date: day(language, line.best.date), latest: setText(language, line.latest) })
      + (line.aboutSame ? t('progress.story.line.S4same') : '') + '.'
    case 'S5': return t('progress.story.line.S5', { best: setText(language, line.best), date: day(language, line.best.date), sessions: formatNumber(language, line.sessions) })
    case 'S6': return t('progress.story.line.S6')
    default: return t('progress.story.line.S7', { best: setText(language, line.best), date: day(language, line.best.date) })
  }
}

export function StoryLifts({ story, t, language, name, chip, onOpenLift }: StoryViewProps) {
  const groups = GROUP_ORDER
    .map((group) => ({ group, lifts: story.lifts.filter((lift) => lift.group === group) }))
    .filter((item) => item.lifts.length)
  if (!groups.length) return <section className="card ps-card"><p className="pv3-caption">{t('progress.story.lifts.empty')}</p></section>
  return (
    <>
      <section className="card ps-hero">
        <StoryEyebrow story={story} t={t} language={language} />
        <div className="ps-tiles">
          {(['recent', 'holding', 'not-logged'] as const).map((group) => (
            <div key={group} className="ps-tile">
              <strong>{formatNumber(language, story.lifts.filter((lift) => lift.group === group).length)}</strong>
              <span>{t(GROUP_KEYS[group])}</span>
            </div>
          ))}
        </div>
      </section>
      {groups.map(({ group, lifts }) => (
        <section key={group} className={`card ps-card ps-group ${group}`}>
          <h3>{t(GROUP_KEYS[group])}</h3>
          <p className="pv3-caption">{t(GROUP_HINTS[group])}</p>
          <ul className="ps-lift-list">
            {lifts.map((lift) => {
              const verdict = chip(lift.exerciseId)
              const sameAsStart = lift.best === lift.start
              return (
                <li key={lift.exerciseId}>
                  <button type="button" className="ps-lift" onClick={() => onOpenLift(lift.exerciseId)}
                    aria-label={t('progress.strength.openDetail', { exercise: name(lift.exerciseId) })}>
                    <span className="ps-lift-copy">
                      <strong>{name(lift.exerciseId)}</strong>
                      <span className="ps-lift-sets">{sameAsStart
                        ? t('progress.story.noBestYet', { set: setText(language, lift.start) })
                        : `${setText(language, lift.start)} → ${setText(language, lift.best)}`}</span>
                      <span>{liftLine(lift, t, language)}</span>
                      {verdict && <small className="ps-chip">{verdict}</small>}
                    </span>
                    <Sparkline values={lift.series} muted={group !== 'recent'} label={t('progress.story.sparkLabel', { lift: name(lift.exerciseId) })} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <p className="pv3-caption">{t('progress.story.lifts.footnote')}</p>
    </>
  )
}

export function StoryMuscles({ story, t, language }: StoryViewProps) {
  const { min, max } = MUSCLE_COMMON_RANGE
  const inRange = (value: number | null) => value !== null && value >= min && value <= max
  const rows = story.muscles
  if (!rows.length || !story.earlyWeeks.length) {
    return <section className="card ps-card"><p className="pv3-caption">{t('progress.story.muscles.empty')}</p></section>
  }
  const scale = (value: number) => `${Math.min(100, (value / (max * 1.25)) * 100)}%`
  const rangeStart = `${(min / (max * 1.25)) * 100}%`
  const rangeWidth = `${((max - min) / (max * 1.25)) * 100}%`
  const total = formatNumber(language, rows.length)
  const pushPullTotal = story.pushSets + story.pullSets
  const pushPullNote = pushPullTotal >= PROGRESS_THRESHOLDS.pushPullMinimumSets
    ? story.pushSets > story.pullSets * PROGRESS_THRESHOLDS.pushPullRatio ? 'progress.story.pushMore'
      : story.pullSets > story.pushSets * PROGRESS_THRESHOLDS.pushPullRatio ? 'progress.story.pullMore' : null
    : null
  const regionTotal = Math.max(1, story.upperSets + story.lowerSets)
  const trainingWeeks = [...story.earlyWeeks, ...story.lateWeeks]
  return (
    <>
      <section className="card ps-hero">
        <StoryEyebrow story={story} t={t} language={language} />
        <h2>{t('progress.story.muscles.headline', { min: formatNumber(language, min), max: formatNumber(language, max) })}</h2>
        <div className="ps-tiles two">
          <div className="ps-tile">
            <strong>{t('progress.story.ofTotal', { count: formatNumber(language, rows.filter((row) => inRange(row.early)).length), total })}</strong>
            <span>{weekRange(t, language, story.earlyWeeks)}</span>
          </div>
          {story.lateWeeks.length > 0 && (
            <div className="ps-tile">
              <strong>{t('progress.story.ofTotal', { count: formatNumber(language, rows.filter((row) => inRange(row.late)).length), total })}</strong>
              <span>{weekRange(t, language, story.lateWeeks)}</span>
            </div>
          )}
        </div>
        <p className="ps-info">ⓘ {t('progress.story.muscles.info')}</p>
      </section>

      <section className="card ps-card">
        <h3>{t('progress.story.muscles.title')}</h3>
        <ul className="ps-muscle-list">
          {rows.map((row) => (
            <li key={row.group}>
              <span className="ps-muscle-name">{t(MUSCLE_KEYS[row.group])}</span>
              <span className="ps-muscle-bars" aria-hidden="true">
                <i className="range" style={{ left: rangeStart, width: rangeWidth }} />
                {row.early !== null && <i className="early" style={{ width: scale(row.early) }} />}
                {row.late !== null && <i className="late" style={{ width: row.late === 0 ? '2px' : scale(row.late) }} />}
              </span>
              <span className="ps-muscle-value">
                {row.early !== null && formatNumber(language, row.early, { maximumFractionDigits: 1 })}
                {row.late !== null && <> → {formatNumber(language, row.late, { maximumFractionDigits: 1 })}</>}
              </span>
            </li>
          ))}
        </ul>
        <div className="ps-legend">
          <span><i className="early" />{weekRange(t, language, story.earlyWeeks)}</span>
          {story.lateWeeks.length > 0 && <span><i className="late" />{weekRange(t, language, story.lateWeeks)}</span>}
          <span><i className="range" />{t('progress.story.muscles.legendRange', { min: formatNumber(language, min), max: formatNumber(language, max) })}</span>
        </div>
      </section>

      <section className="card ps-card">
        <h3>{t('progress.story.balance', { weeks: weekRange(t, language, trainingWeeks) })}</h3>
        <p>{t('progress.story.pushPull', { push: formatNumber(language, story.pushSets), pull: formatNumber(language, story.pullSets) })}</p>
        {pushPullNote && <p className="pv3-caption">{t(pushPullNote as TranslationKey, { weeks: weekRange(t, language, trainingWeeks) })}</p>}
        <p>{t('progress.story.upperLower', {
          upper: formatNumber(language, Math.round((story.upperSets / regionTotal) * 100)),
          lower: formatNumber(language, Math.round((story.lowerSets / regionTotal) * 100)),
        })}</p>
      </section>
    </>
  )
}

export function StoryConsistency({ story, t, language }: StoryViewProps) {
  const rhythm = weekdayRhythm(story)
  const trainedWeeks = story.weeks.filter((week) => week.days.some(Boolean)).length
  return (
    <>
      <section className="card ps-hero">
        <StoryEyebrow story={story} t={t} language={language} />
        <h2>{t('progress.story.consistency.title', {
          logged: formatNumber(language, story.sessionsLogged),
          planned: formatNumber(language, story.sessionsPlanned),
        })}</h2>
        <p>{t('progress.story.consistency.weeks', { trained: formatNumber(language, trainedWeeks), weeks: formatNumber(language, story.weeks.length) })}
          {story.firstUnlogged && ` ${t('progress.story.consistency.unlogged', {
            day: story.firstUnlogged.day.name,
            week: formatNumber(language, story.firstUnlogged.week),
          })}`}</p>
      </section>

      <section className="card ps-card">
        <h3>{t('progress.story.calendar')}</h3>
        <div className="ps-calendar" role="table" aria-label={t('progress.story.calendar')}>
          <div role="row" className="ps-cal-row head" style={{ gridTemplateColumns: `44px repeat(${story.dayTypes.length}, minmax(0, 1fr))` }}>
            <span role="columnheader" />
            {story.dayTypes.map((item, index) => (
              <span role="columnheader" key={item.key} title={item.name}>{t('progress.story.dayShort', { number: formatNumber(language, index + 1) })}</span>
            ))}
          </div>
          {story.weeks.map((week) => (
            <div role="row" key={week.week} className="ps-cal-row" style={{ gridTemplateColumns: `44px repeat(${story.dayTypes.length}, minmax(0, 1fr))` }}>
              <span role="rowheader">{week.deload ? t('progress.story.deload') : t('progress.story.weekShort', { week: formatNumber(language, week.week) })}</span>
              {week.days.map((done, index) => (
                <span role="cell" key={story.dayTypes[index].key} className={done ? 'done' : 'open'}
                  aria-label={`${story.dayTypes[index].name}: ${t(done ? 'progress.story.logged' : 'progress.story.notLogged')}`} />
              ))}
            </div>
          ))}
        </div>
        <ul className="ps-daytype-list">
          {story.dayTypes.map((item, index) => (
            <li key={item.key}>
              <span>{t('progress.story.dayShort', { number: formatNumber(language, index + 1) })} · {item.name}</span>
              <strong>{t('progress.story.ofTotal', { count: formatNumber(language, item.logged), total: formatNumber(language, item.planned) })}</strong>
            </li>
          ))}
        </ul>
      </section>

      {rhythm && (
        <section className="card ps-card">
          <h3>{rhythm.kind === 'every'
            ? t('progress.story.rhythm.every', {
                days: joinList(language, rhythm.days.map((item) => t(WEEKDAY_KEYS[item]))),
                count: formatNumber(language, rhythm.weeks),
              })
            : t('progress.story.rhythm.regular', {
                day: t(WEEKDAY_KEYS[rhythm.days[0]]),
                count: formatNumber(language, rhythm.count),
                weeks: formatNumber(language, rhythm.weeks),
              })}</h3>
          <div className="ps-weekdays">
            {WEEKDAY_ORDER.map((item) => (
              <div key={item}>
                <i style={{ opacity: 0.2 + 0.8 * (story.weekdays[item] / Math.max(1, story.completeWeeks)) }} />
                <span>{t(WEEKDAY_KEYS[item])} {formatNumber(language, story.weekdays[item])}</span>
              </div>
            ))}
          </div>
          <p className="pv3-caption">{t('progress.story.rhythmHint', { weeks: formatNumber(language, story.completeWeeks) })}</p>
        </section>
      )}
    </>
  )
}

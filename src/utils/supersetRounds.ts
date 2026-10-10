export type SupersetTicks = boolean[][]
export type SupersetFocus = { round: number; exercise: number }

export function createSupersetTicks(setCounts: number[], loggedRounds: boolean[]): SupersetTicks {
  return Array.from({ length: Math.max(0, ...setCounts) }, (_, round) =>
    setCounts.map((count) => round >= count || !!loggedRounds[round])
  )
}

export function completedSupersetRounds(ticks: SupersetTicks): boolean[] {
  return ticks.map((row) => row.length > 0 && row.every(Boolean))
}

export function toggleSupersetTick(
  ticks: SupersetTicks, setCounts: number[], { round, exercise }: SupersetFocus
): SupersetTicks {
  if (round >= (setCounts[exercise] ?? 0) || !ticks[round]) return ticks
  return ticks.map((row, index) => index === round
    ? row.map((done, column) => column === exercise ? !done : done)
    : row)
}

export function nextSupersetFocus(
  ticks: SupersetTicks, setCounts: number[], from: SupersetFocus
): SupersetFocus | undefined {
  for (let round = from.round; round < ticks.length; round++) {
    for (let exercise = round === from.round ? from.exercise + 1 : 0; exercise < setCounts.length; exercise++) {
      if (round < setCounts[exercise] && !ticks[round][exercise]) return { round, exercise }
    }
  }
  return undefined
}

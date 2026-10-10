export function nextWorkoutGroupIndex(completed: readonly boolean[], currentIndex: number) {
  for (let index = currentIndex + 1; index < completed.length; index += 1) {
    if (!completed[index]) return index
  }
  return -1
}

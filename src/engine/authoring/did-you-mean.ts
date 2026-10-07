/**
 * Name checking for data written by hand or by a language model: when a name
 * is not one of the known ones, say which known name it most likely meant,
 * and list them all, so the mistake can be fixed from the message alone.
 */

/** Edit distance between two strings (insertions, deletions, substitutions), ignoring case. */
export function editDistance(a: string, b: string): number {
  const s = a.toLowerCase()
  const t = b.toLowerCase()
  let previous = Array.from({ length: t.length + 1 }, (_, j) => j)
  for (let i = 1; i <= s.length; i++) {
    const row = [i]
    for (let j = 1; j <= t.length; j++) {
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1))
    }
    previous = row
  }
  return previous[t.length]
}

/**
 * The known name `word` most likely meant: one that contains it (or it
 * contains), else the nearest by edit distance when that is close enough.
 */
export function closestName(word: string, known: readonly string[]): string | undefined {
  const lower = word.toLowerCase()
  const containing = known.find((name) => name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase()))
  if (containing && Math.min(word.length, containing.length) >= 3) return containing
  let best: string | undefined
  let bestDistance = Infinity
  for (const name of known) {
    const distance = editDistance(word, name)
    if (distance < bestDistance) {
      bestDistance = distance
      best = name
    }
  }
  return best !== undefined && bestDistance <= Math.max(2, Math.floor(word.length / 3)) ? best : undefined
}

/** "Unknown mood "excited": did you mean "joyful"? Known: happy, joyful, …" */
export function unknownName(what: string, word: unknown, known: readonly string[], hint?: string): string {
  const guess = typeof word === 'string' ? (hint ?? closestName(word, known)) : undefined
  return `Unknown ${what} ${JSON.stringify(word)}${guess ? `: did you mean "${guess}"?` : '.'} Known: ${known.join(', ')}`
}

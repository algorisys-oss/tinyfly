/**
 * GSAP's position parameter.
 *
 * The third argument to `tl.to(target, vars, position)` decides where on the
 * timeline a tween lands. Its grammar is small but load-bearing — it is how
 * GSAP users express sequencing — so it is parsed here as pure data.
 *
 * All times are in milliseconds internally; the facade converts from seconds
 * at its boundary.
 */

export interface PositionContext {
  /** Where the next appended tween would start (the end of the timeline) */
  cursor: number
  /** Start of the most recently added tween */
  previousStart: number
  /** End of the most recently added tween */
  previousEnd: number
  /** Named positions added with `addLabel` */
  labels: Map<string, number>
  /**
   * Multiplier applied to literal numbers in the position — 1000 when the
   * caller writes GSAP seconds and the timeline stores milliseconds.
   *
   * Only literals are scaled. The cursor, previous-tween times and label times
   * are already in the timeline's own units.
   */
  scale?: number
}

/** A position parameter: absolute ms, a relative offset, `<`/`>`, or a label. */
export type Position = number | string | undefined

const RELATIVE = /^([+-])=\s*(-?[\d.]+)$/
// Accepts "<", ">", "<100", "<+=100", "<-=100" — the "=" is optional so both
// GSAP spellings work.
const PREVIOUS = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/

/**
 * Resolve a position parameter to an absolute time in milliseconds.
 *
 * Unrecognised strings resolve to the cursor (append), which is GSAP's default
 * and the least surprising outcome for a typo.
 */
export function resolvePosition(position: Position, context: PositionContext): number {
  const scale = context.scale ?? 1
  const literal = (text: string) => Number.parseFloat(text) * scale

  if (position === undefined) return context.cursor
  if (typeof position === 'number') return position * scale

  const trimmed = position.trim()
  if (trimmed === '') return context.cursor

  // "+=200" / "-=100" — relative to the end of the timeline.
  const relative = RELATIVE.exec(trimmed)
  if (relative) {
    const amount = literal(relative[2])
    return context.cursor + (relative[1] === '-' ? -amount : amount)
  }

  // "<" / ">" — the start or end of the previous tween, with an optional offset.
  const previous = PREVIOUS.exec(trimmed)
  if (previous) {
    const base = previous[1] === '<' ? context.previousStart : context.previousEnd
    if (previous[3] === undefined) return base

    const amount = literal(previous[3])
    return base + (previous[2] === '-' ? -amount : amount)
  }

  // A label, optionally with a relative offset: "intro+=200".
  const labelWithOffset = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(trimmed)
  if (labelWithOffset) {
    const labelTime = context.labels.get(labelWithOffset[1].trim())
    if (labelTime !== undefined) {
      const amount = literal(labelWithOffset[3])
      return labelTime + (labelWithOffset[2] === '-' ? -amount : amount)
    }
  }

  const label = context.labels.get(trimmed)
  if (label !== undefined) return label

  // A bare numeric string is an absolute time.
  if (/^-?[\d.]+$/.test(trimmed)) return literal(trimmed)

  return context.cursor
}

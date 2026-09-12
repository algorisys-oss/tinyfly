import type { StaggerConfig, StaggerFrom } from '../types'

/**
 * Stagger offset maths.
 *
 * One implementation shared by three callers: the editor's "fan a preset across
 * letters" action, the runtime `targets` track (expanded during evaluation), and
 * the GSAP compat facade's `stagger` var. Pure and deterministic — given an
 * index and a count it always returns the same offset, so staggered output
 * serializes and replays identically.
 */

/**
 * Distance from the fan's origin, in "index steps", for one item.
 *
 * - `start`  → 0, 1, 2, …            (default; matches the editor's behaviour)
 * - `end`    → reversed
 * - `center` → grows outward from the middle
 * - `edges`  → grows inward from both ends
 * - number   → distance from that index
 */
export function staggerDistance(index: number, count: number, from: StaggerFrom = 'start'): number {
  if (count <= 1) return 0

  if (typeof from === 'number') {
    // Clamp so an out-of-range anchor still produces a sane fan.
    const anchor = Math.max(0, Math.min(count - 1, from))
    return Math.abs(index - anchor)
  }

  switch (from) {
    case 'end':
      return count - 1 - index
    case 'center':
      return Math.abs(index - (count - 1) / 2)
    case 'edges':
      return (count - 1) / 2 - Math.abs(index - (count - 1) / 2)
    case 'start':
    default:
      return index
  }
}

/**
 * The largest distance any item in the set can have. Used to convert a total
 * `amount` into a per-step value.
 */
export function maxStaggerDistance(count: number, from: StaggerFrom = 'start'): number {
  if (count <= 1) return 0

  let max = 0
  for (let i = 0; i < count; i++) {
    max = Math.max(max, staggerDistance(i, count, from))
  }
  return max
}

/**
 * Time offset in milliseconds for one target in a staggered set.
 *
 * `amount` (total spread) wins over `each` (per-step gap) when both are given,
 * matching GSAP. With neither, the offset is 0 — a stagger config that says
 * nothing should do nothing rather than guess a default.
 */
export function staggerOffset(index: number, count: number, config: StaggerConfig): number {
  const from = config.from ?? 'start'
  const distance = staggerDistance(index, count, from)

  if (config.amount !== undefined) {
    const max = maxStaggerDistance(count, from)
    if (max === 0) return 0
    return (config.amount * distance) / max
  }

  if (config.each !== undefined) {
    return config.each * distance
  }

  return 0
}

/**
 * Every offset for a set, in target order. Convenience for authoring tools that
 * bake the stagger into separate tracks.
 */
export function staggerOffsets(count: number, config: StaggerConfig): number[] {
  return Array.from({ length: count }, (_, i) => staggerOffset(i, count, config))
}

/** The longest offset in a set — how much a stagger extends a timeline. */
export function staggerSpan(count: number, config: StaggerConfig): number {
  if (count <= 1) return 0
  return Math.max(...staggerOffsets(count, config))
}

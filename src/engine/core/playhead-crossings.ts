/**
 * Which points in time a playhead passed between two frames — the pure part of
 * timeline callbacks (`call`, `addPause`, per-tween `onStart` / `onComplete`,
 * `onRepeat`).
 *
 * A frame moves the playhead from one place to another, possibly across loop
 * boundaries: a plain repeat wraps back to the start, a yoyo turns around. The
 * movement is split into passes, and each pass reports the event times inside it
 * in the order they were crossed:
 *
 * - forward, `(from, to]` — an event exactly where the playhead already was has
 *   fired before; a pass that starts a loop (or a first play) includes its start;
 * - reverse, `[to, from)`.
 */

export type Direction = 'forward' | 'reverse'

export interface Playhead {
  /** Milliseconds within the current loop */
  time: number
  /** Loops completed */
  iteration: number
  direction: Direction
  /** The playhead is at the very start of a pass, so an event at its position has not fired */
  fresh?: boolean
}

export type Crossing = { kind: 'event'; index: number; direction: Direction } | { kind: 'repeat' }

export interface CrossingResult {
  crossings: Crossing[]
  /** Every stretch of time covered, in order, as [from, to] (to < from when reversing) */
  passes: Array<[number, number]>
}

export interface LoopShape {
  duration: number
  /** Yoyo: every other loop plays backwards */
  alternate: boolean
  /**
   * The frame ended waiting out a repeat delay at a boundary. A plain repeat has
   * not wrapped yet, so the last pass (the new loop) has not started.
   */
  holding?: boolean
}

/** Safety cap on loops handled in one frame (a huge delta on a tiny timeline). */
const MAX_LOOPS = 100

export function playheadCrossings(times: readonly number[], from: Playhead, to: Playhead, shape: LoopShape): CrossingResult {
  const crossings: Crossing[] = []
  const passes: Array<[number, number]> = []
  const { duration, alternate } = shape

  const pass = (start: number, end: number, direction: Direction, inclusive: boolean) => {
    passes.push([start, end])
    const hits: number[] = []
    times.forEach((time, index) => {
      const inside =
        direction === 'forward'
          ? (inclusive ? time >= start : time > start) && time <= end
          : (inclusive ? time <= start : time < start) && time >= end
      if (inside) hits.push(index)
    })
    hits.sort((a, b) => (direction === 'forward' ? times[a] - times[b] : times[b] - times[a]) || a - b)
    for (const index of hits) crossings.push({ kind: 'event', index, direction })
  }

  let position = from.time
  let direction = from.direction
  let inclusive = from.fresh === true
  const loops = Math.min(MAX_LOOPS, Math.max(0, to.iteration - from.iteration))

  for (let loop = 0; loop < loops; loop++) {
    const edge = direction === 'forward' ? duration : 0
    pass(position, edge, direction, inclusive)
    crossings.push({ kind: 'repeat' })
    if (alternate) {
      direction = direction === 'forward' ? 'reverse' : 'forward'
      position = edge
      inclusive = false
    } else {
      position = direction === 'forward' ? 0 : duration
      inclusive = true
    }
  }

  // Waiting at the boundary: the next loop starts when the delay is over (the
  // caller then continues from the start of it, `fresh`).
  if (loops > 0 && shape.holding && !alternate) return { crossings, passes }

  pass(position, to.time, direction, inclusive)
  return { crossings, passes }
}

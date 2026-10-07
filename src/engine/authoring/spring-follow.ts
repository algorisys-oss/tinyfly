import type { Keyframe } from '../types'

/**
 * Follow-through as keyframes: a value that chases another on a spring, so a
 * secondary part lags behind and overshoots a primary one — a car's antenna
 * after the car, leaves after a branch, a load on a truck.
 *
 *     const chase = springFollow((t) => valueOf(xTrack, t), { start: 0, end: 4000 })
 *     // the antenna's bend is how far the follower is behind: (chase − x) × k
 *
 * The spring is stepped in fixed 1 ms steps from `start`, so the same input
 * always gives the same keys. It starts at rest on the primary's value.
 */
export interface SpringFollowOptions {
  /** From and to, ms */
  start: number
  end: number
  /** Key spacing, ms (default 33) */
  step?: number
  /** Spring stiffness (default 120): higher follows more tightly */
  stiffness?: number
  /** Damping (default 9): lower wobbles longer */
  damping?: number
  mass?: number
}

export function springFollow(primary: (time: number) => number, options: SpringFollowOptions): Keyframe<number>[] {
  const step = options.step ?? 33
  const stiffness = options.stiffness ?? 120
  const damping = options.damping ?? 9
  const mass = options.mass ?? 1
  let position = primary(options.start)
  let velocity = 0
  const keys: Keyframe<number>[] = [{ time: options.start, value: position }]
  let next = options.start + step
  for (let time = options.start + 1; time <= options.end; time++) {
    // Semi-implicit Euler in seconds: stable for the stiffness range props use.
    const dt = 0.001
    const force = stiffness * (primary(time) - position) - damping * velocity
    velocity += (force / mass) * dt
    position += velocity * dt
    if (time >= next || time === options.end) {
      keys.push({ time, value: position })
      next += step
    }
  }
  return keys
}

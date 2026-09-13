import type { InertiaConfig } from '../types'

/**
 * Inertia: a thrown value slowing to rest.
 *
 * Friction is exponential decay, which has an exact closed form:
 *
 *     x(t) = from + (rest − from) · (1 − e^(−k·t))
 *
 * so `valueAt(t)` is a pure function of time — no integration, nothing to
 * cache, identical whether you play forwards or scrub backwards. `k` is the
 * friction; `rest` is where a free throw would stop (`from + velocity / k`),
 * moved to the chosen snap point and into bounds if given.
 *
 * Aiming at a snap point keeps the feel of the throw: it decelerates at the
 * same rate and simply lands on the snap, as if thrown with exactly the right
 * speed — which is also how GSAP's InertiaPlugin lands on `end` values.
 */

export const DEFAULT_INERTIA_FRICTION = 4

/**
 * Settled once within this fraction of the distance travelled. Relative, so a
 * `scale` throw of 1 unit and an `x` throw of 500px take the same time to settle
 * for the same friction (the same reason springs scale their thresholds).
 */
const REST_FRACTION = 0.002

/** Floor for the rest threshold, so a zero-distance snap still settles. */
const MIN_REST_DELTA = 1e-4

/** Safety cap on a throw's duration. */
export const INERTIA_MAX_DURATION_MS = 60_000

function frictionOf(config: InertiaConfig): number {
  const k = config.friction ?? DEFAULT_INERTIA_FRICTION
  return k > 0 ? k : DEFAULT_INERTIA_FRICTION
}

/** Where a free throw with these parameters would stop, before snapping or bounds. */
export function naturalRest(config: InertiaConfig): number {
  return config.from + config.velocity / frictionOf(config)
}

/** The nearest allowed resting place to `value`, per `end`. */
function snap(value: number, end: InertiaConfig['end']): number {
  if (end === undefined) return value
  if (typeof end === 'number') {
    return end > 0 ? Math.round(value / end) * end : value
  }
  if (end.length === 0) return value
  let best = end[0]
  for (const candidate of end) {
    if (Math.abs(candidate - value) < Math.abs(best - value)) best = candidate
  }
  return best
}

/** Where the throw comes to rest: the natural rest, snapped, then kept in bounds. */
export function inertiaRest(config: InertiaConfig): number {
  let rest = snap(naturalRest(config), config.end)
  if (config.min !== undefined) rest = Math.max(config.min, rest)
  if (config.max !== undefined) rest = Math.min(config.max, rest)
  return rest
}

/** Milliseconds until the throw is within its rest threshold — its natural duration. */
export function inertiaDuration(config: InertiaConfig): number {
  const distance = Math.abs(inertiaRest(config) - config.from)
  if (distance === 0) return 0
  const restDelta = config.restDelta ?? Math.max(MIN_REST_DELTA, distance * REST_FRACTION)
  if (restDelta >= distance) return 0
  const seconds = Math.log(distance / restDelta) / frictionOf(config)
  return Math.min(INERTIA_MAX_DURATION_MS, seconds * 1000)
}

/** The value `timeMs` after release. Exactly the rest value once settled. */
export function inertiaValueAt(config: InertiaConfig, timeMs: number): number {
  if (timeMs <= 0) return config.from
  const rest = inertiaRest(config)
  if (timeMs >= inertiaDuration(config)) return rest
  const k = frictionOf(config)
  return config.from + (rest - config.from) * (1 - Math.exp((-k * timeMs) / 1000))
}

/** The speed `timeMs` after release, in units per second (useful for chaining a follow-up). */
export function inertiaVelocityAt(config: InertiaConfig, timeMs: number): number {
  const k = frictionOf(config)
  const rest = inertiaRest(config)
  if (timeMs >= inertiaDuration(config)) return 0
  return (rest - config.from) * k * Math.exp((-k * Math.max(0, timeMs)) / 1000)
}

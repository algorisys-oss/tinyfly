import type { EasingType, EasingFunction, CubicBezierPoints } from '../../engine'

/**
 * GSAP ease names mapped onto tinyfly easings.
 *
 * Most of GSAP's eases are smooth curves that a cubic-bezier reproduces closely
 * enough that nobody can tell. Three families cannot be expressed as a bezier at
 * all, because a bezier is monotonic in value and they are not:
 *
 *   - `elastic` overshoots and oscillates
 *   - `bounce`  rebounds off the end value
 *   - `steps`   jumps discretely
 *
 * Those are returned as raw functions, and the caller bakes them into
 * intermediate keyframes (see `bakeEasing`). That keeps the JSON portable — a
 * player reading the file needs no elastic implementation — at the cost of more
 * keyframes, which is why baking is opt-in.
 */

/**
 * Eases with no closed form in our easing set; these must be baked. `custom` is a
 * registered curve (CustomEase, CustomBounce, CustomWiggle): those are always
 * baked, since smoothing a curve someone drew would silently change it.
 */
export type NonBezierEase = 'elastic' | 'bounce' | 'steps' | 'custom'

export interface MappedEase {
  /** A serializable easing, when one exists */
  easing?: EasingType
  /** A raw function, when the ease must be baked into keyframes */
  fn?: EasingFunction
  /** Which non-bezier family this came from, if any */
  requiresBaking?: NonBezierEase
}

/**
 * Cubic-bezier approximations of GSAP's standard eases.
 * Values follow the widely used CSS equivalents (easings.net).
 */
const BEZIER_EASES: Record<string, CubicBezierPoints> = {
  'power1.in': [0.55, 0.085, 0.68, 0.53],
  'power1.out': [0.25, 0.46, 0.45, 0.94],
  'power1.inout': [0.455, 0.03, 0.515, 0.955],

  'power2.in': [0.55, 0.055, 0.675, 0.19],
  'power2.out': [0.215, 0.61, 0.355, 1],
  'power2.inout': [0.645, 0.045, 0.355, 1],

  'power3.in': [0.895, 0.03, 0.685, 0.22],
  'power3.out': [0.165, 0.84, 0.44, 1],
  'power3.inout': [0.77, 0, 0.175, 1],

  'power4.in': [0.755, 0.05, 0.855, 0.06],
  'power4.out': [0.23, 1, 0.32, 1],
  'power4.inout': [0.86, 0, 0.07, 1],

  'sine.in': [0.47, 0, 0.745, 0.715],
  'sine.out': [0.39, 0.575, 0.565, 1],
  'sine.inout': [0.445, 0.05, 0.55, 0.95],

  'expo.in': [0.95, 0.05, 0.795, 0.035],
  'expo.out': [0.19, 1, 0.22, 1],
  'expo.inout': [1, 0, 0, 1],

  'circ.in': [0.6, 0.04, 0.98, 0.335],
  'circ.out': [0.075, 0.82, 0.165, 1],
  'circ.inout': [0.785, 0.135, 0.15, 0.86],

  'back.in': [0.6, -0.28, 0.735, 0.045],
  'back.out': [0.175, 0.885, 0.32, 1.275],
  'back.inout': [0.68, -0.55, 0.265, 1.55],
}

/** Names that map straight onto one of our built-in easings. */
const BUILTIN_ALIASES: Record<string, EasingType> = {
  none: 'linear',
  linear: 'linear',
  'linear.none': 'linear',
  // GSAP's powerN is a polynomial of degree N+1: power1 is quad, power2 cubic.
  'power1.in': 'ease-in-quad',
  'power1.out': 'ease-out-quad',
  'power1.inout': 'ease-in-out-quad',
  'power2.in': 'ease-in-cubic',
  'power2.out': 'ease-out-cubic',
  'power2.inout': 'ease-in-out-cubic',
}

/** Normalise "Power2.easeOut", "power2.out" and "power2" to one spelling. */
export function normaliseEaseName(name: string): string {
  let key = name.trim().toLowerCase()

  // GSAP 2 spellings: "easeOut" / "easeInOut" suffixes.
  key = key.replace(/\.ease(in|out|inout)$/, '.$1')

  // A family with no direction defaults to "out", as GSAP does.
  if (!key.includes('.') && !key.startsWith('steps') && key !== 'none' && key !== 'linear') {
    key = `${key}.out`
  }

  return key
}

/**
 * Elastic ease — overshoots and oscillates before settling.
 * `amplitude` scales the overshoot; `period` the oscillation rate.
 */
export function elasticOut(amplitude = 1, period = 0.3): EasingFunction {
  return (t) => {
    if (t === 0 || t === 1) return t
    const s = (period / (2 * Math.PI)) * Math.asin(1 / Math.max(1, amplitude))
    return amplitude * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1
  }
}

export function elasticIn(amplitude = 1, period = 0.3): EasingFunction {
  const out = elasticOut(amplitude, period)
  return (t) => 1 - out(1 - t)
}

export function elasticInOut(amplitude = 1, period = 0.3): EasingFunction {
  const inFn = elasticIn(amplitude, period)
  const outFn = elasticOut(amplitude, period)
  return (t) => (t < 0.5 ? inFn(t * 2) / 2 : outFn(t * 2 - 1) / 2 + 0.5)
}

/** Bounce ease — rebounds off the end value with decreasing height. */
export const bounceOut: EasingFunction = (t) => {
  const n = 7.5625
  const d = 2.75

  if (t < 1 / d) return n * t * t
  if (t < 2 / d) {
    const t2 = t - 1.5 / d
    return n * t2 * t2 + 0.75
  }
  if (t < 2.5 / d) {
    const t2 = t - 2.25 / d
    return n * t2 * t2 + 0.9375
  }
  const t2 = t - 2.625 / d
  return n * t2 * t2 + 0.984375
}

export const bounceIn: EasingFunction = (t) => 1 - bounceOut(1 - t)

export const bounceInOut: EasingFunction = (t) =>
  t < 0.5 ? bounceIn(t * 2) / 2 : bounceOut(t * 2 - 1) / 2 + 0.5

/** Stepped ease — holds, then jumps, `count` times across the segment. */
export function steps(count: number): EasingFunction {
  const n = Math.max(1, Math.floor(count))
  return (t) => Math.min(1, Math.floor(t * n) / (n - 1 || 1))
}

/**
 * Map a GSAP ease name to something tinyfly can use.
 *
 * Unknown names fall back to `ease-out` rather than throwing: an unrecognised
 * ease should not stop an animation from being built.
 */
export function mapEase(name: string): MappedEase {
  const registered = customEases.get(name.trim().toLowerCase())
  if (registered) return registered
  const key = normaliseEaseName(name)

  // steps(n) carries its own argument.
  const stepsMatch = /^steps\(\s*(\d+)\s*\)$/.exec(key)
  if (stepsMatch) {
    return { fn: steps(Number.parseInt(stepsMatch[1], 10)), requiresBaking: 'steps' }
  }

  if (key.startsWith('elastic')) {
    const direction = key.split('.')[1] ?? 'out'
    const fn =
      direction === 'in' ? elasticIn() : direction === 'inout' ? elasticInOut() : elasticOut()
    return { fn, requiresBaking: 'elastic' }
  }

  if (key.startsWith('bounce')) {
    const direction = key.split('.')[1] ?? 'out'
    const fn =
      direction === 'in' ? bounceIn : direction === 'inout' ? bounceInOut : bounceOut
    return { fn, requiresBaking: 'bounce' }
  }

  // Prefer an exact built-in — smaller JSON and no bezier evaluation at runtime.
  if (key in BUILTIN_ALIASES) {
    return { easing: BUILTIN_ALIASES[key] }
  }

  if (key in BEZIER_EASES) {
    return { easing: { type: 'cubic-bezier', points: BEZIER_EASES[key] } }
  }

  return { easing: 'ease-out' }
}

/** Whether an ease name needs baking rather than a serializable easing. */
export function easeRequiresBaking(name: string): boolean {
  return mapEase(name).requiresBaking !== undefined
}

/** Eases registered by name (`CustomEase.create` and friends). */
const customEases = new Map<string, MappedEase>()

/**
 * Register an ease under a name, for use as `ease: name`. A cubic-bezier is kept
 * exact; any other curve is sampled into keyframes when a tween uses it.
 */
export function registerEase(name: string, ease: { fn: EasingFunction; bezier?: CubicBezierPoints }): string {
  customEases.set(
    name.trim().toLowerCase(),
    ease.bezier ? { easing: { type: 'cubic-bezier', points: ease.bezier }, fn: ease.fn } : { fn: ease.fn, requiresBaking: 'custom' }
  )
  return name
}

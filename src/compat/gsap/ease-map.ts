import type { EasingType, EasingFunction, CubicBezierPoints, ParametricEasing } from '../../engine'
import { getEasingFunction } from '../../engine'

/**
 * GSAP ease names mapped onto tinyfly easings.
 *
 * Most of GSAP's eases are smooth curves that a cubic-bezier reproduces closely
 * enough that nobody can tell. Four families are not beziers — `elastic`
 * oscillates, `bounce` rebounds, `back` with an overshoot of its own, and `steps`
 * jumps — and map to the engine's parametric eases (`{ type: 'elastic', … }`),
 * which serialize as small JSON and are evaluated exactly when played.
 *
 * Registered curves (CustomEase, CustomBounce, CustomWiggle) have no closed form
 * and are sampled into keyframes when a tween uses them.
 */

/** Eases that must be sampled into keyframes: registered custom curves. */
export type NonBezierEase = 'custom'

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

  // A family with no direction defaults to "out", as GSAP does ("elastic(1, 0.3)" too).
  const family = /^([a-z]+\d?)(\(.*\))?$/.exec(key)
  if (family && family[1] !== 'steps' && key !== 'none' && key !== 'linear') {
    key = `${family[1]}.out${family[2] ?? ''}`
  }

  return key
}

// The curves themselves live in the engine; re-exported for existing imports.
export { elasticOut, bounceOut, backOut, stepsEasing } from '../../engine'

/** GSAP elastic.in with the given parameters. */
export const elasticIn = (amplitude = 1, period = 0.3): EasingFunction => getEasingFunction({ type: 'elastic', mode: 'in', amplitude, period })
/** GSAP elastic.inOut with the given parameters. */
export const elasticInOut = (amplitude = 1, period = 0.3): EasingFunction => getEasingFunction({ type: 'elastic', mode: 'in-out', amplitude, period })
export const bounceIn: EasingFunction = getEasingFunction({ type: 'bounce', mode: 'in' })
export const bounceInOut: EasingFunction = getEasingFunction({ type: 'bounce', mode: 'in-out' })
/** GSAP's steps(n): n + 1 levels from 0 to 1. */
export const steps = (count: number): EasingFunction => getEasingFunction({ type: 'steps', count: Math.max(1, Math.floor(count)) + 1, position: 'none' })

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

  // steps(n): GSAP holds n + 1 levels from 0 to 1 — CSS steps(n + 1, jump-none).
  const stepsMatch = /^steps\(\s*(\d+)\s*\)$/.exec(key)
  if (stepsMatch) {
    const count = Math.max(1, Number.parseInt(stepsMatch[1], 10))
    const easing: ParametricEasing = { type: 'steps', count: count + 1, position: 'none' }
    return { easing, fn: getEasingFunction(easing) }
  }

  // elastic / bounce / back, with GSAP's optional parameters: "elastic.out(1, 0.3)", "back.out(2)".
  const parametric = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(key)
  if (parametric) {
    const [, family, direction, rawArgs] = parametric
    const args = (rawArgs ?? '').split(',').map((arg) => Number.parseFloat(arg)).filter((arg) => Number.isFinite(arg))
    const mode = direction === 'inout' ? 'in-out' : (direction as 'in' | 'out')
    // Plain back eases keep their exact cubic-bezier (smaller, and CSS can play it).
    if (family === 'back' && args.length === 0 && key in BEZIER_EASES) {
      return { easing: { type: 'cubic-bezier', points: BEZIER_EASES[key] } }
    }
    const easing: ParametricEasing =
      family === 'elastic'
        ? { type: 'elastic', mode, ...(args[0] !== undefined && { amplitude: args[0] }), ...(args[1] !== undefined && { period: args[1] }) }
        : family === 'bounce'
          ? { type: 'bounce', mode }
          : { type: 'back', mode, ...(args[0] !== undefined && { overshoot: args[0] }) }
    return { easing, fn: getEasingFunction(easing) }
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

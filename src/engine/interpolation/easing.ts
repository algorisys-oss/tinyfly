import type { EasingFunction, EasingType, BuiltInEasingType, CubicBezierPoints, EaseMode, ParametricEasing, StepsEasing } from '../types'
import { isCubicBezierEasing, isParametricEasing } from '../types'

/**
 * Linear easing - no acceleration or deceleration.
 */
export const linear: EasingFunction = (t) => t

/**
 * Quadratic ease-in - accelerates from zero velocity.
 */
export const easeInQuad: EasingFunction = (t) => t * t

/**
 * Quadratic ease-out - decelerates to zero velocity.
 */
export const easeOutQuad: EasingFunction = (t) => 1 - (1 - t) * (1 - t)

/**
 * Quadratic ease-in-out - accelerates until halfway, then decelerates.
 */
export const easeInOutQuad: EasingFunction = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

/**
 * Cubic ease-in - accelerates from zero velocity (steeper than quad).
 */
export const easeInCubic: EasingFunction = (t) => t * t * t

/**
 * Cubic ease-out - decelerates to zero velocity (steeper than quad).
 */
export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3)

/**
 * Cubic ease-in-out - accelerates until halfway, then decelerates.
 */
export const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Default ease-in (alias for cubic).
 */
export const easeIn: EasingFunction = easeInCubic

/**
 * Default ease-out (alias for cubic).
 */
export const easeOut: EasingFunction = easeOutCubic

/**
 * Default ease-in-out (alias for cubic).
 */
export const easeInOut: EasingFunction = easeInOutCubic

/**
 * Map of built-in easing type identifiers to their functions.
 */
const easingMap: Record<BuiltInEasingType, EasingFunction> = {
  'linear': linear,
  'ease-in': easeIn,
  'ease-out': easeOut,
  'ease-in-out': easeInOut,
  'ease-in-quad': easeInQuad,
  'ease-out-quad': easeOutQuad,
  'ease-in-out-quad': easeInOutQuad,
  'ease-in-cubic': easeInCubic,
  'ease-out-cubic': easeOutCubic,
  'ease-in-out-cubic': easeInOutCubic,
}

/**
 * Creates a cubic bezier easing function from control points.
 * Uses Newton-Raphson iteration for accurate x->t mapping.
 *
 * The curve goes from (0,0) to (1,1) with two control points:
 * P1 at (cp1x, cp1y) and P2 at (cp2x, cp2y)
 */
export function createCubicBezier(points: CubicBezierPoints): EasingFunction {
  const [cp1x, cp1y, cp2x, cp2y] = points

  // Coefficients for the cubic bezier polynomial
  const cx = 3 * cp1x
  const bx = 3 * (cp2x - cp1x) - cx
  const ax = 1 - cx - bx

  const cy = 3 * cp1y
  const by = 3 * (cp2y - cp1y) - cy
  const ay = 1 - cy - by

  // Compute x(t) for a given t
  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t

  // Compute y(t) for a given t
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t

  // Compute dx/dt for a given t (derivative)
  const sampleDerivativeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx

  // Newton-Raphson iteration to find t for a given x
  const solveCurveX = (x: number): number => {
    // Initial guess using linear approximation
    let t = x

    // Newton-Raphson iteration (usually converges in 4-8 iterations)
    for (let i = 0; i < 8; i++) {
      const currentX = sampleX(t) - x
      if (Math.abs(currentX) < 1e-7) {
        return t
      }
      const derivative = sampleDerivativeX(t)
      if (Math.abs(derivative) < 1e-7) {
        break
      }
      t -= currentX / derivative
    }

    // Fallback: binary search if Newton-Raphson doesn't converge
    let low = 0
    let high = 1
    t = x

    while (low < high) {
      const currentX = sampleX(t)
      if (Math.abs(currentX - x) < 1e-7) {
        return t
      }
      if (x > currentX) {
        low = t
      } else {
        high = t
      }
      t = (low + high) / 2
    }

    return t
  }

  return (x: number): number => {
    // Handle edge cases
    if (x <= 0) return 0
    if (x >= 1) return 1

    // Find t for this x, then compute y(t)
    const t = solveCurveX(x)
    return sampleY(t)
  }
}

/** Turn an ease-out curve into the requested mode. */
function withMode(out: EasingFunction, mode: EaseMode = 'out'): EasingFunction {
  if (mode === 'out') return out
  const easeIn: EasingFunction = (t) => 1 - out(1 - t)
  if (mode === 'in') return easeIn
  return (t) => (t < 0.5 ? easeIn(t * 2) / 2 : out(t * 2 - 1) / 2 + 0.5)
}

/** Elastic ease-out: overshoots and oscillates before settling (GSAP's elastic). */
export function elasticOut(amplitude = 1, period = 0.3): EasingFunction {
  const a = Math.max(1, amplitude)
  const s = (period / (2 * Math.PI)) * Math.asin(1 / a)
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return a * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1
  }
}

/** Bounce ease-out: rebounds off the end value with decreasing height. */
export const bounceOut: EasingFunction = (t) => {
  const n = 7.5625
  const d = 2.75
  if (t <= 0) return 0
  if (t >= 1) return 1
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

/** Back ease-out: goes past the end by `overshoot`, then settles. */
export function backOut(overshoot = 1.70158): EasingFunction {
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    const p = t - 1
    return p * p * ((overshoot + 1) * p + overshoot) + 1
  }
}

/** A stepped ease with CSS `steps()` semantics. */
export function stepsEasing(count: number, position: StepsEasing['position'] = 'end'): EasingFunction {
  const n = Math.max(1, Math.floor(count))
  return (t) => {
    if (t >= 1) return 1
    if (t <= 0) return position === 'start' || position === 'both' ? (position === 'start' ? 1 / n : 1 / (n + 1)) : 0
    const step = Math.floor(t * n)
    switch (position) {
      case 'start':
        return Math.min(1, (step + 1) / n)
      case 'both':
        return (step + 1) / (n + 1)
      case 'none':
        return n === 1 ? 0 : Math.min(1, step / (n - 1))
      default:
        return step / n
    }
  }
}

/** The function for a parametric ease. */
export function parametricEasing(easing: ParametricEasing): EasingFunction {
  switch (easing.type) {
    case 'steps':
      return stepsEasing(easing.count, easing.position)
    case 'elastic':
      return withMode(elasticOut(easing.amplitude, easing.period), easing.mode)
    case 'bounce':
      return withMode(bounceOut, easing.mode)
    case 'back':
      return withMode(backOut(easing.overshoot), easing.mode)
  }
}

/**
 * Get an easing function by its type identifier.
 * Returns linear if type is undefined.
 * Supports both built-in easing types and custom cubic-bezier.
 */
export function getEasingFunction(type: EasingType | undefined): EasingFunction {
  if (type === undefined) {
    return linear
  }

  // Handle custom cubic-bezier easing
  if (isCubicBezierEasing(type)) {
    return createCubicBezier(type.points)
  }

  if (isParametricEasing(type)) {
    return parametricEasing(type)
  }

  // Handle built-in easing types (an unknown name plays linearly rather than throwing)
  return easingMap[type] ?? linear
}

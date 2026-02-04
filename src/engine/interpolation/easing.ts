import type { EasingFunction, EasingType, BuiltInEasingType, CubicBezierPoints } from '../types'
import { isCubicBezierEasing } from '../types'

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

  // Handle built-in easing types
  return easingMap[type]
}

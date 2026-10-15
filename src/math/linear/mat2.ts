import type { Vec2 } from './vec2'

/**
 * 2×2 matrices as `[a, b, c, d]`, row by row:
 *
 *     | a  b |
 *     | c  d |
 *
 * so the first column `[a, c]` is where î lands and the second `[b, d]` is
 * where ĵ lands. A flat number array is what a timeline track interpolates,
 * element by element: keying `[1, 0, 0, 1]` to a matrix M moves every point
 * in a straight line from where it starts to where M sends it, which is the
 * classic "watch the grid transform" animation. Every function is pure.
 */
export type Mat2 = [number, number, number, number]

export const IDENTITY: Mat2 = [1, 0, 0, 1]

/** M·v */
export const apply = ([a, b, c, d]: Mat2, [x, y]: Vec2): Vec2 => [a * x + b * y, c * x + d * y]

/** A·B: apply B first, then A. */
export function multiply(A: Mat2, B: Mat2): Mat2 {
  const [a, b, c, d] = A
  const [e, f, g, h] = B
  return [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h]
}

/** The signed factor areas are scaled by; negative when orientation flips. */
export const determinant = ([a, b, c, d]: Mat2): number => a * d - b * c

/** The inverse, or undefined when the matrix squashes the plane (determinant 0). */
export function inverse(m: Mat2): Mat2 | undefined {
  const det = determinant(m)
  if (Math.abs(det) < 1e-12) return undefined
  const [a, b, c, d] = m
  return [d / det, -b / det, -c / det, a / det]
}

/** Element-wise blend from `from` (t = 0) to `to` (t = 1). */
export const lerp = (from: Mat2, to: Mat2, t: number): Mat2 =>
  from.map((v, i) => v + (to[i] - v) * t) as Mat2

/** A rotation by `radians`, counter-clockwise in maths axes (y up). */
export const rotation = (radians: number): Mat2 => [Math.cos(radians), -Math.sin(radians), Math.sin(radians), Math.cos(radians)]

export interface Eigenpair {
  value: number
  /** Unit length */
  vector: Vec2
}

/**
 * The real eigenvalues and unit eigenvectors, largest value first. Empty
 * when the eigenvalues are complex (a rotation turns every direction). A
 * repeated eigenvalue gives one pair, or two when every vector is an
 * eigenvector (a uniform scale).
 */
export function eigen(m: Mat2): Eigenpair[] {
  const [a, b, c, d] = m
  const trace = a + d
  const det = determinant(m)
  const discriminant = trace * trace - 4 * det
  const epsilon = 1e-9
  if (discriminant < -epsilon) return []
  const root = Math.sqrt(Math.max(0, discriminant))
  const values = root < epsilon ? [trace / 2] : [(trace + root) / 2, (trace - root) / 2]
  const pairs: Eigenpair[] = []
  for (const value of values) {
    // (M − λI)v = 0: take a nonzero row's perpendicular.
    const rows: Vec2[] = [[a - value, b], [c, d - value]]
    const row = rows.reduce((best, r) => (Math.hypot(...r) > Math.hypot(...best) ? r : best))
    if (Math.hypot(...row) < epsilon) {
      // M = λI: every direction; report the axes.
      pairs.push({ value, vector: [1, 0] }, { value, vector: [0, 1] })
      continue
    }
    const v: Vec2 = [-row[1], row[0]]
    const n = Math.hypot(...v)
    // Point the vector into the right half-plane (or up), so the answer is stable.
    const sign = v[0] < -epsilon || (Math.abs(v[0]) <= epsilon && v[1] < 0) ? -1 : 1
    // `+ 0` turns −0 into 0, so equal answers compare equal.
    pairs.push({ value, vector: [(sign * v[0]) / n + 0, (sign * v[1]) / n + 0] })
  }
  return pairs
}

/** True when `value` is four finite numbers. */
export function isMat2(value: unknown): value is Mat2 {
  return Array.isArray(value) && value.length === 4 && value.every(Number.isFinite)
}

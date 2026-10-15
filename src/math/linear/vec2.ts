/**
 * 2D vectors as plain `[x, y]` tuples: the same shape a timeline track
 * interpolates element by element, so a vector can be keyed directly.
 * Every function is pure and returns a new tuple.
 */
export type Vec2 = [number, number]

export const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]]

export const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]

export const scale = (a: Vec2, k: number): Vec2 => [a[0] * k, a[1] * k]

export const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1]

/** The z of the 3D cross product: the signed area of the parallelogram on a and b. */
export const cross = (a: Vec2, b: Vec2): number => a[0] * b[1] - a[1] * b[0]

export const length = (a: Vec2): number => Math.hypot(a[0], a[1])

/** `a` scaled to length 1; the zero vector stays zero. */
export function normalize(a: Vec2): Vec2 {
  const n = length(a)
  return n === 0 ? [0, 0] : [a[0] / n, a[1] / n]
}

export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** True when `value` is a finite `[x, y]`. */
export function isVec2(value: unknown): value is Vec2 {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)
}

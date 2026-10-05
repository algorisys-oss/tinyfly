/**
 * Three-component vectors as plain `[x, y, z]` arrays, so they serialise to
 * JSON as they are. Every function is pure and returns a new array.
 */

export type Vec3 = [number, number, number]

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function scale(v: Vec3, factor: number): Vec3 {
  return [v[0] * factor, v[1] * factor, v[2] * factor]
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** Right-handed: `cross([1, 0, 0], [0, 1, 0])` is `[0, 0, 1]`. */
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

export function length(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2])
}

export function distance(a: Vec3, b: Vec3): number {
  return length(subtract(a, b))
}

/** `v` scaled to length 1; the zero vector stays zero (there is no direction to keep). */
export function normalize(v: Vec3): Vec3 {
  const len = length(v)
  return len === 0 ? [0, 0, 0] : scale(v, 1 / len)
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

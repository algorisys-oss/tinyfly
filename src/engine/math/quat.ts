import type { Vec3 } from './vec3'

/**
 * Rotations as unit quaternions, `[x, y, z, w]` (glTF's order). Quaternions
 * turn smoothly between any two orientations without gimbal lock, which Euler
 * angles cannot. Every function is pure and returns a new array.
 *
 * Euler angles are degrees, applied in **YXZ** order (yaw, then pitch, then
 * roll): `fromEuler(x, y, z)` turns the same way as CSS
 * `rotateY(y) rotateX(x) rotateZ(z)`.
 */

export type Quat = [number, number, number, number]

const DEG = Math.PI / 180

/** Below this angle between two rotations, slerp falls back to a normalised lerp (sin θ → 0). */
const NEARLY_EQUAL = 0.9995

export function identity(): Quat {
  return [0, 0, 0, 1]
}

/** A turn of `degrees` about `axis` (any length; it is normalised). */
export function fromAxisAngle(axis: Vec3, degrees: number): Quat {
  const len = Math.hypot(axis[0], axis[1], axis[2])
  if (len === 0) return identity()
  const half = (degrees * DEG) / 2
  const s = Math.sin(half) / len
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)]
}

/** From Euler degrees in YXZ order: yaw `y`, then pitch `x`, then roll `z`. */
export function fromEuler(x: number, y: number, z: number): Quat {
  return multiply(multiply(fromAxisAngle([0, 1, 0], y), fromAxisAngle([1, 0, 0], x)), fromAxisAngle([0, 0, 1], z))
}

/**
 * Back to Euler degrees `[x, y, z]` in YXZ order. At straight up or down
 * (pitch ±90°) yaw and roll turn about the same axis; the roll is then 0 and
 * the yaw carries the whole turn.
 */
export function toEuler(q: Quat): Vec3 {
  const [x, y, z, w] = normalize(q)
  // Rotation matrix entries (row, column) that YXZ needs.
  const m02 = 2 * (x * z + y * w)
  const m10 = 2 * (x * y + z * w)
  const m11 = 1 - 2 * (x * x + z * z)
  const m12 = 2 * (y * z - x * w)
  const m00 = 1 - 2 * (y * y + z * z)
  const m20 = 2 * (x * z - y * w)
  const m22 = 1 - 2 * (x * x + y * y)
  const pitch = Math.asin(Math.max(-1, Math.min(1, -m12)))
  if (Math.abs(m12) < 0.9999999) {
    return [pitch / DEG, Math.atan2(m02, m22) / DEG, Math.atan2(m10, m11) / DEG]
  }
  return [pitch / DEG, Math.atan2(-m20, m00) / DEG, 0]
}

/** `a × b`: rotate by `b`, then by `a`. */
export function multiply(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a
  const [bx, by, bz, bw] = b
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ]
}

export function dot(a: Quat, b: Quat): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
}

export function length(q: Quat): number {
  return Math.hypot(q[0], q[1], q[2], q[3])
}

/** `q` at length 1; a zero quaternion (no rotation described) becomes the identity. */
export function normalize(q: Quat): Quat {
  const len = length(q)
  return len === 0 ? identity() : [q[0] / len, q[1] / len, q[2] / len, q[3] / len]
}

/** The opposite turn of a unit quaternion. */
export function conjugate(q: Quat): Quat {
  return [-q[0], -q[1], -q[2], q[3]]
}

/**
 * Spherical interpolation: turns from `a` to `b` at a steady angular speed,
 * the short way round (`q` and `-q` are the same rotation, so `b` is flipped
 * when that is shorter). `t` 0 gives `a` and 1 gives `b`, both normalised;
 * eased `t` outside 0..1 (back, elastic) carries on along the same arc.
 */
export function slerp(a: Quat, b: Quat, t: number): Quat {
  const from = normalize(a)
  let to = normalize(b)
  let cos = dot(from, to)
  if (cos < 0) {
    to = [-to[0], -to[1], -to[2], -to[3]]
    cos = -cos
  }
  if (cos > NEARLY_EQUAL) {
    return normalize([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
      from[3] + (to[3] - from[3]) * t,
    ])
  }
  const angle = Math.acos(cos)
  const sin = Math.sin(angle)
  const wa = Math.sin((1 - t) * angle) / sin
  const wb = Math.sin(t * angle) / sin
  return normalize([
    from[0] * wa + to[0] * wb,
    from[1] * wa + to[1] * wb,
    from[2] * wa + to[2] * wb,
    from[3] * wa + to[3] * wb,
  ])
}

/** `v` turned by `q`. */
export function rotateVec3(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = normalize(q)
  // t = 2 (q.xyz × v); v' = v + w t + q.xyz × t
  const tx = 2 * (y * v[2] - z * v[1])
  const ty = 2 * (z * v[0] - x * v[2])
  const tz = 2 * (x * v[1] - y * v[0])
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)]
}

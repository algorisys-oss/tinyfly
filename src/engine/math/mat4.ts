import type { Vec3 } from './vec3'
import type { Quat } from './quat'
import { cross, normalize, subtract, dot } from './vec3'

/**
 * 4×4 matrices as 16 numbers in **column-major** order (`m[column * 4 + row]`),
 * the order WebGL, glTF and CSS `matrix3d()` use. Points are columns, so
 * `multiply(a, b)` applies `b` first, then `a`. Every function is pure and
 * returns a new array.
 */

export type Mat4 = number[]

const DEG = Math.PI / 180

export function identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

/** `a · b`: transform by `b`, then by `a`. */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16)
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[column * 4 + k]
      out[column * 4 + row] = sum
    }
  }
  return out
}

export function translation(v: Vec3): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v[0], v[1], v[2], 1]
}

export function scaling(v: Vec3): Mat4 {
  return [v[0], 0, 0, 0, 0, v[1], 0, 0, 0, 0, v[2], 0, 0, 0, 0, 1]
}

/** The rotation of a unit quaternion. */
export function fromQuat(q: Quat): Mat4 {
  const [x, y, z, w] = q
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    0, 0, 0, 1,
  ]
}

/** Translate · rotate · scale: an object's local matrix (scale first, then rotate, then move). */
export function compose(position: Vec3, rotation: Quat, scale: Vec3): Mat4 {
  const m = fromQuat(rotation)
  for (let i = 0; i < 3; i++) {
    m[i] *= scale[0]
    m[4 + i] *= scale[1]
    m[8 + i] *= scale[2]
  }
  m[12] = position[0]
  m[13] = position[1]
  m[14] = position[2]
  return m
}

export function transpose(m: Mat4): Mat4 {
  const out = new Array<number>(16)
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) out[row * 4 + column] = m[column * 4 + row]
  return out
}

/** The inverse, or `null` when `m` has none (it flattens space). */
export function invert(m: Mat4): Mat4 | null {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m
  const b00 = a00 * a11 - a01 * a10
  const b01 = a00 * a12 - a02 * a10
  const b02 = a00 * a13 - a03 * a10
  const b03 = a01 * a12 - a02 * a11
  const b04 = a01 * a13 - a03 * a11
  const b05 = a02 * a13 - a03 * a12
  const b06 = a20 * a31 - a21 * a30
  const b07 = a20 * a32 - a22 * a30
  const b08 = a20 * a33 - a23 * a30
  const b09 = a21 * a32 - a22 * a31
  const b10 = a21 * a33 - a23 * a31
  const b11 = a22 * a33 - a23 * a32
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
  if (Math.abs(det) < 1e-12) return null
  const inv = 1 / det
  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * inv,
    (a02 * b10 - a01 * b11 - a03 * b09) * inv,
    (a31 * b05 - a32 * b04 + a33 * b03) * inv,
    (a22 * b04 - a21 * b05 - a23 * b03) * inv,
    (a12 * b08 - a10 * b11 - a13 * b07) * inv,
    (a00 * b11 - a02 * b08 + a03 * b07) * inv,
    (a32 * b02 - a30 * b05 - a33 * b01) * inv,
    (a20 * b05 - a22 * b02 + a23 * b01) * inv,
    (a10 * b10 - a11 * b08 + a13 * b06) * inv,
    (a01 * b08 - a00 * b10 - a03 * b06) * inv,
    (a30 * b04 - a31 * b02 + a33 * b00) * inv,
    (a21 * b02 - a20 * b04 - a23 * b00) * inv,
    (a11 * b07 - a10 * b09 - a12 * b06) * inv,
    (a00 * b09 - a01 * b07 + a02 * b06) * inv,
    (a31 * b01 - a30 * b03 - a32 * b00) * inv,
    (a20 * b03 - a21 * b01 + a22 * b00) * inv,
  ]
}

/**
 * A perspective projection: vertical field of view in degrees, width / height,
 * and the near and far planes (positive distances in front of the camera,
 * which looks down -z). Depth maps to -1..1, as WebGL clip space.
 */
export function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan((fovY * DEG) / 2)
  const range = 1 / (near - far)
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * range, -1, 0, 0, 2 * far * near * range, 0]
}

/** An orthographic projection of the box `left..right`, `bottom..top`, `near..far` (depth -1..1). */
export function orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
  const w = 1 / (right - left)
  const h = 1 / (top - bottom)
  const d = 1 / (far - near)
  return [2 * w, 0, 0, 0, 0, 2 * h, 0, 0, 0, 0, -2 * d, 0, -(right + left) * w, -(top + bottom) * h, -(far + near) * d, 1]
}

/**
 * A view matrix for a camera at `eye` looking at `target`, with `up` (default
 * +y) keeping it level. It moves the world so the camera sits at the origin
 * looking down -z.
 */
export function lookAt(eye: Vec3, target: Vec3, up: Vec3 = [0, 1, 0]): Mat4 {
  const back = normalize(subtract(eye, target))
  const right = normalize(cross(up, back))
  const trueUp = cross(back, right)
  return [
    right[0], trueUp[0], back[0], 0,
    right[1], trueUp[1], back[1], 0,
    right[2], trueUp[2], back[2], 0,
    -dot(right, eye), -dot(trueUp, eye), -dot(back, eye), 1,
  ]
}

/** A point transformed by `m`, divided by w (so it works through a projection). */
export function transformPoint(m: Mat4, p: Vec3): Vec3 {
  const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]
  const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]
  const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]
  const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]
  return w === 1 || w === 0 ? [x, y, z] : [x / w, y / w, z / w]
}

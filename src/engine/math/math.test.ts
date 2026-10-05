import { describe, it, expect } from 'vitest'
import { vec3, quat, mat4, type Quat, type Vec3, type Mat4 } from './index'

const close = (a: number[], b: number[], digits = 9) => a.forEach((v, i) => expect(v, `[${i}]`).toBeCloseTo(b[i], digits))
/** The angle between two rotations, degrees. */
const angleBetween = (a: Quat, b: Quat) => (2 * Math.acos(Math.min(1, Math.abs(quat.dot(quat.normalize(a), quat.normalize(b)))))) * (180 / Math.PI)

/** Rotation matrices written out by hand, to check the quaternion maths against. */
const rad = (d: number) => (d * Math.PI) / 180
const rotX = (d: number): Mat4 => [1, 0, 0, 0, 0, Math.cos(rad(d)), Math.sin(rad(d)), 0, 0, -Math.sin(rad(d)), Math.cos(rad(d)), 0, 0, 0, 0, 1]
const rotY = (d: number): Mat4 => [Math.cos(rad(d)), 0, -Math.sin(rad(d)), 0, 0, 1, 0, 0, Math.sin(rad(d)), 0, Math.cos(rad(d)), 0, 0, 0, 0, 1]
const rotZ = (d: number): Mat4 => [Math.cos(rad(d)), Math.sin(rad(d)), 0, 0, -Math.sin(rad(d)), Math.cos(rad(d)), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

describe('vec3', () => {
  it('is right-handed and keeps the zero vector zero', () => {
    expect(vec3.cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1])
    expect(vec3.normalize([0, 0, 0])).toEqual([0, 0, 0])
    close(vec3.normalize([3, 0, 4]), [0.6, 0, 0.8])
    expect(vec3.distance([1, 2, 3], [4, 6, 3])).toBe(5)
    expect(vec3.lerp([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15])
  })
})

describe('quat', () => {
  it('fromEuler turns in YXZ order, as CSS rotateY() rotateX() rotateZ()', () => {
    for (const [x, y, z] of [[30, 0, 0], [0, 45, 0], [0, 0, 60], [20, -70, 35], [-80, 120, 10]]) {
      const expected = mat4.multiply(mat4.multiply(rotY(y), rotX(x)), rotZ(z))
      close(mat4.fromQuat(quat.fromEuler(x, y, z)), expected)
    }
  })

  it('toEuler gives the angles back, and keeps the rotation through gimbal lock', () => {
    for (const angles of [[10, 20, 30], [-45, 170, -20], [89, -30, 15], [0, 0, 0]] as Vec3[]) {
      close(quat.toEuler(quat.fromEuler(...angles)), angles, 6)
    }
    // Pitch straight up: yaw and roll share an axis, so only the rotation is the same.
    const locked = quat.fromEuler(90, 40, 25)
    const back = quat.toEuler(locked)
    expect(back[0]).toBeCloseTo(90, 4) // asin loses precision right at ±90°
    expect(back[2]).toBe(0)
    expect(angleBetween(quat.fromEuler(...back), locked)).toBeLessThan(1e-4)
  })

  it('rotateVec3 turns a point as the rotation matrix does', () => {
    const q = quat.fromEuler(25, -60, 110)
    const p: Vec3 = [1, -2, 3]
    close(quat.rotateVec3(q, p), mat4.transformPoint(mat4.fromQuat(q), p))
    close(quat.rotateVec3(quat.fromAxisAngle([0, 0, 1], 90), [1, 0, 0]), [0, 1, 0])
  })

  it('multiply applies the right-hand rotation first', () => {
    const a = quat.fromAxisAngle([0, 1, 0], 90)
    const b = quat.fromAxisAngle([1, 0, 0], 90)
    close(mat4.fromQuat(quat.multiply(a, b)), mat4.multiply(mat4.fromQuat(a), mat4.fromQuat(b)))
    close(quat.multiply(a, quat.conjugate(a)), quat.identity())
  })

  describe('slerp', () => {
    const a = quat.fromEuler(0, 0, 0)
    const b = quat.fromEuler(0, 120, 0)

    it('lands exactly on its ends and stays unit length', () => {
      close(quat.slerp(a, b, 0), a)
      close(quat.slerp(a, b, 1), b)
      for (let t = 0; t <= 1; t += 0.1) expect(quat.length(quat.slerp(a, b, t))).toBeCloseTo(1, 12)
    })

    it('turns at a steady speed', () => {
      for (const t of [0.25, 0.5, 0.75]) expect(angleBetween(a, quat.slerp(a, b, t))).toBeCloseTo(120 * t, 6)
    })

    it('goes the short way round: q and -q are the same rotation', () => {
      const negated = b.map((v) => -v) as Quat
      expect(angleBetween(quat.slerp(a, negated, 0.5), quat.slerp(a, b, 0.5))).toBeLessThan(1e-6)
      expect(angleBetween(a, quat.slerp(a, negated, 0.5))).toBeCloseTo(60, 6)
    })

    it('handles nearly equal rotations without dividing by zero', () => {
      const c = quat.fromEuler(0, 0.001, 0)
      const mid = quat.slerp(a, c, 0.5)
      expect(mid.every(Number.isFinite)).toBe(true)
      expect(quat.length(mid)).toBeCloseTo(1, 12)
    })

    it('normalises its inputs, and carries on along the arc past 0..1 (back, elastic eases)', () => {
      close(quat.slerp([0, 0, 0, 2], b, 0), a)
      expect(angleBetween(a, quat.slerp(a, b, 1.25))).toBeCloseTo(150, 6)
    })
  })
})

describe('mat4', () => {
  it('multiplies with the identity and inverts a transform', () => {
    const m = mat4.compose([1, 2, 3], quat.fromEuler(10, 20, 30), [2, 3, 4])
    close(mat4.multiply(mat4.identity(), m), m)
    close(mat4.multiply(m, mat4.invert(m)!), mat4.identity())
    expect(mat4.invert(mat4.scaling([1, 0, 1]))).toBeNull()
    close(mat4.transpose(mat4.transpose(m)), m)
  })

  it('compose scales, then rotates, then moves', () => {
    const m = mat4.compose([10, 0, 0], quat.fromAxisAngle([0, 0, 1], 90), [2, 2, 2])
    close(mat4.transformPoint(m, [1, 0, 0]), [10, 2, 0])
    const byHand = mat4.multiply(mat4.translation([10, 0, 0]), mat4.multiply(rotZ(90), mat4.scaling([2, 2, 2])))
    close(m, byHand)
  })

  it('lookAt puts the camera at the origin, looking down -z', () => {
    const view = mat4.lookAt([0, 0, 10], [0, 0, 0])
    close(mat4.transformPoint(view, [0, 0, 10]), [0, 0, 0])
    close(mat4.transformPoint(view, [0, 0, 0]), [0, 0, -10])
    const side = mat4.lookAt([5, 0, 0], [0, 0, 0])
    close(mat4.transformPoint(side, [0, 0, 0]), [0, 0, -5])
    close(mat4.transformPoint(side, [0, 1, 0]), [0, 1, -5])
  })

  it('perspective maps the near plane to -1 and the far plane to 1, and shrinks with distance', () => {
    const p = mat4.perspective(90, 1, 1, 100)
    expect(mat4.transformPoint(p, [0, 0, -1])[2]).toBeCloseTo(-1, 9)
    expect(mat4.transformPoint(p, [0, 0, -100])[2]).toBeCloseTo(1, 9)
    // A 90° field of view: a point as far to the side as in front lands on the edge.
    expect(mat4.transformPoint(p, [5, 0, -5])[0]).toBeCloseTo(1, 9)
    expect(mat4.transformPoint(p, [5, 0, -10])[0]).toBeCloseTo(0.5, 9)
  })

  it('orthographic maps its box onto -1..1', () => {
    const o = mat4.orthographic(-2, 2, -1, 1, 0.5, 10)
    close(mat4.transformPoint(o, [2, 1, -0.5]), [1, 1, -1])
    close(mat4.transformPoint(o, [-2, -1, -10]), [-1, -1, 1])
  })

  it('is plain data: JSON round-trips exactly', () => {
    const m = mat4.compose([1, 2, 3], quat.fromEuler(10, 20, 30), [1, 1, 1])
    expect(JSON.parse(JSON.stringify(m))).toEqual(m)
  })
})

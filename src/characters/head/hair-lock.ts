import type { Vec3 } from '../rig/body-plan'
import type { HairMotion } from './hair'

/** A point on a lock's curve, in the head's own coordinates. */
export interface HairLockPoint {
  /** Degrees round from the face toward the character's left; use continuous angles across the back. */
  around: number
  /** Head radii up from the centre; negative values hang below the scalp. */
  up: number
  /** Extra distance out from the hair cap, head radii (default 0). */
  lift?: number
}

/** A broad, curved section of hair, as editable, serializable data. */
export interface HairLock {
  /** Root, two controls, tip; append groups of three points for more cubic segments. */
  path: HairLockPoint[]
  /** Maximum width, head radii. Roots blend into the cap and tips taper. */
  width: number
  /** How much the ends follow hair.swing/trail/lift (default 1; 0 pins the lock). */
  follow?: number
}

export interface HairLockSample {
  center: Vec3
  left: Vec3
  right: Vec3
  normal: Vec3
  t: number
}

const rad = (degrees: number) => degrees * Math.PI / 180
const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v) || 1
  return v.map(value => value / length) as Vec3
}
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

function smoothMaximum(value: number, minimum: number, margin: number): number {
  if (value >= minimum + margin) return value
  if (value <= minimum - margin) return minimum
  return minimum + (value - minimum + margin) ** 2 / (4 * margin)
}

function outsideSkull(point: Vec3, margin: number, normal: Vec3): Vec3 {
  const direction = normalize(normal)
  const height = point.reduce((sum, value, axis) => sum + value * direction[axis], 0)
  const tangent = point.map((value, axis) => value - height * direction[axis])
  const tangentSquared = tangent.reduce((sum, value) => sum + value * value, 0)
  const clearance = Math.sqrt(smoothMaximum(1 - tangentSquared, margin * margin, margin * margin))
  const offset = smoothMaximum(height, clearance, margin) - height
  return offset === 0 ? point : point.map((value, axis) => value + direction[axis] * offset) as Vec3
}

/** Reject malformed paths before they reach a renderer or a saved character. */
export function copyHairLock(lock: HairLock): HairLock {
  if (lock.path.length < 4 || (lock.path.length - 1) % 3 !== 0) throw new Error('hair: a lock path needs a root and groups of three cubic points')
  if (!Number.isFinite(lock.width) || lock.width <= 0 || (lock.follow !== undefined && (!Number.isFinite(lock.follow) || lock.follow < 0))) {
    throw new Error('hair: lock width must be positive and follow must be nonnegative')
  }
  for (const point of lock.path) {
    if (!Number.isFinite(point.around) || !Number.isFinite(point.up) || point.up > 1 || (point.lift !== undefined && (!Number.isFinite(point.lift) || point.lift < 0))) {
      throw new Error('hair: lock points need finite around/up values, up <= 1 and nonnegative lift')
    }
  }
  const root = lock.path[0]
  if (root.up < 0 || (root.lift ?? 0) !== 0) throw new Error('hair: a lock root must lie on the scalp (up 0..1, lift 0)')
  return { ...lock, path: lock.path.map(point => ({ ...point })) }
}

/**
 * Sample a lock as a ribbon on the scalp, then hanging off it. Curves are
 * evaluated in scalp coordinates, so a sweep never cuts through the skull.
 * Motion bends the ends progressively and leaves the root fixed. No clock,
 * renderer or previous frame is needed.
 */
export function sampleHairLock(lock: HairLock, volume: number, pad: number, motion: HairMotion): HairLockSample[] {
  const segments = (lock.path.length - 1) / 3
  const steps = segments * 20
  const samples: HairLockSample[] = []
  const clearanceNormals: Vec3[] = []
  const deforming = motion.trail !== 0 || motion.lift !== 0
  const margin = Math.max(0, volume + pad)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const segment = Math.min(segments - 1, Math.floor(t * segments))
    const local = t * segments - segment
    const u = 1 - local
    const weights = [u ** 3, 3 * u * u * local, 3 * u * local * local, local ** 3]
    const points = lock.path.slice(segment * 3, segment * 3 + 4)
    const around = rad(points.reduce((sum, point, k) => sum + point.around * weights[k], 0))
    const up = points.reduce((sum, point, k) => sum + point.up * weights[k], 0)
    const lift = points.reduce((sum, point, k) => sum + (point.lift ?? 0) * weights[k], 0)
    const radius = 1 + volume + pad + lift
    const ring = up >= 0 ? Math.sqrt(Math.max(0, 1 - up * up)) : 1
    const weight = t * t * (lock.follow ?? 1)
    const angle = rad(motion.swing) * weight
    const a = around - angle
    const rest: Vec3 = [Math.sin(a) * ring * radius, up * (up >= 0 ? radius : 1), Math.cos(a) * ring * radius]
    const deformed: Vec3 = [rest[0], rest[1] + motion.lift * weight, rest[2] - motion.trail * weight]
    const normal: Vec3 = [Math.sin(a) * ring, Math.max(0, up), Math.cos(a) * ring]
    const clearanceNormal = normalize(rest)
    const center = deforming && weight > 0 ? outsideSkull(deformed, margin, clearanceNormal) : deformed
    clearanceNormals.push(clearanceNormal)
    samples.push({ center, normal, left: center, right: center, t })
  }
  samples.forEach((sample, i) => {
    const a = samples[Math.max(0, i - 1)].center
    const b = samples[Math.min(steps, i + 1)].center
    const tangent = b.map((value, axis) => value - a[axis]) as Vec3
    const across = normalize(cross(sample.normal, tangent))
    const half = lock.width * Math.sin(Math.PI * sample.t) ** 0.6 * 0.5
    sample.left = sample.center.map((value, axis) => value + across[axis] * half) as Vec3
    sample.right = sample.center.map((value, axis) => value - across[axis] * half) as Vec3
    if (deforming && sample.t > 0 && (lock.follow ?? 1) > 0) {
      sample.left = outsideSkull(sample.left, margin, clearanceNormals[i])
      sample.right = outsideSkull(sample.right, margin, clearanceNormals[i])
    }
  })
  return samples
}

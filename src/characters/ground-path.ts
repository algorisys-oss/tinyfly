import type { Keyframe } from '../engine/types'
import type { Vec3 } from '../engine/math'
import { smoothPath } from './props/shapes'

/**
 * Paths on the ground, for things moving through a 3D scene in world metres
 * (props with `propScript3D`, characters with `characterScript3D`): smooth
 * paths through points, the point and direction a distance along one,
 * headings (0 faces +z, 90 faces +x, as an object's `rotation` y turns it),
 * and the time an eased move reaches a distance.
 */

/** A point on the ground, [x, z] metres. */
export type GroundPoint = [number, number]

export const isGroundPoint = (value: unknown): value is GroundPoint => Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === 'number' && Number.isFinite(v))

/** The way from `heading` to `toward`, degrees, the shorter way round (−180..180). */
export function turnBetween(heading: number, toward: number): number {
  return ((((toward - heading) % 360) + 540) % 360) - 180
}

/** Keys in time order, one per time (the last given wins). */
export function tidy(frames: Keyframe<number>[]): Keyframe<number>[] {
  const sorted = frames.map((frame, i) => ({ frame, i })).sort((a, b) => a.frame.time - b.frame.time || a.i - b.i).map(({ frame }) => frame)
  return sorted.filter((frame, i) => i + 1 >= sorted.length || sorted[i + 1].time !== frame.time)
}

/** Heading from one point to another, degrees: 0 along +z, 90 along +x (as `rotation` y turns a prop). */
export function headingOf(from: GroundPoint, to: GroundPoint): number {
  return (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI
}

/** A path through points, curving smoothly through them, with the distance along it at each point. */
export function groundPath(points: GroundPoint[]): Array<{ point: GroundPoint; at: number }> {
  const distinct = points.filter((p, i) => i === 0 || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 1e-6)
  if (distinct.length < 2) return []
  const curve: GroundPoint[] =
    distinct.length === 2 ? distinct : smoothPath(distinct.map(([px, pz]): Vec3 => [px, 0, pz]), (distinct.length - 1) * 12).map(([px, , pz]): GroundPoint => [px, pz])
  let at = 0
  return curve.map((point, i) => {
    if (i > 0) at += Math.hypot(point[0] - curve[i - 1][0], point[1] - curve[i - 1][1])
    return { point, at }
  })
}

/** The point `s` metres along a path, and the way the path goes there. */
export function along(path: Array<{ point: GroundPoint; at: number }>, s: number): { point: GroundPoint; direction: GroundPoint } {
  let i = 1
  while (i < path.length - 1 && path[i].at < s) i++
  const a = path[i - 1]
  const b = path[i]
  const u = b.at > a.at ? Math.max(0, Math.min(1, (s - a.at) / (b.at - a.at))) : 0
  return {
    point: [a.point[0] + (b.point[0] - a.point[0]) * u, a.point[1] + (b.point[1] - a.point[1]) * u],
    direction: [b.point[0] - a.point[0], b.point[1] - a.point[1]],
  }
}

/** The input at which an easing reaches `y` (eases are rising), by halving. */
export function inverse(ease: (u: number) => number, y: number): number {
  if (y <= 0) return 0
  if (y >= 1) return 1
  let low = 0
  let high = 1
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2
    if (ease(middle) < y) low = middle
    else high = middle
  }
  return (low + high) / 2
}

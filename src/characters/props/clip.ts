import type { Vec3 } from '../../engine/math'

/**
 * Clipping at a camera's near plane, in view space (the eye at the origin
 * looking down −z): what is closer than `near` metres, or behind the eye,
 * is cut away before it is projected, since a perspective projection turns
 * points behind the eye inside out.
 */

const inFront = (p: Vec3, near: number) => p[2] <= -near

/** Where the segment a → b crosses the near plane. */
function crossing(a: Vec3, b: Vec3, near: number): Vec3 {
  const t = (-near - a[2]) / (b[2] - a[2])
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, -near]
}

/** A closed polygon cut to the part in front of the near plane (empty when none of it is). */
export function clipPolygon(points: Vec3[], near: number): Vec3[] {
  if (points.every((p) => inFront(p, near))) return points
  const out: Vec3[] = []
  points.forEach((current, i) => {
    const previous = points[(i + points.length - 1) % points.length]
    const now = inFront(current, near)
    const before = inFront(previous, near)
    if (now !== before) out.push(crossing(previous, current, near))
    if (now) out.push(current)
  })
  return out.length >= 3 ? out : []
}

/** An open line cut into the runs in front of the near plane. */
export function clipPolyline(points: Vec3[], near: number): Vec3[][] {
  if (points.every((p) => inFront(p, near))) return [points]
  const runs: Vec3[][] = []
  let run: Vec3[] = []
  points.forEach((current, i) => {
    const now = inFront(current, near)
    if (i > 0) {
      const previous = points[i - 1]
      const before = inFront(previous, near)
      if (before && !now) {
        run.push(crossing(previous, current, near))
        runs.push(run)
        run = []
      } else if (!before && now) run.push(crossing(previous, current, near))
    }
    if (now) run.push(current)
  })
  if (run.length > 0) runs.push(run)
  return runs.filter((r) => r.length >= 2)
}

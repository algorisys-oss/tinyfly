import type { Point } from './sketch'

/**
 * Polyline helpers measured by length, so `progress` 0..1 means "this much of
 * the way along", whatever the spacing of the points. Drawing on, erasing and
 * the hand that follows a stroke all use them.
 */

/** Total length of a polyline. */
export function pathLength(points: Point[]): number {
  let length = 0
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  return length
}

/** The start of a polyline, up to `progress` (0..1) of its length. */
export function partialPath(points: Point[], progress: number): Point[] {
  const t = Math.min(1, Math.max(0, progress))
  if (points.length < 2 || t === 1) return points.slice()
  if (t === 0) return points.slice(0, 1)
  let remaining = pathLength(points) * t
  const result = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    if (length >= remaining) {
      const f = length === 0 ? 0 : remaining / length
      result.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })
      return result
    }
    result.push(b)
    remaining -= length
  }
  return result
}

/** Where along a polyline `progress` (0..1) of its length is. */
export function pointAlong(points: Point[], progress: number): Point {
  const partial = partialPath(points, progress)
  return partial[partial.length - 1]
}

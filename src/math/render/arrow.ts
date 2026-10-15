import type { Vec2 } from '../linear/vec2'

/**
 * An arrow's geometry: the shaft (stopping where the head begins, so the line
 * never pokes through the point) and the head's three corners. Pure; both
 * renderers draw from it.
 */
export function arrowGeometry(points: Vec2[], head: number): { shaft: Vec2[]; head: [Vec2, Vec2, Vec2] | undefined } {
  if (points.length < 2) return { shaft: points, head: undefined }
  const tip = points[points.length - 1]
  const before = points[points.length - 2]
  const dx = tip[0] - before[0]
  const dy = tip[1] - before[1]
  const length = Math.hypot(dx, dy)
  if (length === 0 || head <= 0) return { shaft: points, head: undefined }
  const ux = dx / length
  const uy = dy / length
  const size = Math.min(head, length)
  const base: Vec2 = [tip[0] - ux * size, tip[1] - uy * size]
  const half = size * 0.55
  return {
    shaft: [...points.slice(0, -1), base],
    head: [tip, [base[0] - uy * half, base[1] + ux * half], [base[0] + uy * half, base[1] - ux * half]],
  }
}

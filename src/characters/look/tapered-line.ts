import type { Point } from '../../adapters/canvas/sketch'

/**
 * The outline of a line through `points` whose width runs from `startWidth` to
 * `endWidth`: up one side and back down the other, square to the line at each
 * point. A sleeve or trouser leg along a limb is this shape, filled.
 */
export function taperedOutline(points: Point[], startWidth: number, endWidth: number): Point[] {
  const n = points.length
  if (n < 2) return []
  const left: Point[] = []
  const right: Point[] = []
  const widthAt = (i: number) => startWidth + ((endWidth - startWidth) * i) / (n - 1)
  points.forEach((p, i) => {
    // Offset square to the line here: along the neighbours' direction.
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(n - 1, i + 1)]
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const half = widthAt(i) / 2
    const nx = (-(b.y - a.y) / length) * half
    const ny = ((b.x - a.x) / length) * half
    left.push({ x: p.x + nx, y: p.y + ny })
    right.push({ x: p.x - nx, y: p.y - ny })
  })
  return [...left, ...right.reverse()]
}

/**
 * Fill a line through `points` whose width runs from `startWidth` to
 * `endWidth`, with round ends: a limb that tapers, or a sleeve or trouser leg
 * along a joint polyline. Uses the context's fill style.
 */
export function taperedLine(ctx: CanvasRenderingContext2D, points: Point[], startWidth: number, endWidth: number): void {
  const n = points.length
  if (n < 2) return
  const outline = taperedOutline(points, startWidth, endWidth)
  const widthAt = (i: number) => startWidth + ((endWidth - startWidth) * i) / (n - 1)
  ctx.beginPath()
  ctx.moveTo(outline[0].x, outline[0].y)
  for (const p of outline.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.closePath()
  ctx.fill()
  // Round the ends, and a sharp joint (a straight-jointed elbow or knee).
  points.forEach((p, i) => {
    if (i !== 0 && i !== n - 1 && n > 3) return
    ctx.beginPath()
    ctx.arc(p.x, p.y, widthAt(i) / 2, 0, Math.PI * 2)
    ctx.fill()
  })
}

import type { Point } from '../../adapters/canvas/sketch'
import type { SkinShading } from '../body/organic-body'

/** A deterministic cel band clipped to the moving face/palm contour. */
export function shadeSkinOutline(ctx: CanvasRenderingContext2D, outline: Point[], center: Point, material: SkinShading): void {
  if (material.mode !== 'cel' || outline.length < 3) return
  const lightLength = Math.hypot(...material.light)
  const inner = outline.map(point => {
    const dx = point.x - center.x, dy = point.y - center.y
    const facing = (dx * material.light[0] + dy * material.light[1]) / ((Math.hypot(dx, dy) || 1) * lightLength)
    const inset = Math.max(0, -facing) * 0.24
    return { x: point.x - dx * inset, y: point.y - dy * inset }
  })
  const trace = (points: Point[]) => {
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
    ctx.closePath()
  }
  ctx.save(); trace(outline); ctx.clip()
  trace([...outline, ...inner.reverse()])
  ctx.globalAlpha *= material.opacity; ctx.fillStyle = material.shadow; ctx.fill()
  ctx.restore()
}

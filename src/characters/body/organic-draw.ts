import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints } from '../character'
import { unfilledPen, type Pen } from '../look/pen'
import type { OrganicBody } from './organic-body'
import { insideBodyContour, type OrganicContour } from './organic-geometry'

function trace(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  ctx.closePath()
}

function shade(ctx: CanvasRenderingContext2D, shape: OrganicContour, body: OrganicBody): void {
  const material = body.shading
  if (material.mode === 'none' || body.fill === 'none') return
  const length = Math.hypot(...material.light)
  const light = { x: material.light[0] / length, y: material.light[1] / length }
  const alpha = ctx.globalAlpha
  ctx.save(); trace(ctx, shape.outline); ctx.clip()
  for (const side of ['left', 'right'] as const) {
    const outer = shape.samples.map(sample => sample[side])
    const inner = shape.samples.map(sample => {
      const edge = sample[side], center = sample.center
      const x = edge.x - center.x, y = edge.y - center.y
      const facing = (x * light.x + y * light.y) / (Math.hypot(x, y) || 1)
      const amount = Math.max(0, -facing) * 0.44
      return { x: edge.x + (center.x - edge.x) * amount, y: edge.y + (center.y - edge.y) * amount }
    })
    trace(ctx, [...outer, ...inner.reverse()]); ctx.fillStyle = material.shadow; ctx.globalAlpha = alpha * material.opacity; ctx.fill()
    if (material.highlight > 0) {
      const highlights = shape.samples.map(sample => {
        const edge = sample[side], center = sample.center
        return { x: edge.x + (center.x - edge.x) * 0.2, y: edge.y + (center.y - edge.y) * 0.2 }
      })
      const edge = shape.samples[Math.floor(shape.samples.length / 2)][side]
      const center = shape.samples[Math.floor(shape.samples.length / 2)].center
      if ((edge.x - center.x) * light.x + (edge.y - center.y) * light.y > 0) {
        ctx.globalAlpha = alpha * material.highlight; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, shape.samples[0].width * 0.16)
        ctx.beginPath(); ctx.moveTo(highlights[0].x, highlights[0].y)
        for (const point of highlights.slice(1)) ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

/** Hide only attached borders; foreground limbs retain their overlap contours. */
function joined(point: Point, at: number, id: string, joints: CharacterJoints): boolean {
  const contours = joints.bodyContours!
  const contains = (other: string) => contours[other] && insideBodyContour(point, contours[other].outline)
  if (id.startsWith('arm.')) return at < 0.2 && contains('spine')
  if (id.startsWith('leg.')) return at < 0.2 && contains('spine') || at > 0.85 && contains(id.replace('leg.', 'foot.'))
  if (id.startsWith('foot.')) return at < 0.25 && contains(id.replace('foot.', 'leg.'))
  if (id === 'neck') return at < 0.6 && contains('spine')
  if (id === 'spine') {
    if (at > 0.85 && contains('neck')) return true
    for (const side of ['left', 'right']) {
      if (at > 0.6 && contains(`arm.${side}`)) {
        const root = joints.chains[`arm.${side}`]?.[0]
        if (root && Math.hypot(root.x - point.x, root.y - point.y) < joints.height * 0.07) return true
      }
      if (at < 0.25 && contains(`leg.${side}`)) return true
    }
  }
  return false
}

/** One part at its native depth; no foreground whole-body overlay. */
export function drawOrganicPart(ctx: CanvasRenderingContext2D, pen: Pen, body: OrganicBody, joints: CharacterJoints, id: string): boolean {
  const shape = joints.bodyContours?.[id]
  if (!shape) return false
  if (body.fill === 'none') pen = unfilledPen(ctx, pen)
  pen.shape(shape.outline, body.fill === 'none' ? null : body.fill, 0)
  if (pen.look === 'clean') shade(ctx, shape, body)
  if ((pen.look !== 'silhouette' || body.fill === 'none') && joints.lineWidth > 0) {
    let run: Point[] = []
    for (let i = 0; i <= shape.outline.length; i++) {
      const index = i % shape.outline.length
      const point = shape.outline[index]
      const next = shape.outline[(index + 1) % shape.outline.length]
      const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 }
      const handEnd = id.startsWith('arm.') && shape.positions[index] === 1
      if (handEnd || joined(midpoint, shape.positions[index], id, joints)) {
        if (run.length >= 2) pen.line(run, joints.lineWidth)
        run = []
      } else {
        if (run.length === 0) run.push(point)
        run.push(next)
      }
    }
    if (run.length >= 2) pen.line(run, joints.lineWidth)
  }
  return true
}

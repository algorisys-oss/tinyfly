import type { Vec2 } from '../linear/vec2'
import type { DisplayList, Shape } from '../figure/display-list'
import { arrowGeometry } from './arrow'

function trace(ctx: CanvasRenderingContext2D, points: Vec2[], closed = false): void {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  if (closed) ctx.closePath()
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.globalAlpha = shape.opacity ?? 1
  switch (shape.type) {
    case 'line':
      if (shape.points.length < 2) return
      if (shape.clip?.length) {
        ctx.save()
        for (const { points, outside } of shape.clip) {
          trace(ctx, points, true)
          if (outside) {
            // A huge rectangle around it, filled even-odd: everything but the polygon.
            ctx.rect(-1e6, -1e6, 2e6, 2e6)
            ctx.clip('evenodd')
          } else {
            ctx.clip()
          }
        }
        drawShape(ctx, { ...shape, clip: undefined })
        ctx.restore()
        return
      }
      trace(ctx, shape.points, shape.closed)
      if (shape.fill) {
        ctx.fillStyle = shape.fill
        ctx.fill()
      }
      if (shape.stroke && (shape.width ?? 1) > 0) {
        ctx.strokeStyle = shape.stroke
        ctx.lineWidth = shape.width ?? 1
        ctx.setLineDash(shape.dash ?? [])
        ctx.stroke()
        ctx.setLineDash([])
      }
      return
    case 'arrow': {
      const { shaft, head } = arrowGeometry(shape.points, shape.head)
      ctx.strokeStyle = shape.stroke
      ctx.fillStyle = shape.stroke
      ctx.lineWidth = shape.width
      if (shaft.length >= 2) {
        trace(ctx, shaft)
        ctx.stroke()
      }
      if (head) {
        trace(ctx, head, true)
        ctx.fill()
      }
      return
    }
    case 'circle':
      ctx.beginPath()
      ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2)
      if (shape.fill) {
        ctx.fillStyle = shape.fill
        ctx.fill()
      }
      if (shape.stroke) {
        ctx.strokeStyle = shape.stroke
        ctx.lineWidth = shape.width ?? 1
        ctx.stroke()
      }
      return
    case 'text':
      ctx.font = `${shape.italic ? 'italic ' : ''}${shape.size}px ${shape.font}`
      ctx.textAlign = shape.align
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = shape.color
      ctx.fillText(shape.text, shape.x, shape.y)
  }
}

/**
 * Draws a display list on a Canvas 2D context (a page, an OffscreenCanvas in a
 * Worker, or @napi-rs/canvas in Node), clipped to the figure's box at 0, 0.
 */
export function drawDisplayList(ctx: CanvasRenderingContext2D, list: DisplayList): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, list.width, list.height)
  ctx.clip()
  if (list.background) {
    ctx.fillStyle = list.background
    ctx.fillRect(0, 0, list.width, list.height)
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const shape of list.shapes) drawShape(ctx, shape)
  ctx.restore()
}

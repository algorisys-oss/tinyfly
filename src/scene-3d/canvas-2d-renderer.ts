import type { ResolvedScene3D } from './resolve-scene'
import { shadeTriangle } from './shading'

/** What renders a resolved frame: synchronous, it never loads anything. */
export interface Renderer3D {
  render(frame: ResolvedScene3D): void
}

/**
 * Draws a resolved scene on a 2D canvas: back to front, each triangle filled
 * with its shaded colour, then its ink. Works in browsers, Workers
 * (OffscreenCanvas) and Node (`@napi-rs/canvas`), and gives the same pixels
 * for the same frame on the same canvas backend.
 *
 * Painter's order: long triangles that cross one another can sort wrongly;
 * keep meshes modest in size, or use more segments.
 */
export class Canvas2DRenderer implements Renderer3D {
  private readonly ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  render(frame: ResolvedScene3D): void {
    drawResolvedScene(this.ctx, frame)
  }
}

/** Draw a resolved frame on `ctx` at (0, 0), `frame.width` × `frame.height`. */
export function drawResolvedScene(ctx: CanvasRenderingContext2D, frame: ResolvedScene3D): void {
  ctx.save()
  if (frame.background && frame.background !== 'transparent') {
    ctx.fillStyle = frame.background
    ctx.fillRect(0, 0, frame.width, frame.height)
  }
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  // Triangles and added objects (characters) merge into one order: by layer, then far to near.
  let next = 0
  const drawablesUpTo = (layer: number, depth: number) => {
    while (next < frame.drawables.length) {
      const d = frame.drawables[next]
      if (d.layer > layer || (d.layer === layer && d.depth <= depth)) break
      ctx.save()
      d.draw(ctx, frame)
      ctx.restore()
      next++
    }
  }
  // Ink waits: an edge's ink is drawn once the faces of the same object at about its depth are
  // painted, so its neighbours' fills and seam strokes never nick it. It goes down before anything
  // of another object or clearly nearer, which may cover it.
  let pending: Array<{ objectId: string; layer: number; depth: number; triangle: (typeof frame.triangles)[number] }> = []
  const inkPending = (before?: { objectId: string; layer: number; depth: number }) => {
    if (pending.length === 0) return
    const keep: typeof pending = []
    for (const ink of pending) {
      const near = before && before.objectId === ink.objectId && before.layer === ink.layer && ink.depth - before.depth <= INK_HOLD * ink.depth
      if (near) keep.push(ink)
      else drawInk(ctx, ink.triangle)
    }
    pending = keep
  }
  for (const triangle of frame.triangles) {
    inkPending(triangle)
    drawablesUpTo(triangle.layer, triangle.depth)
    const { color, alpha } = shadeTriangle(triangle, frame.lights, frame.camera, frame.fog)
    const [a, b, c] = triangle.screen
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.lineTo(c.x, c.y)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    // An opaque triangle is also stroked in its own colour, a hair wide, so
    // the anti-aliased edges between neighbours leave no light seams.
    if (alpha >= 1) {
      ctx.strokeStyle = color
      ctx.lineWidth = 0.75
      ctx.stroke()
    }
    if (triangle.material.outline && triangle.outline.length > 0) {
      pending.push({ objectId: triangle.objectId, layer: triangle.layer, depth: triangle.depth, triangle })
    }
  }
  inkPending()
  drawablesUpTo(Infinity, -Infinity)
  ctx.restore()
}

/** How far nearer (as a share of its own depth) a face of the same object may be and still be painted before an edge's ink. */
const INK_HOLD = 0.04

function drawInk(ctx: CanvasRenderingContext2D, triangle: ResolvedScene3D['triangles'][number]): void {
  const ink = triangle.material.outline!
  ctx.globalAlpha = triangle.opacity
  ctx.strokeStyle = ink.color
  ctx.lineWidth = ink.width
  ctx.beginPath()
  for (const [p, q] of triangle.outline) {
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(q.x, q.y)
  }
  ctx.stroke()
}

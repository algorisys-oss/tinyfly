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
  for (const triangle of frame.triangles) {
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
    const ink = triangle.material.outline
    if (ink && triangle.outline.length > 0) {
      ctx.strokeStyle = ink.color
      ctx.lineWidth = ink.width
      ctx.beginPath()
      for (const [p, q] of triangle.outline) {
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(q.x, q.y)
      }
      ctx.stroke()
    }
  }
  ctx.restore()
}

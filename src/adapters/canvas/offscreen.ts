/** A canvas that can be drawn on and drawn from: OffscreenCanvas, a DOM canvas, or a Node canvas. */
export interface CanvasLike {
  width: number
  height: number
  getContext(kind: '2d'): unknown
}

/**
 * An offscreen canvas of the same kind as `ctx`'s: an OffscreenCanvas where
 * there is one (browsers, Workers), else a DOM canvas from `ctx`'s document,
 * else the same canvas class (`@napi-rs/canvas` in Node). Null when none can
 * be made.
 */
export function canvasLike(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasLike | null {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height) as unknown as CanvasLike
  const source = ctx.canvas as unknown as { ownerDocument?: Document; constructor?: new (w: number, h: number) => CanvasLike }
  if (source?.ownerDocument) {
    const canvas = source.ownerDocument.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas as unknown as CanvasLike
  }
  try {
    return source?.constructor ? new source.constructor(width, height) : null
  } catch {
    return null
  }
}

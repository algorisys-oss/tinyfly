import type { AnimatableValue } from '../../engine/types'

/**
 * A 2D camera for canvas scenes: pan, zoom and rotate the whole picture.
 *
 * Like the editor's camera, it is just tracks on a reserved target (named
 * `Camera` by convention) with the properties `x`, `y` (pan, px), `scale`
 * (zoom about the stage centre) and `rotate` (degrees about the centre).
 * Three more add on top for shakes, so a shake never disturbs a pan:
 * `shakeX`, `shakeY` (px) and `shakeRotate` (degrees).
 *
 * A point `p` of the scene lands on screen at
 * `centre + (x, y) + shake + R(rotate) · scale · (p − centre)`.
 */
export interface CameraView {
  x: number
  y: number
  scale: number
  rotate: number
  shakeX: number
  shakeY: number
  shakeRotate: number
}

/** The camera that changes nothing. */
export const IDENTITY_CAMERA: CameraView = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 }

/** The camera's view from a target's animated values (missing ones are identity). */
export function cameraFromValues(values: Map<string, AnimatableValue> | undefined): CameraView {
  const read = (property: keyof CameraView) => {
    const value = values?.get(property)
    return typeof value === 'number' ? value : IDENTITY_CAMERA[property]
  }
  return {
    x: read('x'),
    y: read('y'),
    scale: read('scale'),
    rotate: read('rotate'),
    shakeX: read('shakeX'),
    shakeY: read('shakeY'),
    shakeRotate: read('shakeRotate'),
  }
}

/**
 * Transform a context so what is drawn next is seen through the camera.
 * `stage` is the scene's size. While shaking, the picture zooms in just
 * enough that the shake never shows past its edges.
 */
export function applyCamera(ctx: CanvasRenderingContext2D, view: CameraView, stage: { width: number; height: number }): void {
  const cx = stage.width / 2
  const cy = stage.height / 2
  const shake = Math.max(Math.abs(view.shakeX), Math.abs(view.shakeY))
  const overscan = 1 + (2 * shake) / Math.max(1, Math.min(stage.width, stage.height))
  ctx.translate(cx + view.x + view.shakeX, cy + view.y + view.shakeY)
  ctx.rotate(((view.rotate + view.shakeRotate) * Math.PI) / 180)
  ctx.scale(view.scale * overscan, view.scale * overscan)
  ctx.translate(-cx, -cy)
}

/** Where a scene point appears through the camera (no shake overscan): for placing captions or checking framing. */
export function cameraPoint(view: CameraView, stage: { width: number; height: number }, point: { x: number; y: number }): { x: number; y: number } {
  const cx = stage.width / 2
  const cy = stage.height / 2
  const angle = ((view.rotate + view.shakeRotate) * Math.PI) / 180
  const dx = (point.x - cx) * view.scale
  const dy = (point.y - cy) * view.scale
  return {
    x: cx + view.x + view.shakeX + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: cy + view.y + view.shakeY + dx * Math.sin(angle) + dy * Math.cos(angle),
  }
}

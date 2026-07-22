import type { AnimationState } from '../../engine'

/** The reserved target name the camera animates. */
export const CAMERA_TARGET = 'Camera'

export interface CameraState {
  x: number
  y: number
  scale: number
  rotate: number
}

/**
 * Read the camera (pan/zoom/rotate) from a timeline state. Returns `null` when
 * there's no camera or it's at identity, so callers can skip the transform.
 */
export function cameraFromState(state: AnimationState | null | undefined): CameraState | null {
  const vals = state?.values?.get(CAMERA_TARGET)
  if (!vals) return null
  const n = (p: string, d: number) => {
    const v = vals.get(p)
    return typeof v === 'number' ? v : d
  }
  const cam = { x: n('x', 0), y: n('y', 0), scale: n('scale', 1), rotate: n('rotate', 0) }
  if (cam.x === 0 && cam.y === 0 && cam.scale === 1 && cam.rotate === 0) return null
  return cam
}

/**
 * Apply the camera transform to a Canvas 2D context, matching the DOM preview
 * (`transform-origin: center` on a `translate() scale() rotate()` layer). Call
 * inside a `ctx.save()` / `ctx.restore()`. `(cx, cy)` is the stage centre.
 */
export function applyCameraToCtx(
  ctx: CanvasRenderingContext2D,
  cam: CameraState,
  cx: number,
  cy: number
): void {
  ctx.translate(cx, cy)
  ctx.translate(cam.x, cam.y)
  ctx.scale(cam.scale, cam.scale)
  ctx.rotate((cam.rotate * Math.PI) / 180)
  ctx.translate(-cx, -cy)
}

/** SVG `transform` string for the camera, around the stage centre `(cx, cy)`. */
export function cameraSvgTransform(cam: CameraState, cx: number, cy: number): string {
  return `translate(${cx} ${cy}) translate(${cam.x} ${cam.y}) scale(${cam.scale}) rotate(${cam.rotate}) translate(${-cx} ${-cy})`
}

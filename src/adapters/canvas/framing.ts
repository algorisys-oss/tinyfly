import { frameRect, safeAreas, type FrameAspectName, type FrameRect } from '../../engine/authoring/framing'
import type { ActiveTransition } from '../../scene-3d/shots'
import { canvasLike } from './offscreen'

/** Paint letterbox or pillarbox bars round the frame of an aspect; returns the frame left clear. */
export function drawLetterbox(ctx: CanvasRenderingContext2D, canvas: { width: number; height: number }, aspect: FrameAspectName | number, color = '#000000'): FrameRect {
  const frame = frameRect(canvas, aspect)
  ctx.save()
  ctx.fillStyle = color
  if (frame.y > 0) {
    ctx.fillRect(0, 0, canvas.width, frame.y)
    ctx.fillRect(0, frame.y + frame.height, canvas.width, canvas.height - frame.y - frame.height)
  }
  if (frame.x > 0) {
    ctx.fillRect(0, 0, frame.x, canvas.height)
    ctx.fillRect(frame.x + frame.width, 0, canvas.width - frame.x - frame.width, canvas.height)
  }
  ctx.restore()
  return frame
}

/** Draw the action-safe and title-safe guides of a frame (for stills while framing, not for the film). */
export function drawSafeAreas(ctx: CanvasRenderingContext2D, frame: FrameRect, options: { action?: number; title?: number; color?: string } = {}): void {
  const areas = safeAreas(frame, options)
  ctx.save()
  ctx.strokeStyle = options.color ?? 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  for (const rect of [areas.action, areas.title]) ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1)
  ctx.restore()
}

export interface TransitionDrawOptions {
  width: number
  height: number
  /** Draw the whole picture through one camera (the scene from that shot) */
  draw: (ctx: CanvasRenderingContext2D, cameraId: string) => void
}

/**
 * Draw a frame in the middle of a transition: the shot going out and the
 * shot coming in, blended by its progress. A crossfade mixes them; a dip
 * covers the cut with a colour that fades in and out; a wipe sweeps the new
 * shot across. Deterministic, like everything a frame draws. Without a
 * transition, draw the current shot yourself.
 */
export function drawTransition(ctx: CanvasRenderingContext2D, transition: ActiveTransition, options: TransitionDrawOptions): void {
  const { width, height, draw } = options
  const p = Math.min(1, Math.max(0, transition.progress))
  if (transition.kind === 'dipToBlack') {
    draw(ctx, p < 0.5 ? transition.from.camera : transition.to.camera)
    ctx.save()
    ctx.globalAlpha = 1 - Math.abs(p * 2 - 1)
    ctx.fillStyle = transition.color
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
    return
  }
  draw(ctx, transition.from.camera)
  const layer = canvasLike(ctx, width, height)
  const lctx = layer?.getContext('2d') as CanvasRenderingContext2D | null | undefined
  if (!layer || !lctx) {
    // No offscreen canvas: fall back to a cut half way.
    if (p >= 0.5) draw(ctx, transition.to.camera)
    return
  }
  draw(lctx, transition.to.camera)
  ctx.save()
  if (transition.kind === 'crossfade') {
    ctx.globalAlpha = p
  } else {
    // A wipe: the new shot shows inside a rectangle sweeping in from its direction.
    ctx.beginPath()
    switch (transition.direction) {
      case 'right': ctx.rect(width * (1 - p), 0, width * p, height); break
      case 'up': ctx.rect(0, height * (1 - p), width, height * p); break
      case 'down': ctx.rect(0, 0, width, height * p); break
      default: ctx.rect(0, 0, width * p, height)
    }
    ctx.clip()
  }
  ctx.drawImage(layer as unknown as CanvasImageSource, 0, 0)
  ctx.restore()
}

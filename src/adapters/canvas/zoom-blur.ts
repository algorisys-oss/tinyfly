import { canvasLike } from './offscreen'
import { hashSeed, createRandom } from '../../engine/authoring/random'

/**
 * The dive: a zoom blur streaks the picture out from a point, and dive lines
 * stream past the camera. Both are deterministic: the blur is a fixed set of
 * scaled copies, the lines are seeded, and a `phase` moves them round a loop.
 */

export interface ZoomBlurOptions {
  /** The point the blur radiates from, canvas px (default the centre) */
  centre?: { x: number; y: number }
  /** How far the streaks reach, as a fraction of each point's distance from the centre (default 0.08) */
  strength?: number
  /** Copies blended (default 8): more is smoother and slower */
  samples?: number
  /** `normal` (default) averages the copies; `add` adds their light, for neon on dark */
  blend?: 'normal' | 'add'
  /** How much of the blur shows over the original, 0..1 (default 1) */
  amount?: number
}

/** Add a zoom blur to what is drawn on `ctx` (its whole canvas, in device pixels). */
export function applyZoomBlur(ctx: CanvasRenderingContext2D, options: ZoomBlurOptions = {}): void {
  const canvas = ctx.canvas as unknown as { width: number; height: number }
  const W = canvas.width
  const H = canvas.height
  if (!(W > 0 && H > 0)) return
  const copy = canvasLike(ctx, W, H)
  const cctx = copy?.getContext('2d') as CanvasRenderingContext2D | null | undefined
  if (!copy || !cctx) return
  cctx.drawImage(ctx.canvas as CanvasImageSource, 0, 0)
  const samples = Math.max(1, Math.round(options.samples ?? 8))
  const strength = options.strength ?? 0.08
  const cx = options.centre?.x ?? W / 2
  const cy = options.centre?.y ?? H / 2
  const add = options.blend === 'add'
  const amount = Math.min(1, Math.max(0, options.amount ?? 1))
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.imageSmoothingEnabled = true
  if (add) ctx.globalCompositeOperation = 'lighter'
  for (let i = 1; i <= samples; i++) {
    const k = 1 + (strength * i) / samples
    // Averaging: each copy weighs 1/(i+1) over what is there so far; adding: a share of the light each.
    ctx.globalAlpha = amount * (add ? 0.9 / samples : 1 / (i + 1))
    ctx.drawImage(copy as unknown as CanvasImageSource, cx - cx * k, cy - cy * k, W * k, H * k)
  }
  ctx.restore()
}

export interface DiveLinesOptions {
  /** The point the lines radiate from, canvas px (default the centre) */
  centre?: { x: number; y: number }
  /** How many (default 28) */
  count?: number
  /** Where they start and end, px from the centre (defaults: 15% and 110% of the canvas's half-diagonal) */
  inner?: number
  outer?: number
  /** Each line's length as a fraction of outer − inner (default 0.35) */
  length?: number
  /** 0..1, moves the lines outward one line-length per unit; `phaseOf(time, period)` loops them */
  phase?: number
  /** Which way they stream: `out` (default, diving in) or `in` */
  direction?: 'out' | 'in'
  seed?: number | string
  color?: string
  /** Stroke width at the thick end, px (default 3) */
  width?: number
  opacity?: number
  /** `add` adds light (`'lighter'`) for neon on dark (default `normal`) */
  blend?: 'normal' | 'add'
}

/** Streaks radiating from a point, each a fading line, in canvas space. */
export function drawDiveLines(ctx: CanvasRenderingContext2D, options: DiveLinesOptions = {}): void {
  const canvas = ctx.canvas as unknown as { width: number; height: number }
  const cx = options.centre?.x ?? canvas.width / 2
  const cy = options.centre?.y ?? canvas.height / 2
  const half = Math.hypot(canvas.width, canvas.height) / 2
  const inner = options.inner ?? half * 0.15
  const outer = options.outer ?? half * 1.1
  const span = Math.max(1, outer - inner)
  const length = (options.length ?? 0.35) * span
  const count = Math.max(1, Math.round(options.count ?? 28))
  const random = createRandom(typeof options.seed === 'string' ? hashSeed(options.seed) : (options.seed ?? 1))
  const phase = options.phase ?? 0
  const sign = options.direction === 'in' ? -1 : 1
  ctx.save()
  ctx.strokeStyle = options.color ?? '#ffffff'
  ctx.lineCap = 'round'
  if (options.blend === 'add') ctx.globalCompositeOperation = 'lighter'
  const width = options.width ?? 3
  const opacity = options.opacity ?? 0.8
  for (let i = 0; i < count; i++) {
    const angle = ((i + random.next() * 0.6) / count) * Math.PI * 2
    const offset = random.next()
    const own = 0.6 + random.next() * 0.8
    // Along the radius, wrapping round: at phase 1 every line is where the next was.
    const u = ((offset + sign * phase) % 1 + 1) % 1
    const start = inner + u * span
    const end = start + length * own
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const gradient = ctx.createLinearGradient(cx + cos * start, cy + sin * start, cx + cos * end, cy + sin * end)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(0.5, options.color ?? '#ffffff')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.strokeStyle = gradient
    ctx.globalAlpha = opacity * Math.min(1, (start - inner) / span + 0.3)
    ctx.lineWidth = width * (0.4 + (0.6 * (start - inner)) / span)
    ctx.beginPath()
    ctx.moveTo(cx + cos * start, cy + sin * start)
    ctx.lineTo(cx + cos * Math.min(end, outer + length), cy + sin * Math.min(end, outer + length))
    ctx.stroke()
  }
  ctx.restore()
}

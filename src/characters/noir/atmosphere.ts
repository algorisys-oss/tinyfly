import { createRandom } from '../../engine/authoring/random'
import { clamp01, withAlpha } from './noir-utils'

/**
 * Noir atmosphere for canvas scenes: rain in a window, light through
 * venetian blinds, a dark room with torch beams and holes of light, soft
 * pools of light, a vignette, lightning and a failing bulb.
 *
 * Everything is a pure function of its options and the time (ms): rain drops
 * come from a seeded generator, never `Math.random`, so any frame draws the
 * same whether it is rendered in order, out of order, or scrubbed to.
 */

export interface NoirBox {
  x: number
  y: number
  width: number
  height: number
}

export interface RainOptions extends NoirBox {
  /** How many streaks (default 70) */
  drops?: number
  /** Streak opacity (default 0.35) */
  opacity?: number
  /** Streak colour (default a cold blue-white) */
  color?: string
  /** Fall speed of the slowest drop, px per second (default 900; the fastest are 60% quicker) */
  speed?: number
  /** Streak length, px (default 34) */
  length?: number
  /** Sideways drift over one streak, px; negative slants left (default -8) */
  slant?: number
  /** Stroke width, px (default 2) */
  lineWidth?: number
  /** Seed for where the drops fall (default 1) */
  seed?: number
}

/** Rain streaks falling inside a box (a window, the whole frame), clipped to it. */
export function drawRain(ctx: CanvasRenderingContext2D, time: number, options: RainOptions): void {
  const { x, y, width, height } = options
  const drops = Math.max(0, Math.round(options.drops ?? 70))
  if (drops === 0 || width <= 0 || height <= 0) return
  const speed = options.speed ?? 900
  const length = options.length ?? 34
  const slant = options.slant ?? -8
  const random = createRandom(options.seed ?? 1)
  const span = height + length * 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.strokeStyle = withAlpha(options.color ?? 'rgb(190,210,235)', options.opacity ?? 0.35)
  ctx.lineWidth = options.lineWidth ?? 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let i = 0; i < drops; i++) {
    const sx = x + random.next() * width
    const fall = speed * (1 + random.next() * 0.6)
    const offset = random.next() * span
    const travelled = (time / 1000) * fall + offset
    const sy = y - length + (((travelled % span) + span) % span)
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + slant, sy + length)
  }
  ctx.stroke()
  ctx.restore()
}

export interface BlindsOptions extends NoirBox {
  /** Band opacity (default 0.12) */
  opacity?: number
  /** Rise of each band per px across (default 0.35: falling to the right) */
  slope?: number
  /** Distance between bands, px (default 52) */
  spacing?: number
  /** Band thickness, px (default 24) */
  band?: number
  /** Light colour (default a warm white) */
  color?: string
}

/** Key light through venetian blinds: parallel slanted bright bands across a box. */
export function drawBlinds(ctx: CanvasRenderingContext2D, options: BlindsOptions): void {
  const { x, y, width, height } = options
  const slope = options.slope ?? 0.35
  const spacing = Math.max(4, options.spacing ?? 52)
  const band = options.band ?? 24
  const drop = width * slope
  const first = Math.floor((-Math.max(0, drop) - band) / spacing) - 1
  const last = Math.ceil((height - Math.min(0, drop)) / spacing) + 1
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.fillStyle = withAlpha(options.color ?? 'rgb(255,240,210)', options.opacity ?? 0.12)
  ctx.beginPath()
  for (let i = first; i <= last; i++) {
    const y0 = y + i * spacing
    ctx.moveTo(x, y0)
    ctx.lineTo(x + width, y0 + drop)
    ctx.lineTo(x + width, y0 + drop + band)
    ctx.lineTo(x, y0 + band)
    ctx.closePath()
  }
  ctx.fill()
  ctx.restore()
}

/** A torch beam: from (x, y) toward `angle` (degrees: 0 right, 90 down), `length` long, `width` half-wide at its end. */
export interface LightCone {
  x: number
  y: number
  angle: number
  length: number
  width: number
}

/** A round hole of light (a lamp, a lit window). */
export interface LightHole {
  x: number
  y: number
  radius: number
}

export interface DarknessOptions {
  /** How dark, 0 (none) … 1 (full) */
  amount: number
  /** Torch beams cut out of the dark */
  cones?: LightCone[]
  /** Round holes cut out of the dark */
  holes?: LightHole[]
  /** The area to darken (default a very large box: the whole canvas at any camera) */
  bounds?: NoirBox
  /** The dark's colour (default near-black blue) */
  color?: string
  /** Opacity of the dark at `amount` 1 (default 0.9) */
  opacity?: number
  /** A faint tint inside each beam (default a warm white at 0.08; `null` for none) */
  beam?: string | null
  beamOpacity?: number
}

/** The three corners of a cone (apex first), in scene px. */
export function coneCorners(cone: LightCone): Array<{ x: number; y: number }> {
  const a = (cone.angle * Math.PI) / 180
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  const end = { x: cone.x + dx * cone.length, y: cone.y + dy * cone.length }
  return [
    { x: cone.x, y: cone.y },
    { x: end.x - dy * cone.width, y: end.y + dx * cone.width },
    { x: end.x + dy * cone.width, y: end.y - dx * cone.width },
  ]
}

/** A dark overlay with torch beams and round holes of light cut out of it. */
export function drawDarkness(ctx: CanvasRenderingContext2D, options: DarknessOptions): void {
  const k = clamp01(options.amount)
  if (k <= 0) return
  const box = options.bounds ?? { x: -1e5, y: -1e5, width: 2e5, height: 2e5 }
  const color = options.color ?? 'rgb(4,6,10)'
  const cones = (options.cones ?? []).map(coneCorners)
  const traceCone = (c: Array<{ x: number; y: number }>) => {
    ctx.moveTo(c[0].x, c[0].y)
    ctx.lineTo(c[1].x, c[1].y)
    ctx.lineTo(c[2].x, c[2].y)
    ctx.closePath()
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.width, box.height)
  for (const c of cones) traceCone(c)
  for (const h of options.holes ?? []) {
    ctx.moveTo(h.x + h.radius, h.y)
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2, true)
  }
  ctx.fillStyle = withAlpha(color, (options.opacity ?? 0.9) * k)
  ctx.fill('evenodd')
  // Inside each beam: a little of the dark (the beam is not daylight) and a faint warm tint.
  for (const c of cones) {
    ctx.beginPath()
    traceCone(c)
    ctx.fillStyle = withAlpha(color, 0.35 * k)
    ctx.fill()
    if (options.beam !== null) {
      ctx.fillStyle = withAlpha(options.beam ?? 'rgb(255,236,190)', (options.beamOpacity ?? 0.08) * k)
      ctx.fill()
    }
  }
  ctx.restore()
}

export interface GlowOptions {
  x: number
  y: number
  radius: number
  /** Light colour (default amber) */
  color?: string
  /** Opacity at the centre (default 0.5), falling to 0 at the radius */
  opacity?: number
}

/** A soft pool of light: a radial gradient from `color` to clear. */
export function drawGlow(ctx: CanvasRenderingContext2D, options: GlowOptions): void {
  const { x, y, radius } = options
  if (!(radius > 0)) return
  const color = options.color ?? 'rgb(245,185,66)'
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, withAlpha(color, options.opacity ?? 0.5))
  g.addColorStop(1, withAlpha(color, 0))
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius)
  ctx.restore()
}

export interface VignetteOptions {
  width: number
  height: number
  x?: number
  y?: number
  /** Where the darkening starts, as a fraction of the half-diagonal (default 0.38) */
  inner?: number
  /** Where it is full, as a fraction of the half-diagonal (default 1.05) */
  outer?: number
  /** Darkness at the corners (default 0.55) */
  opacity?: number
  color?: string
}

/** A vignette: the frame's edges fall into dark. */
export function drawVignette(ctx: CanvasRenderingContext2D, options: VignetteOptions): void {
  const x = options.x ?? 0
  const y = options.y ?? 0
  const cx = x + options.width / 2
  const cy = y + options.height / 2
  const half = Math.hypot(options.width, options.height) / 2
  const color = options.color ?? 'rgb(0,0,0)'
  const g = ctx.createRadialGradient(cx, cy, half * (options.inner ?? 0.38), cx, cy, half * (options.outer ?? 1.05))
  g.addColorStop(0, withAlpha(color, 0))
  g.addColorStop(1, withAlpha(color, options.opacity ?? 0.55))
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(x, y, options.width, options.height)
  ctx.restore()
}

/**
 * Lightning: how bright a flash is at `time` (0..1), from strikes at the
 * given times (ms); each flares instantly and fades over `decay` ms either side.
 * Fill the frame with a pale blue at about 0.25 × this.
 */
export function lightningFlash(time: number, strikes: number[], decay = 170): number {
  let flash = 0
  for (const s of strikes) flash = Math.max(flash, 1 - Math.abs(time - s) / Math.max(1, decay))
  return clamp01(flash)
}

/**
 * A failing bulb: how much darker the room is at `time` (0 or `strength`),
 * flickering in an irregular but repeatable rhythm.
 */
export function lightFlicker(time: number, strength = 0.18): number {
  const s = time / 1000
  return Math.sin(s * 40) * Math.sin(s * 13) > 0.3 ? strength : 0
}

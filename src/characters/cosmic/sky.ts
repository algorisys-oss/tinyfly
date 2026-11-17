import { clamp01, hash01, parseRgb, rgba } from './cosmic-utils'

/**
 * Backgrounds and depth for science-explainer scenes: a flat saturated
 * gradient sky per scene, twinkling dust in parallax layers, and big soft
 * out-of-focus discs (bokeh). Every function is a pure function of its
 * options and the time (ms), so frames draw the same in any order.
 */

/** Ready skies: a top and a bottom colour each. One per scene keeps cuts readable even without a hard cut. */
export const COSMIC_SKIES = {
  space: ['#0b1026', '#1e1650'],
  micro: ['#1a0b3d', '#3b1170'],
  magenta: ['#e040a0', '#7c2bd9'],
  cyan: ['#22d3ee', '#2563eb'],
  lime: ['#f7f59a', '#b9f27c'],
  sunset: ['#fb7185', '#f59e0b'],
  ocean: ['#0ea5e9', '#0b2e6b'],
} as const satisfies Record<string, readonly [string, string]>

export type CosmicSky = keyof typeof COSMIC_SKIES

export interface SkyOptions {
  width: number
  height: number
  /** A ready sky (see COSMIC_SKIES), or give `top` and `bottom` */
  sky?: CosmicSky
  top?: string
  bottom?: string
}

/** A vertical gradient filling the frame. */
export function drawSkyGradient(ctx: CanvasRenderingContext2D, options: SkyOptions): void {
  const preset = options.sky ? COSMIC_SKIES[options.sky] : undefined
  if (options.sky && !preset) {
    throw new Error(`drawSkyGradient: unknown sky "${options.sky}" (one of ${Object.keys(COSMIC_SKIES).join(', ')})`)
  }
  const top = options.top ?? preset?.[0] ?? COSMIC_SKIES.space[0]
  const bottom = options.bottom ?? preset?.[1] ?? COSMIC_SKIES.space[1]
  const gradient = ctx.createLinearGradient(0, 0, 0, options.height)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, options.width, options.height)
  ctx.restore()
}

export interface DustOptions {
  width: number
  height: number
  /** How many specks (default 70) */
  count?: number
  /** Speck colour (default white) */
  color?: string
  /** Peak opacity of the nearest layer (default 0.7) */
  opacity?: number
  /** Speck radius of the nearest layer, px (default 3) */
  size?: number
  /** Drift, px per second for the nearest layer (default { x: 0, y: -14 }: rising) */
  drift?: { x: number; y: number }
  /** Camera offset, px: far layers move less (parallax) */
  offset?: { x: number; y: number }
  /** Seed for where the specks sit (default 1) */
  seed?: number
}

/** Twinkling specks in three parallax depths, wrapping round the frame. */
export function drawDust(ctx: CanvasRenderingContext2D, time: number, options: DustOptions): void {
  const { width, height } = options
  const count = Math.max(0, Math.round(options.count ?? 70))
  if (count === 0 || width <= 0 || height <= 0) return
  const [r, g, b] = parseRgb(options.color ?? '#ffffff')
  const opacity = options.opacity ?? 0.7
  const size = options.size ?? 3
  const drift = options.drift ?? { x: 0, y: -14 }
  const offset = options.offset ?? { x: 0, y: 0 }
  const seed = options.seed ?? 1
  const seconds = time / 1000
  ctx.save()
  for (let i = 0; i < count; i++) {
    const depth = [0.35, 0.65, 1][i % 3]
    const x = wrap(hash01(i, seed) * width + (drift.x * seconds + offset.x) * depth, width)
    const y = wrap(hash01(i, seed + 1) * height + (drift.y * seconds + offset.y) * depth, height)
    const twinkle = 0.5 + 0.5 * Math.sin(seconds * (1.1 + 2.3 * hash01(i, seed + 2)) + i)
    ctx.fillStyle = rgba([r, g, b], opacity * (0.25 + 0.75 * twinkle) * depth)
    ctx.beginPath()
    ctx.arc(x, y, size * (0.5 + depth), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export interface BokehOptions {
  width: number
  height: number
  /** How many discs (default 7) */
  count?: number
  /** Disc colour (default white) */
  color?: string
  /** Disc opacity (default 0.1) */
  opacity?: number
  /** Radius range, px (default 60..190) */
  minRadius?: number
  maxRadius?: number
  /** Sideways drift, px per second (default 8) */
  drift?: number
  /** Camera offset, px: bokeh is near the lens, so it moves 1.6 times as far */
  offset?: { x: number; y: number }
  seed?: number
}

/** Big soft out-of-focus discs drifting across the frame (foreground depth). */
export function drawBokeh(ctx: CanvasRenderingContext2D, time: number, options: BokehOptions): void {
  const { width, height } = options
  const count = Math.max(0, Math.round(options.count ?? 7))
  if (count === 0 || width <= 0 || height <= 0) return
  const [r, g, b] = parseRgb(options.color ?? '#ffffff')
  const opacity = options.opacity ?? 0.1
  const minR = options.minRadius ?? 60
  const maxR = Math.max(minR, options.maxRadius ?? 190)
  const drift = options.drift ?? 8
  const offset = options.offset ?? { x: 0, y: 0 }
  const seed = options.seed ?? 3
  const seconds = time / 1000
  ctx.save()
  for (let i = 0; i < count; i++) {
    const radius = minR + (maxR - minR) * hash01(i, seed + 5)
    const span = width + radius * 2
    const x = wrap(hash01(i, seed) * span + drift * seconds * (0.5 + hash01(i, seed + 7)) + offset.x * 1.6, span) - radius
    const y = hash01(i, seed + 1) * height + 20 * Math.sin(seconds * 0.4 + i) + offset.y * 1.6
    ctx.fillStyle = rgba([r, g, b], opacity * (0.6 + 0.4 * hash01(i, seed + 9)))
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

const wrap = (v: number, span: number): number => ((v % span) + span) % span

/** Twinkle brightness 0..1 of speck `i` at `time` (the same curve drawDust uses), for syncing a glint to it. */
export function dustTwinkle(time: number, i: number, seed = 1): number {
  return clamp01(0.5 + 0.5 * Math.sin((time / 1000) * (1.1 + 2.3 * hash01(i, seed + 2)) + i))
}

import { clamp01, hash01, parseRgb, rgba, shade } from './cosmic-utils'

/**
 * Flat-shaded shapes for science explainers: a sphere with a shadow
 * crescent and a highlight, an isometric cube, and a probability haze (an
 * electron cloud of flickering dots). No outlines: the look is fills only.
 */

export interface BallOptions {
  x: number
  y: number
  radius: number
  color: string
  /** Where the light comes from, -1..1 each way (default { x: -0.35, y: -0.45 }: top left) */
  light?: { x: number; y: number }
  /** Strength of the shadow crescent, 0..1 (default 0.28) */
  shadow?: number
  /** Draw the small highlight (default true) */
  highlight?: boolean
  opacity?: number
}

/** A flat sphere: the base fill, a darker crescent away from the light, a small highlight. */
export function drawShadedBall(ctx: CanvasRenderingContext2D, options: BallOptions): void {
  const { x, y, radius: r, color } = options
  if (!(r > 0.3)) return
  const light = options.light ?? { x: -0.35, y: -0.45 }
  const shadow = clamp01(options.shadow ?? 0.28)
  const opacity = clamp01(options.opacity ?? 1)
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = shade(color, 0, opacity)
  ctx.fill()
  if (shadow > 0) {
    ctx.clip()
    // the crescent: the disc minus a copy shifted toward the light
    ctx.beginPath()
    ctx.rect(x - 2 * r, y - 2 * r, 4 * r, 4 * r)
    ctx.arc(x + light.x * r * 0.45, y + light.y * r * 0.45, r * 1.02, 0, Math.PI * 2, true)
    ctx.fillStyle = shade(color, -0.35, (opacity * shadow) / 0.28)
    ctx.fill('evenodd')
  }
  ctx.restore()
  if ((options.highlight ?? true) && r > 4) {
    ctx.save()
    ctx.translate(x + light.x * r * 0.5, y + light.y * r * 0.5)
    ctx.scale(1, 0.7)
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.55 * opacity})`
    ctx.fill()
    ctx.restore()
  }
}

export interface CubeOptions {
  /** Centre of the cube */
  x: number
  y: number
  /** Edge length, px */
  size: number
  color: string
  opacity?: number
  /** A sparkle on the top face, 0..1 (default 0) */
  sheen?: number
}

/** The three visible faces of a cube in isometric view, as polygons (top, left, right). */
export function isoCubeFaces(options: Pick<CubeOptions, 'x' | 'y' | 'size'>): { top: [number, number][]; left: [number, number][]; right: [number, number][] } {
  const { x, y, size: s } = options
  const dx = ((s * Math.sqrt(3)) / 2) * 0.6
  const dy = (s / 2) * 0.6
  const ty = y - s * 0.55
  const top: [number, number][] = [[x, ty - dy], [x + dx, ty], [x, ty + dy], [x - dx, ty]]
  const h = s * 1.1
  const left: [number, number][] = [top[3], top[2], [top[2][0], top[2][1] + h], [top[3][0], top[3][1] + h]]
  const right: [number, number][] = [top[2], top[1], [top[1][0], top[1][1] + h], [top[2][0], top[2][1] + h]]
  return { top, left, right }
}

/** An isometric cube: lit top, a mid left face, a dark right face. */
export function drawIsoCube(ctx: CanvasRenderingContext2D, options: CubeOptions): void {
  if (!(options.size > 0)) return
  const opacity = clamp01(options.opacity ?? 1)
  const faces = isoCubeFaces(options)
  ctx.save()
  for (const [points, k] of [[faces.left, -0.12], [faces.right, -0.3], [faces.top, 0]] as const) {
    ctx.beginPath()
    points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)))
    ctx.closePath()
    ctx.fillStyle = shade(options.color, k, opacity)
    ctx.fill()
  }
  const sheen = clamp01(options.sheen ?? 0)
  if (sheen > 0) {
    const [tx, ty] = faces.top[0]
    const g = ctx.createRadialGradient(tx, ty + options.size * 0.2, 0, tx, ty + options.size * 0.2, options.size * 0.5)
    g.addColorStop(0, `rgba(255,255,255,${0.5 * sheen})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(tx, ty + options.size * 0.2, options.size * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export interface HazeOptions {
  x: number
  y: number
  /** Radius of the densest ring, px */
  radius: number
  color?: string
  /** How many dots (default 420) */
  dots?: number
  /** Dot radius, px (default 2.6) */
  dot?: number
  opacity?: number
  /** Vertical squash for a cloud seen at an angle (default 1) */
  squash?: number
  /** Slow rotation, radians per second (default 0.15) */
  spin?: number
  seed?: number
}

/** A probability cloud: flickering dots, densest on a ring (an electron shell); fixed per seed. */
export function drawHaze(ctx: CanvasRenderingContext2D, time: number, options: HazeOptions): void {
  const dots = Math.max(0, Math.round(options.dots ?? 420))
  if (dots === 0 || !(options.radius > 0)) return
  const [r, g, b] = parseRgb(options.color ?? '#38bdf8')
  const opacity = options.opacity ?? 0.55
  const dot = options.dot ?? 2.6
  const squash = options.squash ?? 1
  const seed = options.seed ?? 7
  const seconds = time / 1000
  ctx.save()
  for (let i = 0; i < dots; i++) {
    const angle = hash01(i, seed) * Math.PI * 2 + seconds * (options.spin ?? 0.15)
    const spread = Math.tan((hash01(i, seed + 3) - 0.5) * 2.2) * 0.35
    const rr = options.radius * (0.75 + 0.32 * spread)
    if (rr <= 0) continue
    const flicker = 0.5 + 0.5 * Math.sin(seconds * 7 + i * 1.7)
    ctx.fillStyle = rgba([r, g, b], opacity * (0.3 + 0.7 * flicker))
    ctx.beginPath()
    ctx.arc(options.x + rr * Math.cos(angle), options.y + rr * Math.sin(angle) * squash, dot, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

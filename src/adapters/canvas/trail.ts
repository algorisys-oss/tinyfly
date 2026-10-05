import { ribbon, ribbonHeadCap, type TrailSample } from '../../engine/path/trail'
import { canvasLike } from './offscreen'

/**
 * Light trails and comets on a 2D canvas: a band along a trail's samples,
 * narrowing and fading toward the tail.
 *
 * The band is one strip of quads that share their corners, filled additively
 * on a layer of their own, so it reads as one smooth stroke at any speed: no
 * beads where segments overlap and no hairline seams between them.
 */

export interface TrailStyle {
  color: string
  /** Width at the head, px (default 6) */
  width?: number
  /** How much it narrows toward the tail, 0..1 (default 1: to a point) */
  taper?: number
  /** How much it fades toward the tail, 0..1 (default 1: to nothing) */
  fade?: number
  /** Opacity at the head (default 1) */
  opacity?: number
  /**
   * `normal` (default) paints it over what is there; `add` adds its light
   * (`'lighter'`): trails glow where they cross, as light does on dark.
   */
  blend?: 'normal' | 'add'
  /** A glowing head (a comet): a soft dot this many px across its radius */
  head?: { radius: number; color?: string }
}

type Point = { x: number; y: number }

/**
 * Draw a trail from `trailSamples` (oldest first). Fewer than two samples draw
 * only the head.
 *
 * ```ts
 * drawTrail(ctx, trailSamples(cometAt, time, { length: 500 }), { color: '#00e5ff', width: 8, blend: 'add' })
 * ```
 */
export function drawTrail(ctx: CanvasRenderingContext2D, samples: ReadonlyArray<TrailSample<Point>>, style: TrailStyle): void {
  const width = style.width ?? 6
  const taper = style.taper ?? 1
  const fade = style.fade ?? 1
  const opacity = style.opacity ?? 1
  const additive = style.blend === 'add'

  ctx.save()
  if (samples.length >= 2) {
    const quads = trailQuads(samples, width, taper, fade, opacity)
    if (additive) {
      ctx.globalCompositeOperation = 'lighter'
      fillQuads(ctx, quads, style.color)
    } else {
      drawOnLayer(ctx, quads, style.color)
    }
  }
  const head = samples[samples.length - 1]
  if (style.head && head && style.head.radius > 0) {
    if (additive) ctx.globalCompositeOperation = 'lighter'
    const color = style.head.color ?? style.color
    const glow = ctx.createRadialGradient(head.at.x, head.at.y, 0, head.at.x, head.at.y, style.head.radius)
    glow.addColorStop(0, color)
    glow.addColorStop(0.35, color)
    glow.addColorStop(1, clearOf(ctx, color))
    ctx.globalAlpha = opacity
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(head.at.x, head.at.y, style.head.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** `color` with no opacity, so a gradient fades in its own hue rather than through grey. */
function clearOf(ctx: CanvasRenderingContext2D, color: string): string {
  // The canvas normalises any CSS colour to '#rrggbb' or 'rgba(r, g, b, a)'.
  ctx.fillStyle = color
  const normal = String(ctx.fillStyle)
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(normal)
  if (hex) return `rgba(${parseInt(hex[1], 16)}, ${parseInt(hex[2], 16)}, ${parseInt(hex[3], 16)}, 0)`
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(normal)
  return rgb ? `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0)` : 'rgba(0, 0, 0, 0)'
}

interface Quad {
  corners: [Point, Point, Point, Point]
  alpha: number
  /** The head's round end, on the last quad */
  cap?: { x: number; y: number; radius: number; start: number }
}

/** The band's quads, tail to head, each with the opacity at its middle. */
export function trailQuads(samples: ReadonlyArray<TrailSample<Point>>, width: number, taper: number, fade: number, opacity: number): Quad[] {
  const points = samples.map((s) => ({ x: s.at.x, y: s.at.y, width: width * (1 - taper * s.age) }))
  const edges = ribbon(points)
  const cap = ribbonHeadCap(points) ?? undefined
  const quads: Quad[] = []
  for (let i = 0; i + 1 < samples.length; i++) {
    const age = (samples[i].age + samples[i + 1].age) / 2
    const alpha = opacity * (1 - fade * age)
    if (alpha <= 0) continue
    const last = i + 2 === samples.length
    quads.push({ corners: [edges.left[i], edges.left[i + 1], edges.right[i + 1], edges.right[i]], alpha, ...(last && cap && { cap }) })
  }
  return quads
}

function fillQuads(ctx: CanvasRenderingContext2D, quads: Quad[], color: string): void {
  ctx.fillStyle = color
  for (const quad of quads) {
    const [a, b, c, d] = quad.corners
    ctx.globalAlpha = Math.min(1, quad.alpha)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    if (quad.cap) ctx.arc(quad.cap.x, quad.cap.y, quad.cap.radius, quad.cap.start, quad.cap.start - Math.PI, true)
    ctx.lineTo(c.x, c.y)
    ctx.lineTo(d.x, d.y)
    ctx.closePath()
    ctx.fill()
  }
}

/**
 * Painted over what is there, but built additively on a layer of its own:
 * neighbouring quads' anti-aliased edges then add up to full coverage, so
 * no seams show. The layer covers just the band, in device pixels.
 */
function drawOnLayer(ctx: CanvasRenderingContext2D, quads: Quad[], color: string): void {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null
  const toDevice = (p: Point): Point => (m ? { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f } : p)
  // A cap's radius scales with the transform (uniform scale assumed for the round end).
  const radiusScale = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1
  const device = quads.map((q) => ({
    ...q,
    corners: q.corners.map(toDevice) as Quad['corners'],
    ...(q.cap && { cap: { ...q.cap, ...toDevice(q.cap), radius: q.cap.radius * radiusScale, start: q.cap.start + (m ? Math.atan2(m.b, m.a) : 0) } }),
  }))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const q of device) {
    const extent = q.cap ? [{ x: q.cap.x - q.cap.radius, y: q.cap.y - q.cap.radius }, { x: q.cap.x + q.cap.radius, y: q.cap.y + q.cap.radius }] : []
    for (const p of [...q.corners, ...extent]) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
  }
  if (!(maxX > minX && maxY > minY)) return
  const x0 = Math.floor(minX) - 1
  const y0 = Math.floor(minY) - 1
  const layer = m ? canvasLike(ctx, Math.ceil(maxX) + 1 - x0, Math.ceil(maxY) + 1 - y0) : null
  const layerCtx = layer?.getContext('2d') as CanvasRenderingContext2D | null | undefined
  if (!layer || !layerCtx) {
    // No layer to be had: fill in place (seams may show faintly).
    fillQuads(ctx, quads, color)
    return
  }
  layerCtx.translate(-x0, -y0)
  layerCtx.globalCompositeOperation = 'lighter'
  fillQuads(layerCtx, device, color)
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.drawImage(layer as unknown as CanvasImageSource, x0, y0)
  ctx.restore()
}

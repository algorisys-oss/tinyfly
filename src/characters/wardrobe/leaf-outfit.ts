import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints, CharacterLayers } from '../character'
import { convexHull } from '../head/head-shape'
import type { Pen } from '../look/pen'
import type { OrganicSample } from '../body/organic-geometry'

/** Plain garment data; the leaf cloth follows the native torso and thighs. */
export interface LeafOutfitOptions {
  top?: boolean
  color?: string
  accent?: string
  /** Hip-to-ankle fraction, 0.2..0.45 (default 0.32, above the knee). */
  length?: number
}
export interface LeafOutfitContours { top?: Point[]; skirt: Point[] }

function resolveLeafOutfitOptions(options: LeafOutfitOptions): Required<LeafOutfitOptions> {
  const top = options.top ?? true, length = options.length ?? .32
  const color = options.color ?? '#638c39', accent = options.accent ?? '#87ae4e'
  if (typeof top !== 'boolean') throw new Error('leafOutfit: top must be a boolean')
  if (!Number.isFinite(length) || length < .2 || length > .45) throw new Error('leafOutfit: length must be 0.2..0.45')
  if (typeof color !== 'string' || typeof accent !== 'string') throw new Error('leafOutfit: color and accent must be strings')
  return { top, length, color, accent }
}

function roundedHull(points: Point[], padding: number): Point[] {
  const expanded = points.flatMap(p => Array.from({ length: 8 }, (_, i) => ({
    x: p.x + Math.cos(i * Math.PI / 4) * padding, y: p.y + Math.sin(i * Math.PI / 4) * padding,
  })))
  let hull = convexHull(expanded)
  for (let pass = 0; pass < 2; pass++) hull = hull.flatMap((a, i) => {
    const b = hull[(i + 1) % hull.length]
    return [{ x: a.x * .75 + b.x * .25, y: a.y * .75 + b.y * .25 }, { x: a.x * .25 + b.x * .75, y: a.y * .25 + b.y * .75 }]
  })
  return hull
}

const edges = (samples: OrganicSample[]) => samples.flatMap(sample => [sample.left, sample.right])

/** Coverage geometry is available to headless renderers and pixel checks. */
export function leafOutfitContours(j: CharacterJoints, options: LeafOutfitOptions = {}): LeafOutfitContours {
  const { top, length } = resolveLeafOutfitOptions(options)
  const body = j.bodyContours
  if (!body?.spine) throw new Error('leafOutfit requires organic body contours')
  const waist = body.spine.samples.filter(s => s.at <= .3)
  const thighs = ['left', 'right'].flatMap(side => body[`leg.${side}`]?.samples.filter(s => s.at <= length) ?? [])
  return {
    ...(top ? { top: roundedHull(edges(body.spine.samples.filter(s => s.at >= .52 && s.at <= .91)), j.height * .01) } : {}),
    skirt: roundedHull(edges([...waist, ...thighs]), j.height * .012),
  }
}

function path(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.closePath()
}

/** A pair of cubic sides gives each overlapping leaf a rounded, flowing tip. */
function leaf(a: Point, b: Point, width: number): Point[] {
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1
  const nx = -dy / length, ny = dx / length
  const points: Point[] = []
  for (const side of [1, -1]) for (let i = 0; i <= 16; i++) {
    const t = side === 1 ? i / 16 : 1 - i / 16, u = 1 - t
    const bulge = 3 * u * t * width * side
    points.push({ x: a.x + dx * t + nx * bulge, y: a.y + dy * t + ny * bulge })
  }
  return points
}

function garment(ctx: CanvasRenderingContext2D, j: CharacterJoints, pen: Pen, outline: Point[], color: string, accent: string): void {
  const edge = j.lineWidth * .7
  pen.shape(outline, color, edge)
  if (pen.look === 'silhouette') return
  ctx.save(); path(ctx, outline); ctx.clip()
  const minX = Math.min(...outline.map(p => p.x)), maxX = Math.max(...outline.map(p => p.x))
  const minY = Math.min(...outline.map(p => p.y)), maxY = Math.max(...outline.map(p => p.y))
  const width = maxX - minX, height = maxY - minY
  for (let row = 0; row < 2; row++) for (let column = 0; column < 5; column++) {
    const a = { x: minX + width * (column / 4 + (row ? .07 : -.04)), y: minY + height * (row ? .38 : -.1) }
    const b = { x: a.x + width * .09, y: a.y + height * .78 }
    pen.shape(leaf(a, b, width * .13), (column + row) % 2 ? color : accent, edge * .6)
    pen.line([a, { x: a.x * .45 + b.x * .55, y: a.y * .45 + b.y * .55 }, b], edge * .45)
    for (const t of [.32, .52, .7]) {
      const center = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      pen.line([{ x: center.x - width * .045, y: center.y - height * .065 }, center, { x: center.x + width * .045, y: center.y - height * .05 }], edge * .3)
    }
  }
  ctx.restore()
}

/** At the body's own part depths: foreground hands can cross the garments. */
export function leafOutfit(options: LeafOutfitOptions = {}): CharacterLayers {
  const resolved = resolveLeafOutfitOptions(options)
  const { color, accent } = resolved
  const over = (id: string) => (ctx: CanvasRenderingContext2D, j: CharacterJoints, pen: Pen) => {
    const contours = leafOutfitContours(j, resolved)
    if (id === 'spine' && contours.top) garment(ctx, j, pen, contours.top, color, accent)
    const last = ['spine', 'leg.left', 'leg.right'].reduce((a, b) => j.parts[a].order > j.parts[b].order ? a : b)
    if (id === last) garment(ctx, j, pen, contours.skirt, color, accent)
  }
  return { parts: { spine: { over: over('spine') }, 'leg.left': { over: over('leg.left') }, 'leg.right': { over: over('leg.right') } } }
}

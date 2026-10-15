import type { Point } from '../../adapters/canvas/sketch'
import { illustrationTones } from './illustration-color'
import { ellipsePoints, type Pen } from './pen'
import { taperedLine } from './tapered-line'

/**
 * The `illustrated` look: a clean pen drawn the way an illustrator inks and
 * paints, from the same shapes every other look draws.
 *
 * - Ink has weight: an outline thickens on the side turned from the light and
 *   thins on the lit side, and open strokes (brows, mouths, folds, strands)
 *   taper at their ends like a brush.
 * - Filled shapes are painted with form: a soft shadow band and a narrower
 *   core shadow on the side away from the light, and a highlight on the lit
 *   side, in tones mixed from the fill itself (see illustrationTones).
 *
 * Deterministic: everything follows from the points, the fill and the light.
 */
export interface IllustratedOptions {
  /** Toward the light, screen space (default [-0.8, -0.6]: from the upper left) */
  light?: [number, number]
  /** How much ink thickens on the shadow side and thins on the lit side, 0..1 (default 0.6) */
  weight?: number
  /** How much open strokes taper toward their ends, 0..1 (default 0.7) */
  taper?: number
  /** Strength of the shadow and core-shadow bands, 0..1 (default 1) */
  shadow?: number
  /** Strength of the lit-side highlight, 0..1 (default 0.6) */
  highlight?: number
}

export interface ResolvedIllustration {
  light: [number, number]
  weight: number
  taper: number
  shadow: number
  highlight: number
}

const unit = (v: number, name: string) => {
  if (!Number.isFinite(v) || v < 0 || v > 1) throw new Error(`illustrated: ${name} must be 0..1`)
  return v
}

/** Every option filled in and checked; `light` defaults to the given one (a body's skin light). */
export function resolveIllustration(options: IllustratedOptions = {}, light: [number, number] = [-0.8, -0.6]): ResolvedIllustration {
  const toward = options.light ?? light
  if (toward.length !== 2 || !toward.every(Number.isFinite) || Math.hypot(...toward) === 0) {
    throw new Error('illustrated: light must be a finite nonzero 2D vector')
  }
  const length = Math.hypot(...toward)
  return {
    light: [toward[0] / length, toward[1] / length],
    weight: unit(options.weight ?? 0.6, 'weight'),
    taper: unit(options.taper ?? 0.7, 'taper'),
    shadow: unit(options.shadow ?? 1, 'shadow'),
    highlight: unit(options.highlight ?? 0.6, 'highlight'),
  }
}

/** Nested steps per painted tone: enough that no single step edge shows. */
const GRADE_STEPS = 6

const smoothstep =(edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Extra points so no segment is longer than `step` px: tapers and weights need somewhere to change. */
function densify(points: Point[], step: number, closed: boolean): Point[] {
  const out: Point[] = []
  const n = points.length
  const segments = closed ? n : n - 1
  for (let i = 0; i < segments; i++) {
    const a = points[i], b = points[(i + 1) % n]
    const pieces = Math.min(24, Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step)))
    for (let k = 0; k < pieces; k++) out.push({ x: a.x + ((b.x - a.x) * k) / pieces, y: a.y + ((b.y - a.y) * k) / pieces })
  }
  if (!closed) out.push(points[n - 1])
  return out
}

/** Unit normals to the right of the direction of travel, smoothed over two neighbours each way. */
function rightNormals(points: Point[], closed: boolean): Point[] {
  const n = points.length
  const at = (i: number) => points[closed ? ((i % n) + n) % n : Math.min(n - 1, Math.max(0, i))]
  return points.map((_, i) => {
    const a = at(i - 2), b = at(i + 2)
    const dx = b.x - a.x, dy = b.y - a.y
    const length = Math.hypot(dx, dy) || 1
    return { x: -dy / length, y: dx / length }
  })
}

/** +1 when the right-hand normals of a closed shape point out of it, −1 when they point in. */
function outwardSign(points: Point[], normals: Point[]): 1 | -1 {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length
  const out = points.reduce((sum, p, i) => sum + normals[i].x * (p.x - cx) + normals[i].y * (p.y - cy), 0)
  return out >= 0 ? 1 : -1
}

/** A closed shape's average thickness: its area over half its perimeter (a limb's width, a disc's radius). */
function thicknessOf(points: Point[]): number {
  let area = 0, perimeter = 0
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]
    area += p.x * q.y - q.x * p.y
    perimeter += Math.hypot(q.x - p.x, q.y - p.y)
  })
  return perimeter > 0 ? Math.abs(area) / perimeter : 0
}

function trace(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.closePath()
}

export function createIllustratedPen(ctx: CanvasRenderingContext2D, ink: string, lineWidth: number, style: ResolvedIllustration): Pen {
  const [lx, ly] = style.light
  /** Ink weight for an edge whose outward normal is `n`: heavier facing away from the light. */
  const weightFor = (n: Point) => {
    const facing = n.x * lx + n.y * ly
    return 1 - style.weight * facing * (facing > 0 ? 0.55 : 1)
  }

  /** A filled ribbon of ink along `points`, `widths[i]` wide at each point. */
  const ribbon = (points: Point[], normals: Point[], widths: number[], closed: boolean) => {
    const left = points.map((p, i) => ({ x: p.x + normals[i].x * widths[i] / 2, y: p.y + normals[i].y * widths[i] / 2 }))
    const right = points.map((p, i) => ({ x: p.x - normals[i].x * widths[i] / 2, y: p.y - normals[i].y * widths[i] / 2 }))
    ctx.fillStyle = ink
    if (closed) {
      // Outer and inner edges as one even-odd path: a ring of ink.
      ctx.beginPath()
      left.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.closePath()
      right.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.closePath()
      ctx.fill('evenodd')
      return
    }
    trace(ctx, [...left, ...right.reverse()])
    ctx.fill()
    for (const i of [0, points.length - 1]) {
      ctx.beginPath()
      ctx.arc(points[i].x, points[i].y, widths[i] / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /** Paint form into a filled shape: soft shadow, core shadow and highlight, clipped to it. */
  const paintForm = (points: Point[], fill: string) => {
    const tones = illustrationTones(fill)
    const thickness = thicknessOf(points)
    if (!tones || thickness < lineWidth * 1.5) return
    const dense = densify(points, Math.max(2, thickness * 0.25), true)
    const normals = rightNormals(dense, true)
    const sign = outwardSign(dense, normals)
    const outward = normals.map(n => ({ x: n.x * sign, y: n.y * sign }))
    const facing = outward.map(n => n.x * lx + n.y * ly)
    const base = ctx.globalAlpha
    const band = (from: (f: number) => number, to: (f: number) => number, color: string, alpha: number) => {
      if (alpha <= 0) return
      const outer = dense.map((p, i) => ({ x: p.x - outward[i].x * from(facing[i]), y: p.y - outward[i].y * from(facing[i]) }))
      const inner = dense.map((p, i) => ({ x: p.x - outward[i].x * to(facing[i]), y: p.y - outward[i].y * to(facing[i]) }))
      trace(ctx, [...outer, ...inner.reverse()])
      ctx.globalAlpha = base * alpha
      ctx.fillStyle = color
      ctx.fill()
    }
    ctx.save()
    trace(ctx, points)
    ctx.clip()
    // Each tone is a stack of thin, nested steps: the overlaps build a gradient
    // toward the edge, so the terminator reads soft instead of as a stripe.
    const graded = (depth: (f: number) => number, color: string, alpha: number, inset = () => -lineWidth) => {
      for (let k = 1; k <= GRADE_STEPS; k++) {
        const reach = k / GRADE_STEPS
        band(inset, f => inset() + (depth(f) - inset()) * reach, color, alpha / GRADE_STEPS)
      }
    }
    graded(f => thickness * 0.5 * smoothstep(-0.15, 0.7, -f), tones.shadow, style.shadow * 0.85)
    graded(f => thickness * 0.18 * smoothstep(0.3, 0.95, -f), tones.core, style.shadow * 0.6)
    // The highlight sits just inside the lit edge, brightest toward that edge.
    graded(f => thickness * (0.07 + 0.2 * smoothstep(0.35, 0.95, f)), tones.highlight, style.highlight * 0.7, () => thickness * 0.07)
    ctx.restore()
  }

  /** An outline around a closed shape, weighted by the light. */
  const contour = (points: Point[], width: number) => {
    const dense = densify(points, Math.max(1.5, width * 1.5), true)
    const normals = rightNormals(dense, true)
    const sign = outwardSign(dense, normals)
    ribbon(dense, normals, normals.map(n => width * weightFor({ x: n.x * sign, y: n.y * sign })), true)
  }

  const pen: Pen = {
    look: 'illustrated',
    ink,
    limb(points, from, to) {
      ctx.fillStyle = ink
      taperedLine(ctx, points, from, to)
    },
    line(points, width, outside) {
      if (points.length < 2 || width <= 0) return
      const dense = densify(points, Math.max(1.5, width * 1.5), false)
      const normals = rightNormals(dense, false)
      const n = dense.length
      const widths = dense.map((_, i) => {
        // A brush lifts at both ends: thinner there, full in the middle.
        const t = i / (n - 1)
        const press = 1 - style.taper * 0.6 * (1 - Math.sqrt(Math.sin(Math.PI * t)))
        const light = outside ? weightFor({ x: normals[i].x * outside, y: normals[i].y * outside }) : 1
        return width * press * light
      })
      ribbon(dense, normals, widths, false)
    },
    shape(points, fill, outline, flat) {
      if (points.length < 3) return
      trace(ctx, points)
      if (fill !== null) {
        ctx.fillStyle = fill
        ctx.fill()
        if (!flat) paintForm(points, fill)
      }
      if (outline > 0) contour(points, outline)
    },
    ellipse(cx, cy, rx, ry, angle, fill, outline) {
      pen.shape(ellipsePoints(cx, cy, rx, ry, angle, 0, 1, 48).slice(0, -1), fill, outline)
    },
    dot(x, y, r) {
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    },
    guide() {},
    guideEllipse() {},
  }
  return pen
}

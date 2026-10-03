import { createRandom, hashSeed, type RandomSource } from '../../engine/authoring/random'
import { boilFrame, type Point } from '../../adapters/canvas/sketch'
import { taperedLine } from './tapered-line'

/**
 * The pen every part of a character is drawn with: its body, face, hair,
 * clothes and props. A look is a pen, so whatever draws through it (the
 * figure, or a costume hook) matches the look.
 *
 * - `clean`: filled tapered strokes and plain canvas lines.
 * - `pencil`: Pencilmation. Graphite strokes in passes, a wobble that boils a
 *   few times a second, pressure that thins and thickens along each stroke,
 *   faint construction guides, and the odd rubbed-out earlier attempt.
 * - `silhouette`: everything filled solid in the ink, for a readability check.
 *
 * Deterministic: the pencil's wobble and pressure are seeded by the seed, the
 * boil frame and the stroke's place in the drawing order, never Math.random.
 */

export type Look = 'clean' | 'pencil' | 'silhouette'

export interface PencilOptions {
  /** Largest wobble, px (default: 12% of the line width, at least 1) */
  roughness?: number
  /** Redraws per second; 0 holds still (default 8) */
  boil?: number
  /** Strokes per line (default 2) */
  passes?: number
  /** How much pressure varies along a stroke, 0..1 (default 0.25) */
  pressure?: number
  /** Draw faint construction guides under the figure (default true) */
  construction?: boolean
  /** Share of strokes with a rubbed-out earlier attempt beside them, 0..1 (default 0.15) */
  rubbedOut?: number
}

export interface Pen {
  readonly look: Look
  readonly ink: string
  /** A stroke through `points` whose width runs from `from` to `to` px */
  limb(points: Point[], from: number, to: number): void
  /** An even stroke */
  line(points: Point[], width: number): void
  /** A closed shape: filled with `fill` (none when null) and outlined (not when `outline` is 0) */
  shape(points: Point[], fill: string | null, outline: number): void
  /** An ellipse: filled with `fill` (none when null) and outlined */
  ellipse(cx: number, cy: number, rx: number, ry: number, angle: number, fill: string | null, outline: number): void
  /** A filled dot in the ink */
  dot(x: number, y: number, r: number): void
  /** A faint construction line (pencil only) */
  guide(points: Point[]): void
  /** A faint construction ellipse (pencil only) */
  guideEllipse(cx: number, cy: number, rx: number, ry: number, angle: number): void
}

export interface PenOptions {
  look: Look
  ink: string
  lineWidth: number
  seed: number
  time: number
  pencil?: PencilOptions
}

/** Points around an ellipse, from `start` radians, `turns` of a full turn. */
export function ellipsePoints(cx: number, cy: number, rx: number, ry: number, angle: number, start = 0, turns = 1, samples = 40): Point[] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return Array.from({ length: samples + 1 }, (_, i) => {
    const a = start + (Math.PI * 2 * turns * i) / samples
    const x = Math.cos(a) * rx
    const y = Math.sin(a) * ry
    return { x: cx + x * cos - y * sin, y: cy + x * sin + y * cos }
  })
}

export function createPen(ctx: CanvasRenderingContext2D, options: PenOptions): Pen {
  if (options.look === 'pencil') return pencilPen(ctx, options)
  return cleanPen(ctx, options.ink, options.look)
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[], close = false) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
  if (close) ctx.closePath()
}

function cleanPen(ctx: CanvasRenderingContext2D, ink: string, look: 'clean' | 'silhouette'): Pen {
  const solid = look === 'silhouette'
  // A silhouette fattens lines a little, so thin parts still read as shape.
  const weight = solid ? 1.25 : 1
  return {
    look,
    ink,
    limb(points, from, to) {
      ctx.fillStyle = ink
      taperedLine(ctx, points, from * weight, to * weight)
    },
    line(points, width) {
      if (points.length < 2) return
      ctx.strokeStyle = ink
      ctx.lineWidth = width * weight
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      tracePath(ctx, points)
      ctx.stroke()
    },
    shape(points, fill, outline) {
      tracePath(ctx, points, true)
      if (fill !== null || solid) {
        ctx.fillStyle = solid ? ink : (fill as string)
        ctx.fill()
      }
      if (outline <= 0) return
      ctx.strokeStyle = ink
      ctx.lineWidth = outline * weight
      ctx.lineJoin = 'round'
      ctx.stroke()
    },
    ellipse(cx, cy, rx, ry, angle, fill, outline) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2)
      if (fill !== null || solid) {
        ctx.fillStyle = solid ? ink : (fill as string)
        ctx.fill()
      }
      if (outline <= 0) return
      ctx.strokeStyle = ink
      ctx.lineWidth = outline * weight
      ctx.stroke()
    },
    dot(x, y, r) {
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(x, y, r * weight, 0, Math.PI * 2)
      ctx.fill()
    },
    guide() {},
    guideEllipse() {},
  }
}

/** Points along a polyline every `step` px, keeping both ends. */
function resample(points: Point[], step: number): Point[] {
  const out: Point[] = [points[0]]
  let carried = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    let along = step - carried
    while (along < length) {
      const t = along / length
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      along += step
    }
    carried = length - (along - step)
  }
  const last = points[points.length - 1]
  const tail = out[out.length - 1]
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > step * 0.25) out.push(last)
  else out[out.length - 1] = last
  return out
}

/** A polyline moved sideways by `by(t)` px (t 0..1 along it), square to its direction. */
function offsetLine(points: Point[], by: (t: number) => number): Point[] {
  const n = points.length
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(n - 1, i + 1)]
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const d = by(n === 1 ? 0 : i / (n - 1))
    return { x: p.x - ((b.y - a.y) / length) * d, y: p.y + ((b.x - a.x) / length) * d }
  })
}

/** A smooth random wave over 0..1: a few sines with seeded phases. */
function wave(random: RandomSource): (t: number) => number {
  const parts = [0.6, 1.4, 2.9].map((frequency) => ({
    frequency: frequency * (0.8 + random.next() * 0.4),
    phase: random.next() * Math.PI * 2,
    amount: 0.5 + random.next() * 0.5,
  }))
  const total = parts.reduce((sum, p) => sum + p.amount, 0)
  return (t) => parts.reduce((sum, p) => sum + p.amount * Math.sin(Math.PI * 2 * p.frequency * t + p.phase), 0) / total
}

function pencilPen(ctx: CanvasRenderingContext2D, options: PenOptions): Pen {
  const pencil = options.pencil ?? {}
  const ink = options.ink
  const roughness = pencil.roughness ?? Math.max(1, options.lineWidth * 0.12)
  const passes = Math.max(1, Math.round(pencil.passes ?? 2))
  const pressureAmount = Math.min(1, Math.max(0, pencil.pressure ?? 0.25))
  const rubbedOut = Math.min(1, Math.max(0, pencil.rubbedOut ?? 0.15))
  const frame = boilFrame(options.time, pencil.boil ?? 8)
  let strokes = 0

  /** A generator for this stroke and pass; `still` ones ignore the boil (marks left on the paper). */
  const randomFor = (stroke: number, pass: number, still = false) =>
    createRandom(hashSeed(`${options.seed}:${still ? 'paper' : frame}:${stroke}:${pass}`))

  /**
   * One graphite stroke: a ribbon whose centre line wobbles and whose width
   * follows the pen's pressure, tapering in and out at the ends.
   */
  const ribbon = (points: Point[], widthAt: (t: number) => number, random: RandomSource, alpha: number, wobble: number, overshoot = 0) => {
    if (points.length < 2) return
    // Sample finely enough for small shapes (a joint circle) and coarsely enough to stay quick.
    const total = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0)
    let path = resample(points, Math.max(1.5, Math.min(options.lineWidth * 0.8, total / 24)))
    if (overshoot > 0 && path.length >= 2) {
      // A quick pencil flick runs a little past the end.
      const [a, b] = [path[path.length - 2], path[path.length - 1]]
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
      path = [...path, { x: b.x + ((b.x - a.x) / length) * overshoot, y: b.y + ((b.y - a.y) / length) * overshoot }]
    }
    const offset = wave(random)
    const pressure = wave(random)
    const n = path.length
    const left: Point[] = []
    const right: Point[] = []
    path.forEach((p, i) => {
      const t = n === 1 ? 0 : i / (n - 1)
      const a = path[Math.max(0, i - 1)]
      const b = path[Math.min(n - 1, i + 1)]
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
      const nx = -(b.y - a.y) / length
      const ny = (b.x - a.x) / length
      const shift = offset(t) * wobble
      // Pressure: lighter as the pencil lands and lifts, and varying along the way.
      const ends = Math.min(1, t / 0.08, (1 - t) / 0.08)
      const press = (0.55 + 0.45 * Math.sqrt(Math.max(0, ends))) * (1 + pressureAmount * pressure(t))
      const half = Math.max(0.3, (widthAt(t) * press) / 2)
      const cx = p.x + nx * shift
      const cy = p.y + ny * shift
      left.push({ x: cx + nx * half, y: cy + ny * half })
      right.push({ x: cx - nx * half, y: cy - ny * half })
    })
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.fillStyle = ink
    tracePath(ctx, [...left, ...right.reverse()], true)
    ctx.fill()
    ctx.restore()
  }

  /** A stroke in passes, with now and then a rubbed-out attempt beside it first. */
  const stroke = (points: Point[], widthAt: (t: number) => number) => {
    const index = strokes++
    const paper = randomFor(index, 99, true)
    if (paper.next() < rubbedOut) {
      // An earlier attempt, a little off, rubbed out: a faint line and a grey smudge.
      const dx = (paper.next() * 2 - 1) * options.lineWidth * 1.4
      const dy = (paper.next() * 2 - 1) * options.lineWidth * 1.4
      const ghost = points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
      ribbon(ghost, (t) => widthAt(t) * 1.8, randomFor(index, 98, true), 0.035, roughness)
      ribbon(ghost, (t) => widthAt(t) * 0.45, randomFor(index, 97, true), 0.12, roughness * 1.5)
    }
    // A heavy line is several pencil lines laid side by side, so its weight
    // reads as graphite texture rather than a solid fill; a light one is one.
    const length = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0)
    const heavy = widthAt(0.5) > 4 && length > widthAt(0.5) * 6
    const lanes = heavy ? [-0.3, 0.3, 0] : [0]
    for (let pass = 0; pass < passes; pass++) {
      const first = pass === 0
      lanes.forEach((lane, l) => {
        const random = randomFor(index, pass * 10 + l)
        // Side lines draw together at the ends, where the pencil lands and lifts.
        const shifted = lane === 0 ? points : offsetLine(points, (t) => widthAt(t) * lane * Math.sqrt(Math.sin(Math.PI * t)))
        const flick = !first && lane === 0 ? options.lineWidth * (0.3 + random.next() * 0.8) : 0
        ribbon(shifted, (t) => widthAt(t) * (heavy ? 0.5 : 1) * (first ? 1 : 0.6), random, first ? 0.85 : 0.45, roughness * (first ? 0.6 : 1), flick)
      })
    }
  }

  const ellipseStroke = (cx: number, cy: number, rx: number, ry: number, angle: number, width: number) => {
    // A quick pencil circle starts anywhere and overshoots its start.
    const random = randomFor(strokes, 50)
    const start = random.next() * Math.PI * 2
    stroke(ellipsePoints(cx, cy, rx, ry, angle, start, 1.08, 48), () => width)
  }

  return {
    look: 'pencil',
    ink,
    limb(points, from, to) {
      stroke(points, (t) => from + (to - from) * t)
    },
    line(points, width) {
      stroke(points, () => width)
    },
    shape(points, fill, outline) {
      if (fill !== null) {
        ctx.save()
        ctx.globalAlpha *= 0.88
        ctx.fillStyle = fill
        tracePath(ctx, points, true)
        ctx.fill()
        ctx.restore()
      }
      if (outline > 0) stroke([...points, points[0]], () => outline)
    },
    ellipse(cx, cy, rx, ry, angle, fill, outline) {
      if (fill !== null) {
        ctx.save()
        ctx.globalAlpha *= 0.9
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ellipseStroke(cx, cy, rx, ry, angle, outline)
    },
    dot(x, y, r) {
      ctx.save()
      ctx.globalAlpha *= 0.9
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
    guide(points) {
      if (pencil.construction === false || points.length < 2) return
      const index = strokes++
      ribbon(points, () => Math.max(0.6, options.lineWidth * 0.18), randomFor(index, 0), 0.28, roughness * 1.2, options.lineWidth)
    },
    guideEllipse(cx, cy, rx, ry, angle) {
      if (pencil.construction === false) return
      const index = strokes++
      const random = randomFor(index, 0)
      const points = ellipsePoints(cx, cy, rx, ry, angle, random.next() * Math.PI * 2, 1.12, 48)
      ribbon(points, () => Math.max(0.6, options.lineWidth * 0.18), random, 0.28, roughness * 1.5)
    },
  }
}

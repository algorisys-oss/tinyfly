import { createRandom, hashSeed, type RandomSource } from '../../engine/authoring/random'
import { partialPath } from './polyline'

/**
 * Hand-drawn strokes for canvas drawing: each line is drawn a few times, a
 * little off and a little bowed, the way a pencil line is. "Line boil" redraws
 * the wobble a few times a second, so a still drawing looks alive.
 *
 * The wobble comes from a seeded generator keyed to the seed, the boil frame
 * and the stroke's place in the drawing order, never from Math.random, so the
 * same time always draws the same lines: a frame rendered twice, in a browser
 * or headless, is identical.
 *
 * Every stroke takes a `progress` (0..1) to draw it on, as a pencil would: the
 * part drawn so far lies exactly on the finished stroke, so it grows without
 * jumping.
 */

export interface SketchStyle {
  /** Largest wobble, px (default 2) */
  roughness?: number
  /** Strokes per line: 1 is clean, 2 or 3 look sketched (default 2) */
  passes?: number
  /** Redraws per second; 0 holds the wobble still (default 8, about "on threes" at 24 fps) */
  boil?: number
  /** Seed for the wobble, so two drawings with the same style do not boil in step (default 1) */
  seed?: number
}

export interface Point {
  x: number
  y: number
}

/** Which redraw is showing at `time` ms. */
export function boilFrame(time: number, boil: number): number {
  return boil > 0 ? Math.floor((Math.max(0, time) * boil) / 1000) : 0
}

/**
 * Strokes in the context's current stroke style and line width. Each stroke's
 * wobble is seeded by its place in the drawing order, so draw them in the same
 * order every frame; a stroke drawn on partway wobbles exactly as it will when
 * it is finished, and does not disturb the strokes after it.
 */
export interface SketchPen {
  /** A line through the points, each segment slightly bowed; `progress` draws it on (default 1) */
  line(points: Point[], progress?: number): void
  /**
   * A smooth curve through the points (a limb drawn as a curve). The wobble
   * is spread along the whole curve rather than added at every point, so a
   * finely sampled curve stays smooth instead of turning lumpy.
   */
  curve(points: Point[], progress?: number): void
  /** A circle whose end overshoots its start, as a quick pencil circle does */
  circle(cx: number, cy: number, r: number, progress?: number): void
  /** An ellipse drawn the same way as `circle` */
  ellipse(cx: number, cy: number, rx: number, ry: number, progress?: number): void
  /** A small random offset, up to `scale` × roughness, for nudging details (a face) with the boil */
  nudge(scale?: number): Point
}

/** A pen whose wobble is fixed for the boil frame showing at `time` ms. */
export function sketchPen(ctx: CanvasRenderingContext2D, style: SketchStyle, time: number): SketchPen {
  const roughness = style.roughness ?? 2
  const passes = Math.max(1, Math.round(style.passes ?? 2))
  const frame = boilFrame(time, style.boil ?? 8)
  let strokes = 0
  /** Generators for the next stroke, one per pass, so its wobble is its own. */
  const nextStroke = () => {
    const stroke = strokes++
    return (pass: number) => createRandom(hashSeed(`${style.seed ?? 1}:${frame}:${stroke}:${pass}`))
  }
  const spread = (random: RandomSource, amount: number) => (random.next() * 2 - 1) * amount

  /** Run `draw` once per pass; later passes are fainter and thinner, like a lighter retrace. */
  const eachPass = (draw: (random: RandomSource) => void) => {
    const random = nextStroke()
    const width = ctx.lineWidth
    const alpha = ctx.globalAlpha
    for (let pass = 0; pass < passes; pass++) {
      ctx.lineWidth = pass === 0 ? width : width * 0.55
      ctx.globalAlpha = pass === 0 ? alpha : alpha * 0.6
      draw(random(pass))
    }
    ctx.lineWidth = width
    ctx.globalAlpha = alpha
  }

  const line = (points: Point[], progress = 1) => {
    if (points.length < 2) return
    const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
    const drawn = lengths.reduce((sum, l) => sum + l, 0) * Math.min(1, Math.max(0, progress))
    eachPass((random) => {
      // The whole stroke's wobble, point by point, whatever part is drawn.
      const ends: Point[] = []
      const bows: [number, number][] = []
      points.forEach((p, i) => {
        ends.push({ x: p.x + spread(random, roughness * 0.5), y: p.y + spread(random, roughness * 0.5) })
        if (i > 0) bows.push([random.next() * 2 - 1, random.next() * 2 - 1])
      })
      if (drawn <= 0) return
      ctx.beginPath()
      ctx.moveTo(ends[0].x, ends[0].y)
      let along = 0
      for (let i = 1; i < ends.length; i++) {
        const cubic = bowedCubic(ends[i - 1], ends[i], roughness, bows[i - 1])
        const length = lengths[i - 1]
        if (along + length <= drawn) {
          ctx.bezierCurveTo(cubic[1].x, cubic[1].y, cubic[2].x, cubic[2].y, cubic[3].x, cubic[3].y)
          along += length
          continue
        }
        const part = splitCubic(cubic, length === 0 ? 1 : (drawn - along) / length)
        ctx.bezierCurveTo(part[1].x, part[1].y, part[2].x, part[2].y, part[3].x, part[3].y)
        break
      }
      ctx.stroke()
    })
  }

  const ellipse = (cx: number, cy: number, rx: number, ry: number, progress = 1) => {
    eachPass((random) => {
      const steps = 14
      const start = random.next() * Math.PI * 2
      // A little past a full turn, so the ends cross instead of meeting.
      const sweep = Math.PI * 2 + 0.15 + random.next() * 0.3
      const points: Point[] = []
      for (let i = 0; i <= steps; i++) {
        const angle = start + (sweep * i) / steps
        const wobble = spread(random, roughness * 0.6)
        points.push({ x: cx + Math.cos(angle) * (rx + wobble), y: cy + Math.sin(angle) * (ry + wobble) })
      }
      const drawn = partialPath(points, progress)
      if (drawn.length < 2) return
      smoothPath(ctx, drawn)
      ctx.stroke()
    })
  }

  return {
    line,
    curve(points, progress = 1) {
      if (points.length < 2) return
      const first = points[0]
      const last = points[points.length - 1]
      const chord = Math.hypot(last.x - first.x, last.y - first.y) || 1
      const nx = -(last.y - first.y) / chord
      const ny = (last.x - first.x) / chord
      eachPass((random) => {
        const start = { x: spread(random, roughness * 0.5), y: spread(random, roughness * 0.5) }
        const end = { x: spread(random, roughness * 0.5), y: spread(random, roughness * 0.5) }
        const bow = spread(random, roughness * Math.min(1.5, Math.max(0.3, chord / 80)))
        const wobbled = points.map((p, i) => {
          const t = i / (points.length - 1)
          const off = Math.sin(Math.PI * t) * bow
          return {
            x: p.x + start.x + (end.x - start.x) * t + nx * off,
            y: p.y + start.y + (end.y - start.y) * t + ny * off,
          }
        })
        const drawn = partialPath(wobbled, progress)
        if (drawn.length < 2) return
        smoothPath(ctx, drawn)
        ctx.stroke()
      })
    },
    circle(cx, cy, r, progress = 1) {
      ellipse(cx, cy, r, r, progress)
    },
    ellipse,
    nudge(scale = 0.5) {
      const random = nextStroke()(0)
      return { x: spread(random, roughness * scale), y: spread(random, roughness * scale) }
    },
  }
}

type Cubic = [Point, Point, Point, Point]

/** A cubic from `a` to `b` whose control points sit off the straight line by `offsets` (-1..1) of the bow. */
function bowedCubic(a: Point, b: Point, roughness: number, offsets: [number, number]): Cubic {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy) || 1
  // Long lines bow more than short ones, but never by more than 1.5× roughness.
  const bow = roughness * Math.min(1.5, Math.max(0.3, length / 80))
  const nx = -dy / length
  const ny = dx / length
  return [
    a,
    { x: a.x + dx / 3 + nx * offsets[0] * bow, y: a.y + dy / 3 + ny * offsets[0] * bow },
    { x: a.x + (2 * dx) / 3 + nx * offsets[1] * bow, y: a.y + (2 * dy) / 3 + ny * offsets[1] * bow },
    b,
  ]
}

/** The first `t` (0..1) of a cubic, as a cubic of its own (de Casteljau). */
function splitCubic([p0, p1, p2, p3]: Cubic, t: number): Cubic {
  const lerp = (a: Point, b: Point) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
  const a = lerp(p0, p1)
  const b = lerp(p1, p2)
  const c = lerp(p2, p3)
  const d = lerp(a, b)
  const e = lerp(b, c)
  return [p0, a, d, lerp(d, e)]
}

/** A smooth open path through the points: quadratics between their midpoints. */
function smoothPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i++) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 }
    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)
}

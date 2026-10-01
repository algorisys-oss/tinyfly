import { parsePath } from '../../engine/path'
import { partialPath } from './polyline'
import type { Point, SketchPen } from './sketch'

/**
 * Shape outlines as strokes a pencil can draw: runs of straight segments, and
 * curves sampled into points. The canvas adapter draws a shape this way when
 * it is sketched or only partly drawn on (`drawOn` below 1).
 */

export interface OutlineStroke {
  /** `line`: straight segments between the points; `curve`: a smooth curve through them */
  kind: 'line' | 'curve'
  points: Point[]
  /** Length along the shape, for sharing out `drawOn` */
  length: number
}

/** Points per cubic segment when a curve is sampled. */
const CURVE_SAMPLES = 12

/**
 * The outline of SVG path data: each run of straight segments is one stroke
 * (so a polygon is drawn in one go), each curved segment another.
 */
export function pathOutline(pathData: string): OutlineStroke[] {
  const strokes: OutlineStroke[] = []
  let run: OutlineStroke | undefined
  let runSubpath = -1
  for (const segment of parsePath(pathData).segments) {
    if (segment.type === 'L') {
      if (!run || runSubpath !== segment.subpath) {
        run = { kind: 'line', points: [{ x: segment.startX, y: segment.startY }], length: 0 }
        runSubpath = segment.subpath
        strokes.push(run)
      }
      run.points.push({ x: segment.endX, y: segment.endY })
      run.length += segment.length
      continue
    }
    run = undefined
    const [c1x, c1y, c2x, c2y, ex, ey] = segment.points
    const points: Point[] = []
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const t = i / CURVE_SAMPLES
      const u = 1 - t
      points.push({
        x: u * u * u * segment.startX + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
        y: u * u * u * segment.startY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey,
      })
    }
    strokes.push({ kind: 'curve', points, length: segment.length })
  }
  return strokes
}

/** The outline of a rectangle, with rounded corners when `radius` is above 0. */
export function rectOutline(x: number, y: number, width: number, height: number, radius = 0): OutlineStroke[] {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  if (r === 0) return pathOutline(`M${x},${y} H${x + width} V${y + height} H${x} Z`)
  const right = x + width
  const bottom = y + height
  return pathOutline(
    `M${x + r},${y} H${right - r} A${r},${r} 0 0 1 ${right},${y + r} V${bottom - r} ` +
      `A${r},${r} 0 0 1 ${right - r},${bottom} H${x + r} A${r},${r} 0 0 1 ${x},${bottom - r} ` +
      `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
  )
}

/**
 * Stroke an outline up to `progress` (0..1) of its total length, in order:
 * sketched with a pen, or clean. Every stroke is handed to the pen even when
 * none of it is drawn yet, so each keeps its own wobble as the outline grows.
 */
export function drawOutline(ctx: CanvasRenderingContext2D, strokes: OutlineStroke[], progress: number, pen?: SketchPen): void {
  const total = strokes.reduce((sum, stroke) => sum + stroke.length, 0)
  const drawn = total * Math.min(1, Math.max(0, progress))
  let along = 0
  if (!pen) ctx.beginPath()
  for (const stroke of strokes) {
    const part = stroke.length === 0 ? (drawn >= along ? 1 : 0) : Math.min(1, Math.max(0, (drawn - along) / stroke.length))
    along += stroke.length
    if (pen) {
      if (stroke.kind === 'curve') pen.curve(stroke.points, part)
      else pen.line(stroke.points, part)
      continue
    }
    if (part <= 0) continue
    const points = partialPath(stroke.points, part)
    ctx.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  }
  if (!pen) ctx.stroke()
}

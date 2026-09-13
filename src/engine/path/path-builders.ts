/**
 * Build SVG path data from other descriptions of a shape: a list of points to
 * pass through, or a basic SVG shape's attributes. Authoring-time helpers — the
 * result is an ordinary path string, so everything downstream (motion paths,
 * morphs, JSON) only ever sees path data.
 */

export interface PathPoint {
  x: number
  y: number
}

export interface PointsToPathOptions {
  /**
   * 0 draws straight lines between the points; 1 (the default) a natural curve
   * through them; larger values bow further. The same meaning as GSAP's
   * `curviness`.
   */
  curviness?: number
  /** Join the last point back to the first, smoothly */
  closed?: boolean
}

const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * A path through every point, in order, as a Catmull-Rom spline converted to
 * cubic beziers — each curve's tangent at a point is parallel to the line
 * between that point's neighbours, which is what makes the join smooth.
 */
export function pointsToPath(points: PathPoint[], options: PointsToPathOptions = {}): string {
  if (points.length === 0) return ''
  const curviness = options.curviness ?? 1
  const closed = options.closed ?? false
  const n = points.length

  let d = `M${round(points[0].x)} ${round(points[0].y)}`
  if (n === 1) return d

  const at = (i: number): PathPoint => {
    if (closed) return points[((i % n) + n) % n]
    return points[Math.max(0, Math.min(n - 1, i))]
  }

  const segments = closed ? n : n - 1
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)

    if (curviness === 0) {
      d += ` L${round(p2.x)} ${round(p2.y)}`
      continue
    }

    const k = curviness / 6
    const c1x = p1.x + (p2.x - p0.x) * k
    const c1y = p1.y + (p2.y - p0.y) * k
    const c2x = p2.x - (p3.x - p1.x) * k
    const c2y = p2.y - (p3.y - p1.y) * k
    d += ` C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2.x)} ${round(p2.y)}`
  }

  return closed ? `${d} Z` : d
}

/** The attributes of a basic SVG shape, as strings (as read from the DOM). */
export interface SvgShape {
  /** Element name: path, circle, ellipse, rect, line, polyline or polygon */
  tag: string
  attributes: Record<string, string | null | undefined>
}

const num = (value: string | null | undefined, fallback = 0): number => {
  const parsed = parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : fallback
}

/** Pairs from a `points` attribute: "x1,y1 x2,y2 …" (commas and spaces interchangeable). */
function parsePoints(value: string | null | undefined): PathPoint[] {
  const numbers = (value ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number)
  const points: PathPoint[] = []
  for (let i = 0; i + 1 < numbers.length; i += 2) points.push({ x: numbers[i], y: numbers[i + 1] })
  return points
}

/**
 * Path data equivalent to a basic SVG shape, starting where the browser's own
 * geometry starts (so a follower begins where `getPointAtLength(0)` would).
 * Returns null for anything else.
 */
export function shapeToPathData(shape: SvgShape): string | null {
  const a = shape.attributes
  switch (shape.tag.toLowerCase()) {
    case 'path':
      return a.d ?? null
    case 'circle':
    case 'ellipse': {
      const cx = num(a.cx)
      const cy = num(a.cy)
      const rx = shape.tag.toLowerCase() === 'circle' ? num(a.r) : num(a.rx)
      const ry = shape.tag.toLowerCase() === 'circle' ? num(a.r) : num(a.ry)
      // Start at 3 o'clock and sweep clockwise, as SVG geometry does.
      return `M${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx} ${cy} Z`
    }
    case 'rect': {
      const x = num(a.x)
      const y = num(a.y)
      const w = num(a.width)
      const h = num(a.height)
      let rx = a.rx != null ? num(a.rx) : a.ry != null ? num(a.ry) : 0
      let ry = a.ry != null ? num(a.ry) : rx
      rx = Math.min(rx, w / 2)
      ry = Math.min(ry, h / 2)
      if (rx === 0 || ry === 0) return `M${x} ${y} H${x + w} V${y + h} H${x} Z`
      return (
        `M${x + rx} ${y} H${x + w - rx} A${rx} ${ry} 0 0 1 ${x + w} ${y + ry} ` +
        `V${y + h - ry} A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} ` +
        `H${x + rx} A${rx} ${ry} 0 0 1 ${x} ${y + h - ry} ` +
        `V${y + ry} A${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`
      )
    }
    case 'line':
      return `M${num(a.x1)} ${num(a.y1)} L${num(a.x2)} ${num(a.y2)}`
    case 'polyline':
    case 'polygon': {
      const points = parsePoints(a.points)
      if (points.length === 0) return null
      const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
      return shape.tag.toLowerCase() === 'polygon' ? `${d} Z` : d
    }
    default:
      return null
  }
}

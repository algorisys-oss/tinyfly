import type { CubicBezierPoints, EasingFunction } from '../types'
import { parsePath } from '../path/path-utils'

/**
 * Custom ease curves, built at authoring time.
 *
 * An ease maps progress in time (x, 0..1) to progress in value (y). These build
 * one from what designers hand over: a curve drawn as SVG path data, bezier
 * points, or a generated bounce or wiggle. Everything here is a pure function of
 * its input, and the result is either an exact cubic-bezier (serializable as is)
 * or a function a timeline samples into keyframes (see `bakeEasing`).
 */

export interface CustomEaseResult {
  /** The curve as a function of progress */
  fn: EasingFunction
  /** Set when the curve is exactly one cubic-bezier, which serializes without sampling */
  bezier?: CubicBezierPoints
}

/** Samples along the curve for the x → y lookup. */
const CURVE_SAMPLES = 600

/**
 * A custom ease from SVG path data or bezier control points.
 *
 * Path data may be in any coordinate space and either y direction: x is scaled
 * so the path runs from 0 to 1, and y so it starts at 0 and ends at 1. So a curve
 * exported from a design tool (y growing downward, a 500-wide artboard) and one
 * written in unit space give the same ease. Along x the path must not double
 * back; along y it may overshoot and undershoot freely.
 */
export function customEase(definition: string | CubicBezierPoints): CustomEaseResult {
  if (Array.isArray(definition)) {
    const [x1, y1, x2, y2] = definition
    return { fn: cubicBezierEase(x1, y1, x2, y2), bezier: [x1, y1, x2, y2] }
  }

  const { segments } = parsePath(definition)
  if (segments.length === 0) throw new Error(`customEase: no curve in "${definition}"`)
  const x0 = segments[0].startX
  const y0 = segments[0].startY
  const last = segments[segments.length - 1]
  const width = last.endX - x0
  const height = last.endY - y0
  if (width === 0 || height === 0) throw new Error(`customEase: "${definition}" must move along both axes`)
  const nx = (x: number) => (x - x0) / width
  const ny = (y: number) => (y - y0) / height

  // One cubic from start to end is an ordinary cubic-bezier.
  if (segments.length === 1 && last.type === 'C') {
    const [c1x, c1y, c2x, c2y] = last.points
    const points: CubicBezierPoints = [nx(c1x), ny(c1y), nx(c2x), ny(c2y)]
    return { fn: cubicBezierEase(...points), bezier: points }
  }

  // Otherwise sample the whole path into an x-sorted table.
  const xs: number[] = []
  const ys: number[] = []
  const perSegment = Math.max(8, Math.ceil(CURVE_SAMPLES / segments.length))
  for (const segment of segments) {
    for (let i = xs.length === 0 ? 0 : 1; i <= perSegment; i++) {
      const [x, y] = pointOnSegment(segment, i / perSegment)
      xs.push(nx(x))
      ys.push(ny(y))
    }
  }
  return { fn: lookup(xs, ys) }
}

export interface CustomBounceOptions {
  /** 0..1: how lively; higher bounces higher and more often (default 0.7) */
  strength?: number
}

/**
 * A ball dropped onto the end value: it lands, bounces back up by less each
 * time, and settles. Each rebound keeps `strength × 0.7 + 0.1` of the height, and
 * the bounces are timed as a real ball's would be, so the curve reads as gravity.
 */
export function customBounce(options: CustomBounceOptions = {}): EasingFunction {
  const strength = Math.max(0, Math.min(1, options.strength ?? 0.7))
  const restitution = 0.1 + strength * 0.7
  // Flight times: the drop takes 1 unit; a bounce reaching height h takes 2·√h.
  const flights = [1]
  for (let height = restitution; height > 0.002; height *= restitution) flights.push(2 * Math.sqrt(height))
  const total = flights.reduce((sum, flight) => sum + flight, 0)

  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let clock = t * total
    for (let i = 0; i < flights.length; i++) {
      if (clock <= flights[i]) {
        if (i === 0) return (clock / flights[0]) ** 2 // falling from rest
        const half = flights[i] / 2
        const peak = half * half // height reached, in the same units
        const fromPeak = clock - half
        return 1 - (peak - fromPeak * fromPeak)
      }
      clock -= flights[i]
    }
    return 1
  }
}

export type WiggleType = 'easeOut' | 'easeInOut' | 'uniform'

export interface CustomWiggleOptions {
  /** Full oscillations over the tween (default 10) */
  wiggles?: number
  /** How the swing's size changes: dying away (default), rising then falling, or constant */
  type?: WiggleType
}

/**
 * An oscillation that starts and ends at 0, swinging between -1 and 1. Used as
 * an ease it wiggles a value around its start: `rotate: 20` with a wiggle ease
 * swings ±20 degrees and comes back. Unlike other eases it ends where it began.
 */
export function customWiggle(options: CustomWiggleOptions = {}): EasingFunction {
  const wiggles = Math.max(1, options.wiggles ?? 10)
  const type = options.type ?? 'easeOut'
  const envelope = (t: number) =>
    type === 'uniform' ? 1 : type === 'easeInOut' ? Math.sin(Math.PI * t) : (1 - t) ** 2
  return (t) => {
    if (t <= 0 || t >= 1) return 0
    return Math.sin(t * wiggles * Math.PI * 2) * envelope(t)
  }
}

// ── internals ─────────────────────────────────────────────────────────────

function pointOnSegment(segment: { type: 'L' | 'C'; points: number[]; startX: number; startY: number }, t: number): [number, number] {
  if (segment.type === 'L') {
    const [x, y] = segment.points
    return [segment.startX + (x - segment.startX) * t, segment.startY + (y - segment.startY) * t]
  }
  const [c1x, c1y, c2x, c2y, x, y] = segment.points
  const u = 1 - t
  return [
    u * u * u * segment.startX + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
    u * u * u * segment.startY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
  ]
}

/** y at x from sampled points, by binary search and linear interpolation. */
function lookup(xs: number[], ys: number[]): EasingFunction {
  return (x) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1]
    let low = 0
    let high = xs.length - 1
    while (high - low > 1) {
      const mid = (low + high) >> 1
      if (xs[mid] <= x) low = mid
      else high = mid
    }
    const span = xs[high] - xs[low]
    return span === 0 ? ys[high] : ys[low] + ((x - xs[low]) / span) * (ys[high] - ys[low])
  }
}

/** A cubic-bezier ease evaluated by solving x for t (Newton, then bisection). */
function cubicBezierEase(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  const coordinate = (t: number, a: number, b: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  const slope = (t: number, a: number, b: number) => 3 * (1 - t) * (1 - t) * a + 6 * (1 - t) * t * (b - a) + 3 * t * t * (1 - b)
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const error = coordinate(t, x1, x2) - x
      const d = slope(t, x1, x2)
      if (Math.abs(error) < 1e-6) return coordinate(t, y1, y2)
      if (Math.abs(d) < 1e-6) break
      t -= error / d
    }
    let low = 0
    let high = 1
    t = x
    for (let i = 0; i < 40; i++) {
      if (coordinate(t, x1, x2) < x) low = t
      else high = t
      t = (low + high) / 2
    }
    return coordinate(t, y1, y2)
  }
}

/**
 * Shape morphing: interpolate between any two SVG path `d` strings.
 *
 * Both paths are resampled into matching point lists, which are blended. What
 * makes a morph look intentional rather than tangled is how those lists are
 * matched, so a plan is worked out once per pair of paths and cached:
 *
 * - **Subpaths are paired** in order when both paths have the same number, so
 *   a letter with a hole morphs outline-to-outline and hole-to-hole. Otherwise
 *   each path is treated as one continuous run.
 * - **Start point and direction are chosen** (GSAP's `shapeIndex: "auto"`): for
 *   closed shapes, every rotation of the target's points and both windings are
 *   tried, and the one that moves points least — measured about each shape's
 *   centre, so position does not dominate — is used. Open paths only try both
 *   directions.
 * - **Corners are kept.** Samples are dense (spaced by length) and always
 *   include every segment end of both shapes, so a star's points and a square's
 *   corners are exact at every frame, not cut off between samples.
 *
 * At progress 0 and 1 the original strings are returned untouched. Deterministic
 * and DOM-free, like the rest of the engine.
 */

import { parsePath, pointAtDistance, type PathSegment, type Subpath } from './path-utils'

/** Minimum and maximum samples per subpath, and the target spacing between them. */
const MIN_SAMPLES = 24
const MAX_SAMPLES = 320
const SAMPLE_SPACING = 2.5

/** Samples used when searching for the best start offset (cost grows with its square). */
const ALIGN_SAMPLES = 72

/** Kept for compatibility: the old fixed sample count. */
export const MORPH_SAMPLES = 64

const PLAN_CACHE_LIMIT = 128
const planCache = new Map<string, MorphPlan>()

interface Run {
  segments: PathSegment[]
  start: number
  end: number
  length: number
  closed: boolean
}

interface PairPlan {
  /** Flat [x0, y0, x1, y1, …] on the from-shape */
  from: number[]
  /** Matching points on the to-shape */
  to: number[]
  closed: boolean
}

interface MorphPlan {
  pairs: PairPlan[]
}

export interface MorphOptions {
  /**
   * Force the point on the target shape that the source's start maps to, as an
   * index into `ALIGN_SAMPLES` evenly spaced points, instead of choosing it
   * automatically. Negative values reverse the direction.
   */
  shapeIndex?: number
}

const round = (n: number) => Math.round(n * 100) / 100

function runsOf(pathData: string, merge: boolean): Run[] {
  const { segments, subpaths, totalLength } = parsePath(pathData)
  if (segments.length === 0) return []
  if (merge) {
    const allClosed = subpaths.every((s) => s.closed)
    return [{ segments, start: 0, end: segments.length, length: totalLength, closed: allClosed }]
  }
  return subpaths
    .filter((s: Subpath) => s.length > 0)
    .map((s) => ({ segments, start: s.start, end: s.end, length: s.length, closed: s.closed }))
}

function pointOnRun(run: Run, fraction: number): [number, number] {
  const f = run.closed ? ((fraction % 1) + 1) % 1 : Math.max(0, Math.min(1, fraction))
  const p = pointAtDistance(run.segments, f * run.length, run.start, run.end)
  return [p.x, p.y]
}

/** Fractions along the run where its segments end — its corners and joins. */
function boundariesOf(run: Run): number[] {
  const fractions: number[] = []
  let accumulated = 0
  for (let i = run.start; i < run.end; i++) {
    accumulated += run.segments[i].length
    if (run.length > 0) fractions.push(accumulated / run.length)
  }
  return fractions
}

function uniformSamples(run: Run, count: number): number[][] {
  const points: number[][] = []
  for (let i = 0; i < count; i++) {
    points.push(pointOnRun(run, run.closed ? i / count : i / (count - 1)))
  }
  return points
}

function centred(points: number[][]): number[][] {
  let cx = 0
  let cy = 0
  for (const [x, y] of points) {
    cx += x
    cy += y
  }
  cx /= points.length
  cy /= points.length
  return points.map(([x, y]) => [x - cx, y - cy])
}

/** How the to-run's fraction relates to the from-run's: an offset and a direction. */
interface Alignment {
  offset: number
  reversed: boolean
}

function chooseAlignment(from: Run, to: Run, forced?: number): Alignment {
  const closed = from.closed && to.closed
  if (forced !== undefined) {
    return { offset: closed ? (Math.abs(forced) % ALIGN_SAMPLES) / ALIGN_SAMPLES : 0, reversed: forced < 0 }
  }

  const a = centred(uniformSamples(from, ALIGN_SAMPLES))
  const b = centred(uniformSamples(to, ALIGN_SAMPLES))
  const n = ALIGN_SAMPLES
  let best: Alignment = { offset: 0, reversed: false }
  let bestCost = Infinity

  for (const reversed of [false, true]) {
    const offsets = closed ? n : 1
    for (let k = 0; k < offsets; k++) {
      let cost = 0
      for (let i = 0; i < n && cost < bestCost; i++) {
        const j = closed ? (reversed ? (k - i + n) % n : (i + k) % n) : reversed ? n - 1 - i : i
        const dx = a[i][0] - b[j][0]
        const dy = a[i][1] - b[j][1]
        cost += dx * dx + dy * dy
      }
      if (cost < bestCost) {
        bestCost = cost
        best = { offset: closed ? k / n : 0, reversed }
      }
    }
  }
  return best
}

/** The to-run fraction matching a from-run fraction. */
function mapFraction(f: number, alignment: Alignment, closed: boolean): number {
  if (!closed) return alignment.reversed ? 1 - f : f
  const mapped = alignment.reversed ? alignment.offset - f : f + alignment.offset
  return ((mapped % 1) + 1) % 1
}

/** The from-run fraction matching a to-run fraction (the inverse of mapFraction). */
function unmapFraction(g: number, alignment: Alignment, closed: boolean): number {
  if (!closed) return alignment.reversed ? 1 - g : g
  const f = alignment.reversed ? alignment.offset - g : g - alignment.offset
  return ((f % 1) + 1) % 1
}

function planPair(from: Run, to: Run, options: MorphOptions): PairPlan {
  const closed = from.closed && to.closed
  const alignment = chooseAlignment(from, to, options.shapeIndex)

  const count = Math.max(
    MIN_SAMPLES,
    Math.min(MAX_SAMPLES, Math.ceil(Math.max(from.length, to.length) / SAMPLE_SPACING))
  )

  // Even samples, plus both shapes' corners, in from-run fractions.
  const fractions = new Set<number>()
  const add = (f: number) => fractions.add(Math.round(f * 1e7) / 1e7)
  for (let i = 0; i <= count; i++) add(i / count)
  for (const f of boundariesOf(from)) add(f)
  for (const g of boundariesOf(to)) add(unmapFraction(g, alignment, closed))

  let sorted = [...fractions].sort((x, y) => x - y)
  // On a closed shape, 1 is the same place as 0.
  if (closed) sorted = sorted.filter((f) => f < 1)

  const fromPoints: number[] = []
  const toPoints: number[] = []
  for (const f of sorted) {
    fromPoints.push(...pointOnRun(from, f))
    toPoints.push(...pointOnRun(to, mapFraction(f, alignment, closed)))
  }
  return { from: fromPoints, to: toPoints, closed }
}

function planFor(from: string, to: string, options: MorphOptions): MorphPlan {
  const key = `${options.shapeIndex ?? 'auto'}|${from}|${to}`
  const cached = planCache.get(key)
  if (cached) return cached

  const separate = parsePath(from).subpaths.filter((s) => s.length > 0).length ===
    parsePath(to).subpaths.filter((s) => s.length > 0).length
  const fromRuns = runsOf(from, !separate)
  const toRuns = runsOf(to, !separate)

  const plan: MorphPlan = {
    pairs: fromRuns.map((run, i) => planPair(run, toRuns[i], options)),
  }

  if (planCache.size >= PLAN_CACHE_LIMIT) planCache.delete(planCache.keys().next().value!)
  planCache.set(key, plan)
  return plan
}

/**
 * The path `progress` of the way from `from` to `to` (0 = from, 1 = to).
 * Progress outside 0–1 is clamped; at the ends the original strings are
 * returned exactly.
 */
export function morphPath(from: string, to: string, progress: number, options: MorphOptions = {}): string {
  if (!from) return to
  if (!to) return from
  const p = Math.max(0, Math.min(1, progress))
  if (p === 0) return from
  if (p === 1) return to

  const plan = planFor(from, to, options)
  if (plan.pairs.length === 0) return p < 0.5 ? from : to

  let d = ''
  for (const pair of plan.pairs) {
    for (let i = 0; i < pair.from.length; i += 2) {
      const x = round(pair.from[i] + (pair.to[i] - pair.from[i]) * p)
      const y = round(pair.from[i + 1] + (pair.to[i + 1] - pair.from[i + 1]) * p)
      d += `${i === 0 ? (d ? ' M' : 'M') : ' L'}${x} ${y}`
    }
    if (pair.closed) d += ' Z'
  }
  return d
}

/** Forget cached morph plans (useful for memory management). */
export function clearMorphCache(): void {
  planCache.clear()
}

/** True when a string looks like SVG path data (starts with a moveto). */
export function isPathData(value: string): boolean {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(value)
}

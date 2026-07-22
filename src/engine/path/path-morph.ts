/**
 * Shape morphing: interpolate between two SVG path `d` strings. Works for any
 * paths (polygons, stars, curves) by sampling both uniformly along their length
 * and lerping the sampled points — deterministic and DOM-free, so it runs in the
 * engine, workers, and tests alike.
 */

import { getPointAtProgress } from './path-utils'

/** Number of samples used to approximate each path when morphing. */
export const MORPH_SAMPLES = 64

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Build a polyline `d` from `samples+1` points sampled along `from` and `to`,
 * blended by `progress` (0 = from, 1 = to). The result is closed, which suits the
 * shapes people morph (polygons, stars, blobs). At progress 0 or 1 it is a
 * faithful polyline approximation of that endpoint path.
 */
export function morphPath(from: string, to: string, progress: number, samples = MORPH_SAMPLES): string {
  const p = Math.max(0, Math.min(1, progress))
  if (!from) return to
  if (!to) return from
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const a = getPointAtProgress(from, t)
    const b = getPointAtProgress(to, t)
    const x = round(a.x + (b.x - a.x) * p)
    const y = round(a.y + (b.y - a.y) * p)
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
  }
  return d + ' Z'
}

/** True when a string looks like SVG path data (starts with a moveto). */
export function isPathData(value: string): boolean {
  return /^\s*[Mm]\s*-?\d/.test(value)
}

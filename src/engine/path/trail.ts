/**
 * Trails: where something has been, as plain data.
 *
 * A trail is not a history of frames. It is the moving thing's position at
 * earlier times, asked of a function of time (usually the timeline's state),
 * so the same time always gives the same trail: seeking, scrubbing, frames
 * rendered in any order and loops all draw it identically.
 *
 * The ribbon helper turns sampled points into a tapered band's two edges,
 * for any renderer that fills polygons.
 */

export interface TrailOptions {
  /** How far back the trail reaches, ms */
  length: number
  /** Points along it, head included (default 32; at least 2) */
  samples?: number
  /**
   * Motion that repeats every `period` ms: earlier times wrap into
   * [0, period), so at the start of a loop the trail already shows the end
   * of the previous lap.
   */
  period?: number
  /** Nothing before this time, ms (default: no limit). The trail is shorter until it has had time to grow. */
  since?: number
}

export interface TrailSample<P> {
  /** Where it was */
  at: P
  /** When, ms */
  time: number
  /** 0 at the head (now) to 1 at the tail (`length` ago) */
  age: number
}

/**
 * Sample a trail ending at `time`: oldest first, the head last.
 *
 * ```ts
 * const trail = trailSamples((t) => pointOnOrbit(t), now, { length: 400 })
 * ```
 */
export function trailSamples<P>(positionAt: (time: number) => P, time: number, options: TrailOptions): TrailSample<P>[] {
  const count = Math.max(2, Math.round(options.samples ?? 32))
  const length = Math.max(0, options.length)
  const start = options.since !== undefined ? Math.max(time - length, options.since) : time - length
  if (start >= time) return []
  const period = options.period
  const out: TrailSample<P>[] = []
  for (let i = 0; i < count; i++) {
    const at = start + ((time - start) * i) / (count - 1)
    const asked = period && period > 0 && i < count - 1 ? ((at % period) + period) % period : at
    out.push({ at: positionAt(asked), time: at, age: length > 0 ? (time - at) / length : 0 })
  }
  return out
}

export interface RibbonPoint {
  x: number
  y: number
  /** Full width here, in the points' units */
  width: number
}

export interface Ribbon {
  /** One edge, a point per input point */
  left: Array<{ x: number; y: number }>
  /** The other edge, a point per input point */
  right: Array<{ x: number; y: number }>
}

/** How far a joint's corner may reach, in half-widths, before a sharp turn is cut short. */
const MITER_LIMIT = 2.5

/**
 * The two edges of a band along `points`, each point `width` wide. Joints
 * are mitred, so neighbouring segments share their corners exactly (quads
 * `left[i], left[i+1], right[i+1], right[i]` meet with no gap or overlap).
 * Repeated points are skipped over when finding directions.
 */
export function ribbon(points: RibbonPoint[]): Ribbon {
  const left: Ribbon['left'] = []
  const right: Ribbon['right'] = []
  const n = points.length
  const direction = (from: number, step: 1 | -1): [number, number] | null => {
    for (let j = from + step; j >= 0 && j < n; j += step) {
      const dx = (points[j].x - points[from].x) * step
      const dy = (points[j].y - points[from].y) * step
      const d = Math.hypot(dx, dy)
      if (d > 1e-9) return [dx / d, dy / d]
    }
    return null
  }
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const incoming = direction(i, -1)
    const outgoing = direction(i, 1)
    const a = incoming ?? outgoing ?? [1, 0]
    const b = outgoing ?? incoming ?? [1, 0]
    // The normal of the averaged direction, stretched so the band keeps its width through the turn.
    let tx = a[0] + b[0]
    let ty = a[1] + b[1]
    const t = Math.hypot(tx, ty)
    if (t < 1e-9) {
      tx = a[0]
      ty = a[1]
    } else {
      tx /= t
      ty /= t
    }
    const cos = tx * a[0] + ty * a[1]
    const stretch = Math.min(MITER_LIMIT, 1 / Math.max(cos, 1e-6))
    const half = (p.width / 2) * stretch
    left.push({ x: p.x - ty * half, y: p.y + tx * half })
    right.push({ x: p.x + ty * half, y: p.y - tx * half })
  }
  return { left, right }
}

/**
 * A round end for a band's last point: a half circle, `width / 2` across,
 * bulging the way the band travels. Drawn as part of the last segment, it
 * covers nothing the segment covers. Null when the band has no direction.
 * Angles are canvas angles (radians, y down): the arc runs from `start`
 * through the travel direction, decreasing, to `start - π`.
 */
export function ribbonHeadCap(points: RibbonPoint[]): { x: number; y: number; radius: number; start: number } | null {
  const n = points.length
  if (n < 2) return null
  const head = points[n - 1]
  for (let j = n - 2; j >= 0; j--) {
    const dx = head.x - points[j].x
    const dy = head.y - points[j].y
    const d = Math.hypot(dx, dy)
    if (d > 1e-9) {
      // The left edge sits at (x - ty·h, y + tx·h): its angle is that of (-ty, tx).
      return { x: head.x, y: head.y, radius: head.width / 2, start: Math.atan2(dx / d, -dy / d) }
    }
  }
  return null
}

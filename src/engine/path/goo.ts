/**
 * Satisfying matter, as plain geometry: metaballs that merge and split, drips
 * that form and fall, bubbles that grow, wobble and pop, and squash and
 * stretch that keeps a blob's area (or volume). Everything is a pure function
 * of its inputs, so a frame draws the same at any time and in any order.
 */

export interface GooPoint {
  x: number
  y: number
}

export interface Ball {
  x: number
  y: number
  r: number
}

export interface MetaballOptions {
  /** Where the surface is: the field is 1 at each ball's own radius (default 1; lower is fatter, blobs merge sooner) */
  threshold?: number
  /** Grid cell size, px (default 4): smaller is finer and slower */
  cell?: number
  /** Round the contour's corners (default true) */
  smooth?: boolean
  /** The area to trace, px (default: round the balls) */
  bounds?: { x: number; y: number; width: number; height: number }
}

/** The metaball field at a point: each ball adds r² / d², so it is 1 at its own edge. */
export function metaballField(balls: ReadonlyArray<Ball>, x: number, y: number): number {
  let sum = 0
  for (const ball of balls) {
    const d2 = (x - ball.x) ** 2 + (y - ball.y) ** 2
    sum += d2 > 1e-9 ? (ball.r * ball.r) / d2 : 1e9
  }
  return sum
}

/**
 * The outlines of merged balls, as closed polygons (marching squares over the
 * field, corners rounded). Two balls near each other join through a neck;
 * apart, each is its own circle.
 */
export function metaballContours(balls: ReadonlyArray<Ball>, options: MetaballOptions = {}): GooPoint[][] {
  if (balls.length === 0) return []
  const threshold = options.threshold ?? 1
  const cell = Math.max(0.5, options.cell ?? 4)
  const reach = Math.sqrt(1 / threshold) * 1.6
  const bounds = options.bounds ?? {
    x: Math.min(...balls.map((b) => b.x - b.r * reach)),
    y: Math.min(...balls.map((b) => b.y - b.r * reach)),
    width: Math.max(...balls.map((b) => b.x + b.r * reach)) - Math.min(...balls.map((b) => b.x - b.r * reach)),
    height: Math.max(...balls.map((b) => b.y + b.r * reach)) - Math.min(...balls.map((b) => b.y - b.r * reach)),
  }
  const nx = Math.max(2, Math.ceil(bounds.width / cell) + 1)
  const ny = Math.max(2, Math.ceil(bounds.height / cell) + 1)
  const field = new Float64Array(nx * ny)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) field[j * nx + i] = metaballField(balls, bounds.x + i * cell, bounds.y + j * cell) - threshold
  const at = (i: number, j: number) => field[j * nx + i]
  // Where the surface crosses a grid edge, by linear interpolation.
  const cross = (x0: number, y0: number, f0: number, x1: number, y1: number, f1: number): GooPoint => {
    const t = f0 === f1 ? 0.5 : f0 / (f0 - f1)
    return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t }
  }
  // Every cell gives up to two segments; segments are then chained into loops by their shared ends.
  const segments: Array<[GooPoint, GooPoint]> = []
  for (let j = 0; j + 1 < ny; j++) {
    for (let i = 0; i + 1 < nx; i++) {
      const x0 = bounds.x + i * cell
      const y0 = bounds.y + j * cell
      const x1 = x0 + cell
      const y1 = y0 + cell
      const f = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
      const code = (f[0] > 0 ? 1 : 0) | (f[1] > 0 ? 2 : 0) | (f[2] > 0 ? 4 : 0) | (f[3] > 0 ? 8 : 0)
      if (code === 0 || code === 15) continue
      const top = () => cross(x0, y0, f[0], x1, y0, f[1])
      const right = () => cross(x1, y0, f[1], x1, y1, f[2])
      const bottom = () => cross(x0, y1, f[3], x1, y1, f[2])
      const left = () => cross(x0, y0, f[0], x0, y1, f[3])
      const centre = (f[0] + f[1] + f[2] + f[3]) / 4 > 0
      switch (code) {
        case 1: case 14: segments.push([left(), top()]); break
        case 2: case 13: segments.push([top(), right()]); break
        case 3: case 12: segments.push([left(), right()]); break
        case 4: case 11: segments.push([right(), bottom()]); break
        case 6: case 9: segments.push([top(), bottom()]); break
        case 7: case 8: segments.push([left(), bottom()]); break
        case 5: if (centre) { segments.push([left(), bottom()], [top(), right()]) } else { segments.push([left(), top()], [right(), bottom()]) } break
        case 10: if (centre) { segments.push([left(), top()], [right(), bottom()]) } else { segments.push([left(), bottom()], [top(), right()]) } break
      }
    }
  }
  const loops = chain(segments)
  return options.smooth === false ? loops : loops.map((loop) => round(round(loop)))
}

/** Join segments end to end into closed loops. */
function chain(segments: Array<[GooPoint, GooPoint]>): GooPoint[][] {
  const key = (p: GooPoint) => `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`
  const byEnd = new Map<string, number[]>()
  segments.forEach(([a, b], i) => {
    for (const p of [a, b]) {
      const k = key(p)
      if (!byEnd.has(k)) byEnd.set(k, [])
      byEnd.get(k)!.push(i)
    }
  })
  const used = new Array<boolean>(segments.length).fill(false)
  const loops: GooPoint[][] = []
  for (let start = 0; start < segments.length; start++) {
    if (used[start]) continue
    used[start] = true
    const loop: GooPoint[] = [segments[start][0], segments[start][1]]
    let head = segments[start][1]
    for (;;) {
      const next = (byEnd.get(key(head)) ?? []).find((i) => !used[i])
      if (next === undefined) break
      used[next] = true
      const [a, b] = segments[next]
      head = key(a) === key(head) ? b : a
      if (key(head) === key(loop[0])) break
      loop.push(head)
    }
    if (loop.length >= 3) loops.push(loop)
  }
  return loops
}

/** One pass of corner-cutting (Chaikin) round a closed loop. */
function round(loop: GooPoint[]): GooPoint[] {
  const out: GooPoint[] = []
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]
    const b = loop[(i + 1) % loop.length]
    out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
  }
  return out
}

export interface DripOptions {
  /** Where it hangs from, px */
  x: number
  y: number
  /** How far it reaches when fully formed, px */
  length: number
  /** Its width at the top, px */
  width: number
  /** 0: nothing yet; 1: fully stretched, the head about to let go */
  progress: number
  /** Points round the head (default 12) */
  segments?: number
}

/**
 * A drip forming under a surface: a neck that thins as it stretches, a round
 * head that swells, as a closed polygon (y down). `progress` runs it.
 */
export function dripPath(options: DripOptions): GooPoint[] {
  const p = Math.min(1, Math.max(0, options.progress))
  if (p <= 0) return []
  const half = options.width / 2
  // The head swells as the drip forms; its centre is where the drip reaches, less its radius.
  const head = half * (0.55 + 0.75 * p)
  const reach = Math.max(options.length * p, head * 1.2)
  const cx = options.x
  const headY = options.y + reach - head
  // The neck narrows to a thread as it stretches, and meets the head above its widest.
  const neckEnd = Math.max(0.1, half * (0.35 - 0.3 * p))
  const joinY = headY - Math.sqrt(Math.max(0, head * head - neckEnd * neckEnd))
  const neckLength = Math.max(0, joinY - options.y)
  const steps = 8
  const left: GooPoint[] = []
  const right: GooPoint[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // A smooth taper: wide at the top, thinning fast as it stretches.
    const w = neckEnd + (half - neckEnd) * Math.pow(1 - t, 1.6 + 1.4 * p)
    left.push({ x: cx - w, y: options.y + neckLength * t })
    right.push({ x: cx + w, y: options.y + neckLength * t })
  }
  const segments = Math.max(8, Math.round(options.segments ?? 12))
  const join = Math.acos(Math.min(1, neckEnd / head))
  const from = -join
  const to = Math.PI + join
  const arc: GooPoint[] = []
  for (let i = 1; i < segments; i++) {
    const a = from + ((to - from) * i) / segments
    arc.push({ x: cx + Math.cos(a) * head, y: headY + Math.sin(a) * head })
  }
  return [...right, ...arc, ...left.reverse()]
}

export interface BubbleOptions {
  x: number
  y: number
  /** Radius when fully grown, px */
  r: number
  /** 0..1 grows it from nothing (default 1) */
  grow?: number
  /** ms, for the wobble; with `period` the wobble repeats exactly */
  time?: number
  period?: number
  /** How much the surface wobbles, as a share of the radius (default 0.05) */
  wobble?: number
  /** Points round it (default 48) */
  segments?: number
  /** Start the wobble somewhere else */
  seed?: number
}

/** A bubble: a circle whose surface wobbles with three gentle lobes, growing from nothing. */
export function bubblePath(options: BubbleOptions): GooPoint[] {
  const grow = Math.min(1, Math.max(0, options.grow ?? 1))
  // Grows fast, with a little swell past its size on the way, like a blown bubble.
  const size = grow >= 1 ? 1 : 1 - Math.pow(1 - grow, 3) + 0.08 * Math.sin(grow * Math.PI) * grow
  const r = options.r * Math.max(0, size)
  if (r <= 0) return []
  const n = Math.max(12, Math.round(options.segments ?? 48))
  const amount = options.wobble ?? 0.05
  const time = options.time ?? 0
  // With a period the wobble's phase wraps, so the same time next loop gives the very same points.
  const u = options.period ? time / options.period : time / 2500
  const turn = (u - Math.floor(u)) * Math.PI * 2
  const seed = options.seed ?? 0
  const out: GooPoint[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    // Two lobes turning one way, three the other: a surface that quivers rather than spins.
    const w = 1 + amount * (Math.sin(2 * a + turn + seed) * 0.6 + Math.sin(3 * a - 2 * turn + seed * 1.7) * 0.4)
    out.push({ x: options.x + Math.cos(a) * r * w, y: options.y + Math.sin(a) * r * w })
  }
  return out
}

export interface PopOptions {
  x: number
  y: number
  r: number
  /** 0: the moment it pops; 1: the pieces are gone */
  progress: number
  /** Fragments round the rim (default 8) */
  pieces?: number
}

/** A bubble popping: arcs of its rim flying outward and shrinking, as polylines. Empty before and after. */
export function bubblePop(options: PopOptions): GooPoint[][] {
  const p = options.progress
  if (p <= 0 || p >= 1) return []
  const pieces = Math.max(3, Math.round(options.pieces ?? 8))
  const out: GooPoint[][] = []
  const distance = options.r * (1 + 1.2 * p)
  const span = ((Math.PI * 2) / pieces) * 0.6 * (1 - p)
  for (let i = 0; i < pieces; i++) {
    const a = (i / pieces) * Math.PI * 2 + 0.3
    const arc: GooPoint[] = []
    for (let k = 0; k <= 4; k++) {
      const b = a - span / 2 + (span * k) / 4
      arc.push({ x: options.x + Math.cos(b) * distance, y: options.y + Math.sin(b) * distance })
    }
    out.push(arc)
  }
  return out
}

/**
 * Squash and stretch that keeps the amount of stuff: stretched taller by
 * `amount` (−1..1: negative squashes), the width gives way so the area stays
 * (`keep: 'area'`, the default, for flat drawings) or the volume stays
 * (`keep: 'volume'`, each side across shrinking by the square root).
 */
export function squashStretch(amount: number, options: { keep?: 'area' | 'volume' } = {}): { sx: number; sy: number } {
  const sy = Math.max(0.05, 1 + amount)
  const sx = options.keep === 'volume' ? 1 / Math.sqrt(sy) : 1 / sy
  return { sx, sy }
}

/** Scale points about a point (default the origin): a blob squashed where it lands. */
export function scalePoints(points: ReadonlyArray<GooPoint>, scale: { sx: number; sy: number }, about: GooPoint = { x: 0, y: 0 }): GooPoint[] {
  return points.map((p) => ({ x: about.x + (p.x - about.x) * scale.sx, y: about.y + (p.y - about.y) * scale.sy }))
}

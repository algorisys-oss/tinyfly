import type { Point } from '../../adapters/canvas/sketch'
import type { Vec3 } from '../rig/body-plan'
import { headPoint, type SolvedHead } from '../rig/skeleton'

/**
 * Regions on and around the head: hair, a beard, a hat's crown. A region is
 * described in the head's own terms and drawn wherever the head's turn, nod
 * and tilt put it, so it turns with the head through every view instead of
 * being a flat drawing pasted on.
 *
 * A point on the head is named by two numbers:
 * - `around`: radians around the head from the middle of the face, toward the
 *   character's left +, so ±π is the back of the head;
 * - `up`: head radii from the head's centre, +1 the crown, -1 under the chin
 *   (below -1 only for things that hang, like long hair or a long beard).
 *
 * The region says where it is (`inside`, positive inside) and where each of
 * its points sits (`position`, in head radii: x toward the character's left,
 * y up, z forward). It is cut into the part facing the viewer and the part
 * facing away; each part's outline is traced (marching squares over a grid
 * of `around` × `up`) and projected to the screen. The far part is drawn
 * before the head and the near part after it, so a bob shows beside the face
 * and its fringe crosses the forehead, and from behind the hair covers the
 * whole head. Same input, same outline: no randomness, no state.
 */
export interface ShellRegion {
  /** Positive inside the region, negative outside; continuous across the boundary */
  inside(around: number, up: number): number
  /** Where a point of the region is, head radii (x toward its left, y up, z forward) */
  position(around: number, up: number): Vec3
  /** Which way the surface faces there (default: away from the head's centre) */
  normal?(around: number, up: number): Vec3
  /** Highest `up` the region reaches (default 1, the crown) */
  top?: number
  /** Lowest `up` the region reaches (default -1, under the chin) */
  bottom?: number
}

/** The two halves of a region as seen: outlines on the screen. */
export interface ShellOutlines {
  /** The part facing the viewer: drawn over the head */
  near: Point[][]
  /** The part facing away: drawn behind the head */
  far: Point[][]
}

/** Rows per head radius up and down the head. */
const ROWS_PER_RADIUS = 15

/** A point on the unit sphere from `around` and `up`. */
export function spherePoint(around: number, up: number): Vec3 {
  const ring = Math.sqrt(Math.max(0, 1 - up * up))
  return [ring * Math.sin(around), up, ring * Math.cos(around)]
}

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1
  return [x / length, y / length, z / length]
}

/** How directly a head-space direction faces the viewer: 1 straight on, 0 at the edge, negative away. */
export function facingOf(head: SolvedHead, [x, y, z]: Vec3): number {
  const [ax, ay, az] = head.axes
  return ax[2] * x + ay[2] * y + az[2] * z
}

/** A head-space point (head radii) on the screen. */
export function onScreen(head: SolvedHead, point: Vec3): Point {
  return headPoint(head, point).point
}

/** Smallest angle between two `around` values. */
export function aroundDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2)
  return d > Math.PI ? Math.PI * 2 - d : d
}

/**
 * Trace the outlines of a region's near and far parts, on the screen.
 * `columns` around the head: more for fine texture (spikes, curls).
 */
export function shellOutlines(head: SolvedHead, region: ShellRegion, columns = 64): ShellOutlines {
  const top = region.top ?? 1
  const bottom = region.bottom ?? -1
  const rows = Math.max(8, Math.ceil((top - bottom) * ROWS_PER_RADIUS))
  // Row 0 and row rows + 2 are padding outside the region, so every outline closes.
  const upAt = (row: number) => Math.min(top, Math.max(bottom, top - ((top - bottom) * (row - 1)) / rows))
  const aroundAt = (column: number) => -Math.PI + (Math.PI * 2 * column) / columns
  const normalAt = (around: number, up: number) => (region.normal ? region.normal(around, up) : normalize(region.position(around, up)))

  const height = rows + 3
  const inside = new Float64Array(columns * height)
  const facing = new Float64Array(columns * height)
  for (let row = 0; row < height; row++) {
    const pad = row === 0 || row === height - 1
    const up = upAt(row)
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column
      if (pad) {
        inside[index] = -1
        continue
      }
      const around = aroundAt(column)
      inside[index] = region.inside(around, up)
      // Only points near the boundary need to know which way they face.
      facing[index] = inside[index] > -0.35 ? facingOf(head, normalAt(around, up)) : 0
    }
  }

  const wrap = (column: number) => ((column % columns) + columns) % columns
  const trace = (sign: 1 | -1): Point[][] => {
    // The field to trace, with the first column repeated at the end so cells wrap round the head.
    const stride = columns + 1
    const field = new Float64Array(stride * height)
    for (let row = 0; row < height; row++) {
      for (let column = 0; column <= columns; column++) {
        const index = row * columns + (column === columns ? 0 : column)
        field[row * stride + column] = Math.min(inside[index], sign * facing[index])
      }
    }
    const value = (column: number, row: number) => field[row * stride + column]
    // A crossing on a grid edge, found between its two corners, as a point on the screen.
    const crossing = (c0: number, r0: number, c1: number, r1: number): Point => {
      const v0 = value(c0, r0)
      const v1 = value(c1, r1)
      const t = v0 === v1 ? 0.5 : Math.min(1, Math.max(0, v0 / (v0 - v1)))
      return onScreen(head, region.position(aroundAt(c0 + (c1 - c0) * t), upAt(r0 + (r1 - r0) * t)))
    }
    // Every grid edge has a number: along a row (even) or down a column (odd), from its first corner.
    const edges = columns * height * 2
    const linkA = new Int32Array(edges).fill(-1)
    const linkB = new Int32Array(edges).fill(-1)
    const points = new Map<number, Point>()
    const edge = (down: boolean, column: number, row: number) => {
      const key = (row * columns + wrap(column)) * 2 + (down ? 1 : 0)
      if (!points.has(key)) points.set(key, down ? crossing(wrap(column), row, wrap(column), row + 1) : crossing(column, row, column + 1, row))
      return key
    }
    const join = (from: number, to: number) => {
      if (linkA[from] === -1) linkA[from] = to
      else linkB[from] = to
    }
    const link = (a: number, b: number) => {
      join(a, b)
      join(b, a)
    }
    for (let row = 0; row < height - 1; row++) {
      for (let column = 0; column < columns; column++) {
        const at = row * stride + column
        const corners = (field[at] > 0 ? 8 : 0) | (field[at + 1] > 0 ? 4 : 0) | (field[at + stride + 1] > 0 ? 2 : 0) | (field[at + stride] > 0 ? 1 : 0)
        if (corners === 0 || corners === 15) continue
        const T = () => edge(false, column, row)
        const B = () => edge(false, column, row + 1)
        const L = () => edge(true, column, row)
        const R = () => edge(true, column + 1, row)
        switch (corners) {
          case 1: case 14: link(L(), B()); break
          case 2: case 13: link(B(), R()); break
          case 3: case 12: link(L(), R()); break
          case 4: case 11: link(T(), R()); break
          case 6: case 9: link(T(), B()); break
          case 7: case 8: link(L(), T()); break
          case 5: case 10: {
            // A saddle: the cell's middle decides which corners join.
            const middle = (value(column, row) + value(column + 1, row) + value(column + 1, row + 1) + value(column, row + 1)) / 4 > 0
            if ((corners === 5) === middle) { link(L(), T()); link(B(), R()) } else { link(L(), B()); link(T(), R()) }
            break
          }
        }
      }
    }
    // Walk the links into closed loops.
    const loops: Point[][] = []
    const used = new Uint8Array(edges)
    for (const start of points.keys()) {
      if (used[start]) continue
      const loop: Point[] = []
      let previous = -1
      let current = start
      while (current !== -1 && !used[current]) {
        used[current] = 1
        loop.push(points.get(current)!)
        const a = linkA[current]
        const b = linkB[current]
        const next = a !== -1 && a !== previous && !used[a] ? a : b !== -1 && b !== previous && !used[b] ? b : -1
        previous = current
        current = next
      }
      if (loop.length >= 3) loops.push(loop)
    }
    return loops
  }

  return { near: trace(1), far: trace(-1) }
}

/**
 * Outlines for a head in one drawing, kept so the passes before and after the
 * body (which share the solved head) trace each region once. Keyed by the
 * head and by the region's own spec (the resolved hair, the beard…).
 */
const traced = new WeakMap<SolvedHead, Map<unknown, ShellOutlines>>()

export function cachedOutlines(head: SolvedHead, key: unknown, make: () => ShellOutlines): ShellOutlines {
  let forHead = traced.get(head)
  if (!forHead) traced.set(head, (forHead = new Map()))
  let outlines = forHead.get(key)
  if (!outlines) forHead.set(key, (outlines = make()))
  return outlines
}

/**
 * Run `draw` with the head's disc cut out of the canvas, for things behind
 * the head: they show only around it, even when the head is see-through.
 */
export function behindHead(ctx: CanvasRenderingContext2D, head: SolvedHead, draw: () => void): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(-1e5, -1e5, 2e5, 2e5)
  ctx.ellipse(head.center.x, head.center.y, head.rx, head.ry, head.angle, 0, Math.PI * 2)
  ctx.clip('evenodd')
  draw()
  ctx.restore()
}

/** Split a head-space polyline into the runs that face the viewer, on the screen. */
export function visibleRuns(head: SolvedHead, points: Vec3[], normals: Vec3[], threshold = 0.04): Point[][] {
  const runs: Point[][] = []
  let run: Point[] = []
  points.forEach((point, i) => {
    if (facingOf(head, normals[i]) > threshold) run.push(onScreen(head, point))
    else {
      if (run.length >= 2) runs.push(run)
      run = []
    }
  })
  if (run.length >= 2) runs.push(run)
  return runs
}

import { mat4, type Mat4, type Vec3 } from '../../engine/math'
import type { Mesh } from './shapes'

/**
 * Cutting a prop into columns, for sorting by depth among other things.
 *
 * A 3D scene draws pen-drawn things back to front, each whole, at one depth.
 * A long prop (a bus) has one depth for all of it, so a figure standing by
 * its far end and one by its near end can't both sort right against it.
 * Cut on a grid into columns about a metre across (along the prop's length
 * and width; up stays whole), each column sorts at its own depth. Columns
 * don't overlap, so for anything outside the prop the order is right; inside
 * a column the prop's parts keep their own order (a cabin over its body).
 * Big shapes are cut at the column walls, and those cuts are joins, not
 * outlines (`walls`), so the prop still draws as one. Small parts (a wheel,
 * an eye, a tube) go whole into the column their middle is in.
 */

export type Cell = readonly [number, number]

/** Where to cut along an axis: columns about `size` across, or none when it is not much longer than that. */
export function gridCuts(min: number, max: number, size: number): number[] {
  const extent = max - min
  if (!(extent >= size * 1.5)) return [min, max]
  const count = Math.round(extent / size)
  return Array.from({ length: count + 1 }, (_, i) => min + (extent * i) / count)
}

/** The column a point is in. */
export function cellOf(xs: number[], zs: number[], point: Vec3): Cell {
  const find = (cuts: number[], v: number) => Math.max(0, Math.min(cuts.length - 2, cuts.findIndex((c, i) => i > 0 && v <= c) - 1))
  return [find(xs, point[0]), find(zs, point[2])]
}

/** A mesh moved into its prop's space: its points by the part's matrix, its normals turned with it. */
export function meshInSpace(mesh: Mesh, m: Mat4): Mesh {
  const turn = (v: Vec3): Vec3 => {
    const n: Vec3 = [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]]
    const length = Math.hypot(...n) || 1
    return [n[0] / length, n[1] / length, n[2] / length]
  }
  return { ...mesh, vertices: mesh.vertices.map((v) => mat4.transformPoint(m, v)), faces: mesh.faces.map((face) => ({ corners: face.corners, normal: turn(face.normal) })) }
}

type Axis = 0 | 2

/** A polygon cut to the side of the plane `point[axis] = value` that `keep` says (+1 above, −1 below). */
function clipToPlane(points: Vec3[], axis: Axis, value: number, keep: 1 | -1): Vec3[] {
  const inside = (p: Vec3) => (p[axis] - value) * keep >= 0
  if (points.every(inside)) return points
  const out: Vec3[] = []
  points.forEach((current, i) => {
    const previous = points[(i + points.length - 1) % points.length]
    if (inside(current) !== inside(previous)) {
      const t = (value - previous[axis]) / (current[axis] - previous[axis])
      out.push([0, 1, 2].map((k) => (k === axis ? value : previous[k] + (current[k] - previous[k]) * t)) as Vec3)
    }
    if (inside(current)) out.push(current)
  })
  return out.length >= 3 ? out : []
}

/** A mesh (in its prop's space) cut at the grid's column walls: one joined piece per column it reaches. */
export function cutMesh(mesh: Mesh, xs: number[], zs: number[]): Array<{ cell: Cell; mesh: Mesh }> {
  const polygons = mesh.faces.map((face) => ({ points: face.corners.map((c) => mesh.vertices[c]), normal: face.normal }))
  const pieces: Array<{ cell: Cell; mesh: Mesh }> = []
  // The inner walls: edges cut along them are joins between pieces; the shape's own open edges stay outlines.
  const walls = { x: xs.slice(1, -1), z: zs.slice(1, -1) }
  for (let i = 0; i + 1 < xs.length; i++) {
    for (let j = 0; j + 1 < zs.length; j++) {
      const vertices: Vec3[] = []
      const index = new Map<string, number>()
      // Corners shared by neighbouring faces are one vertex, so their shared edges are found (outlines, creases).
      const vertexOf = (p: Vec3) => {
        const key = p.map((v) => Math.round(v * 1e6)).join(',')
        let at = index.get(key)
        if (at === undefined) {
          at = vertices.length
          vertices.push(p)
          index.set(key, at)
        }
        return at
      }
      const faces: Mesh['faces'] = []
      // The outermost walls are open, so nothing past the grid's ends is lost.
      const first = (k: number) => k === 0
      const last = (k: number, cuts: number[]) => k + 2 === cuts.length
      for (const polygon of polygons) {
        let points = polygon.points
        if (!first(i)) points = clipToPlane(points, 0, xs[i], 1)
        if (points.length && !last(i, xs)) points = clipToPlane(points, 0, xs[i + 1], -1)
        if (points.length && !first(j)) points = clipToPlane(points, 2, zs[j], 1)
        if (points.length && !last(j, zs)) points = clipToPlane(points, 2, zs[j + 1], -1)
        if (points.length >= 3) faces.push({ corners: points.map(vertexOf), normal: polygon.normal })
      }
      if (faces.length > 0) pieces.push({ cell: [i, j], mesh: { vertices, faces, creases: mesh.creases, joined: mesh.joined, walls } })
    }
  }
  return pieces
}

/** A part placed for cutting: its mesh, and its matrix into the prop's rest space. */
export interface PlacedPart<P> {
  part: P
  mesh: Mesh
  local: Mat4
  /** Never cut (a tube: it is drawn along its centre line in line art) */
  whole?: boolean
}

export interface ColumnPiece<P> {
  part: P
  /** Its own mesh (placed by `local`), or a piece cut from it (already in rest space) */
  mesh: Mesh
  cut: boolean
  cell: Cell
}

/** A mesh in rest space, with its bounds, cached by the matrix that put it there (most parts don't move). */
interface Placed {
  /** The matrix's key */
  key: string
  inSpace: Mesh
  low: Vec3
  high: Vec3
}

const placedCache = new WeakMap<Mesh, Map<string, Placed>>()
const cutCache = new WeakMap<Mesh, Map<string, Array<{ cell: Cell; mesh: Mesh }>>>()
const CACHE_SIZE = 48

/** A matrix as a cache key. */
export const matrixKey = (m: Mat4) => m.map((v) => Math.round(v * 1e5)).join(',')

function remember<K extends object, V>(cache: WeakMap<K, Map<string, V>>, owner: K, key: string, make: () => V): V {
  let byKey = cache.get(owner)
  if (!byKey) cache.set(owner, (byKey = new Map()))
  let value = byKey.get(key)
  if (value === undefined) {
    if (byKey.size >= CACHE_SIZE) byKey.clear()
    byKey.set(key, (value = make()))
  }
  return value
}

/** A part's mesh in rest space, with its bounds. */
export function placedMesh(mesh: Mesh, local: Mat4): Placed {
  const key = matrixKey(local)
  return remember(placedCache, mesh, key, () => {
    const inSpace = meshInSpace(mesh, local)
    const low: Vec3 = [Infinity, Infinity, Infinity]
    const high: Vec3 = [-Infinity, -Infinity, -Infinity]
    for (const v of inSpace.vertices) for (const k of [0, 1, 2] as const) {
      low[k] = Math.min(low[k], v[k])
      high[k] = Math.max(high[k], v[k])
    }
    return { key, inSpace, low, high }
  })
}

/**
 * A prop's parts placed in columns about `size` across, in its rest space
 * (before its pitch, lift and squash, so the columns move with it): small
 * parts whole in the column their middle is in, big ones cut at the column
 * walls. Cuts are cached, so only parts that move are cut again.
 */
export function propColumns<P>(parts: Array<PlacedPart<P>>, size: number): { pieces: Array<ColumnPiece<P>>; middle: (cell: Cell) => Vec3 } {
  const placed = parts.map((p) => ({ ...p, ...placedMesh(p.mesh, p.local) }))
  const low: Vec3 = [Infinity, Infinity, Infinity]
  const high: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const p of placed) for (const k of [0, 1, 2] as const) {
    low[k] = Math.min(low[k], p.low[k])
    high[k] = Math.max(high[k], p.high[k])
  }
  const xs = gridCuts(low[0], high[0], size)
  const zs = gridCuts(low[2], high[2], size)
  const grid = `${xs.join(',')}|${zs.join(',')}`
  const pieces = placed.flatMap((p): Array<ColumnPiece<P>> => {
    // Only long or wide shapes are cut (a car's body, a bus, a house); a canopy or a barrel sorts whole.
    const small = p.high[0] - p.low[0] <= size * 2.5 && p.high[2] - p.low[2] <= size * 2.5
    if (small || p.whole || p.mesh.joined || (p.mesh.marks?.length ?? 0) > 0) {
      const middle: Vec3 = [(p.low[0] + p.high[0]) / 2, (p.low[1] + p.high[1]) / 2, (p.low[2] + p.high[2]) / 2]
      return [{ part: p.part, mesh: p.mesh, cut: false, cell: cellOf(xs, zs, middle) }]
    }
    return remember(cutCache, p.inSpace, grid, () => cutMesh(p.inSpace, xs, zs)).map((piece) => ({ part: p.part, mesh: piece.mesh, cut: true, cell: piece.cell }))
  })
  const halfway = (low[1] + high[1]) / 2
  return { pieces, middle: ([i, j]) => [(xs[i] + xs[i + 1]) / 2, halfway, (zs[j] + zs[j + 1]) / 2] }
}


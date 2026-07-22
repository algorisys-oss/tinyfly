/**
 * Regular-polygon and star geometry. Pure and unit-tested: given a box (the
 * element's width/height) it returns an SVG path `d` in local pixel coordinates,
 * so polygon/star elements reuse the existing PathElement rendering everywhere
 * (DOM/Canvas/SVG/export). Storing the spec on the element lets it regenerate on
 * resize or when the sides/points change.
 */

export type PolyStarKind = 'polygon' | 'star'

export interface PolyStarSpec {
  kind: PolyStarKind
  /** Polygon: number of sides (>= 3). Star: number of points (>= 2). */
  points: number
  /** Star only: inner radius as a fraction of the outer radius (0..1). */
  innerRatio?: number
}

const START_ANGLE = -Math.PI / 2 // first vertex points straight up

/** Vertices of a regular polygon inscribed in the [0,width] x [0,height] box. */
export function polygonVertices(width: number, height: number, sides: number): [number, number][] {
  const n = Math.max(3, Math.round(sides))
  const cx = width / 2
  const cy = height / 2
  const rx = width / 2
  const ry = height / 2
  const verts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = START_ANGLE + (i * 2 * Math.PI) / n
    verts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  return verts
}

/** Vertices of a star (alternating outer/inner radius) inscribed in the box. */
export function starVertices(
  width: number,
  height: number,
  points: number,
  innerRatio = 0.5
): [number, number][] {
  const p = Math.max(2, Math.round(points))
  const ratio = Math.min(1, Math.max(0.05, innerRatio))
  const cx = width / 2
  const cy = height / 2
  const rx = width / 2
  const ry = height / 2
  const verts: [number, number][] = []
  for (let i = 0; i < p * 2; i++) {
    const outer = i % 2 === 0
    const a = START_ANGLE + (i * Math.PI) / p
    const kx = outer ? rx : rx * ratio
    const ky = outer ? ry : ry * ratio
    verts.push([cx + kx * Math.cos(a), cy + ky * Math.sin(a)])
  }
  return verts
}

/** Build a closed SVG path `d` from vertices, rounding to 2 decimals. */
export function verticesToPath(verts: [number, number][]): string {
  if (verts.length === 0) return ''
  const r = (n: number) => Math.round(n * 100) / 100
  const [first, ...rest] = verts
  let d = `M ${r(first[0])} ${r(first[1])}`
  for (const [x, y] of rest) d += ` L ${r(x)} ${r(y)}`
  return d + ' Z'
}

/** SVG path `d` (local coords) for a polygon/star spec filling the given box. */
export function polyStarPath(spec: PolyStarSpec, width: number, height: number): string {
  const verts =
    spec.kind === 'star'
      ? starVertices(width, height, spec.points, spec.innerRatio)
      : polygonVertices(width, height, spec.points)
  return verticesToPath(verts)
}

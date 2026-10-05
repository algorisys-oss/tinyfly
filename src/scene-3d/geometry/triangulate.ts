/**
 * Triangulating flat shapes with holes, by ear clipping: each hole is joined
 * to its outline by a bridge to a vertex it can see, then ears (corners whose
 * triangle holds no other vertex) are cut off one by one. O(n²): meant for
 * logos and letters of a few hundred points, not maps.
 */

export interface Point2 {
  x: number
  y: number
}

/** Twice the signed area: positive for counter-clockwise (y up). */
export function signedArea(points: Point2[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const q = points[(i + 1) % points.length]
    sum += p.x * q.y - q.x * p.y
  }
  return sum
}

/** Whether `point` lies inside `polygon` (even-odd). */
export function pointInPolygon(point: Point2, polygon: Point2[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

const cross = (o: Point2, a: Point2, b: Point2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
const same = (a: Point2, b: Point2) => a.x === b.x && a.y === b.y

function inTriangle(p: Point2, a: Point2, b: Point2, c: Point2): boolean {
  return cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0
}

/**
 * Join a hole (clockwise) into an outline (counter-clockwise): from the
 * hole's rightmost vertex, find an outline vertex it can see to the right,
 * and walk outline → hole → back along a two-way bridge.
 */
function bridge(outline: Point2[], hole: Point2[]): Point2[] {
  let m = 0
  for (let i = 1; i < hole.length; i++) if (hole[i].x > hole[m].x) m = i
  const M = hole[m]
  // The nearest outline edge crossed by a ray from M going right.
  let best = -1
  let bestX = Infinity
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]
    const b = outline[(i + 1) % outline.length]
    if (a.y > M.y === b.y > M.y) continue
    const x = a.x + ((M.y - a.y) * (b.x - a.x)) / (b.y - a.y)
    if (x >= M.x && x < bestX) {
      bestX = x
      best = i
    }
  }
  if (best < 0) return outline
  const a = outline[best]
  const b = outline[(best + 1) % outline.length]
  let pick = a.x > b.x ? best : (best + 1) % outline.length
  const I = { x: bestX, y: M.y }
  // A reflex outline vertex inside the triangle M-I-P would block the view: take the one nearest the ray.
  let bestAngle = Infinity
  for (let i = 0; i < outline.length; i++) {
    const p = outline[i]
    if (i === pick || p.x < M.x) continue
    const P = outline[pick]
    const inside = inTriangle(p, M, I, P) || inTriangle(p, M, P, I)
    if (!inside) continue
    const angle = Math.abs(Math.atan2(p.y - M.y, p.x - M.x))
    if (angle < bestAngle) {
      bestAngle = angle
      pick = i
    }
  }
  const ring = hole.slice(m).concat(hole.slice(0, m))
  return [...outline.slice(0, pick + 1), ...ring, M, outline[pick], ...outline.slice(pick + 1)]
}

/**
 * Triangles covering `outline` minus its `holes`, as index triples into the
 * returned `points` (the outline's and holes' points, in order). Orientation
 * is fixed here: the outline counter-clockwise, holes clockwise, triangles
 * counter-clockwise.
 */
export function triangulate(outline: Point2[], holes: Point2[][] = []): { points: Point2[]; triangles: number[] } {
  const ccw = signedArea(outline) >= 0 ? outline : [...outline].reverse()
  const cwHoles = holes.map((hole) => (signedArea(hole) <= 0 ? hole : [...hole].reverse()))
  const points = [...ccw, ...cwHoles.flat()]
  const indexOf = new Map<Point2, number>()
  points.forEach((p, i) => indexOf.set(p, i))

  // Holes with the rightmost points first, so later bridges see earlier ones.
  const sorted = [...cwHoles].sort((p, q) => Math.max(...q.map((v) => v.x)) - Math.max(...p.map((v) => v.x)))
  let polygon = ccw
  for (const hole of sorted) polygon = bridge(polygon, hole)

  const ring = polygon.map((p) => indexOf.get(p)!)
  const triangles: number[] = []
  let guard = ring.length * ring.length
  while (ring.length > 3 && guard-- > 0) {
    let clipped = false
    for (let i = 0; i < ring.length; i++) {
      const ia = ring[(i + ring.length - 1) % ring.length]
      const ib = ring[i]
      const ic = ring[(i + 1) % ring.length]
      const [a, b, c] = [points[ia], points[ib], points[ic]]
      if (cross(a, b, c) <= 0) continue // reflex or flat: not an ear
      let blocked = false
      for (const j of ring) {
        const p = points[j]
        if (j === ia || j === ib || j === ic || same(p, a) || same(p, b) || same(p, c)) continue
        if (inTriangle(p, a, b, c)) {
          blocked = true
          break
        }
      }
      if (blocked) continue
      triangles.push(ia, ib, ic)
      ring.splice(i, 1)
      clipped = true
      break
    }
    // A degenerate ring (overlapping points) has no ear: cut a corner anyway rather than loop.
    if (!clipped) {
      triangles.push(ring[ring.length - 1], ring[0], ring[1])
      ring.splice(0, 1)
    }
  }
  if (ring.length === 3) triangles.push(ring[0], ring[1], ring[2])
  return { points, triangles }
}

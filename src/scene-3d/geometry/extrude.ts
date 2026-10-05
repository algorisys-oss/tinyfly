import { parsePath } from '../../engine/path/path-utils'
import { MeshBuilder, type Mesh } from './mesh'
import { pointInPolygon, signedArea, triangulate, type Point2 } from './triangulate'

/**
 * An SVG path made solid: its shape as front and back faces, `depth` apart,
 * joined by walls. Any tinyfly path (a logo, a letter, a star) becomes a 3D
 * object. Subpaths inside others are holes (an "o", a ring), outlines inside
 * holes are islands again.
 *
 * SVG's y points down, 3D's up: the shape is flipped, centred on the origin
 * and scaled so it is `width` metres wide (default 1).
 */
export interface ExtrudeOptions {
  depth: number
  width?: number
  /** Points per curve (default 12) */
  curveSegments?: number
}

/** The path's outlines as polygons, curves sampled, y flipped. */
function pathContours(d: string, curveSegments: number): Point2[][] {
  const contours = new Map<number, Point2[]>()
  for (const segment of parsePath(d).segments) {
    if (!contours.has(segment.subpath)) contours.set(segment.subpath, [{ x: segment.startX, y: -segment.startY }])
    const points = contours.get(segment.subpath)!
    if (segment.type === 'L') {
      points.push({ x: segment.endX, y: -segment.endY })
    } else {
      const [c1x, c1y, c2x, c2y, ex, ey] = segment.points
      for (let i = 1; i <= curveSegments; i++) {
        const t = i / curveSegments
        const u = 1 - t
        const x = u * u * u * segment.startX + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex
        const y = u * u * u * segment.startY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey
        points.push({ x, y: -y })
      }
    }
  }
  // Drop repeated points (a closing segment ends where it began).
  return [...contours.values()]
    .map((points) => points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y))
    .map((points) => (points.length > 1 && points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y ? points.slice(0, -1) : points))
    .filter((points) => points.length >= 3 && Math.abs(signedArea(points)) > 1e-12)
}

export function extrudeMesh(d: string, options: ExtrudeOptions): Mesh {
  const contours = pathContours(d, Math.max(1, Math.round(options.curveSegments ?? 12)))
  const m = new MeshBuilder()
  if (contours.length === 0) return m.build()

  // Centre on the origin and scale to the width asked for.
  const all = contours.flat()
  const minX = Math.min(...all.map((p) => p.x))
  const maxX = Math.max(...all.map((p) => p.x))
  const minY = Math.min(...all.map((p) => p.y))
  const maxY = Math.max(...all.map((p) => p.y))
  const scale = (options.width ?? 1) / Math.max(maxX - minX, 1e-9)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const shapes = contours.map((points) => points.map((p) => ({ x: (p.x - cx) * scale, y: (p.y - cy) * scale })))

  // Nesting: how many outlines hold this one. Even: a solid outline; odd: a hole in its parent.
  const depthOf = shapes.map((shape, i) => shapes.filter((other, j) => j !== i && pointInPolygon(shape[0], other)).length)
  const front = options.depth / 2
  const back = -options.depth / 2

  shapes.forEach((shape, i) => {
    if (depthOf[i] % 2 === 1) return
    const holes = shapes.filter((hole, j) => depthOf[j] === depthOf[i] + 1 && pointInPolygon(hole[0], shape))
    const { points, triangles } = triangulate(shape, holes)
    // Front face (+z) as triangulated; the back (-z) wound the other way.
    const frontIds = points.map((p) => m.vertex(p.x, p.y, front, 0, 0, 1))
    const backIds = points.map((p) => m.vertex(p.x, p.y, back, 0, 0, -1))
    for (let t = 0; t < triangles.length; t += 3) {
      m.triangle(frontIds[triangles[t]], frontIds[triangles[t + 1]], frontIds[triangles[t + 2]])
      m.triangle(backIds[triangles[t]], backIds[triangles[t + 2]], backIds[triangles[t + 1]])
    }
    // Walls: the outline counter-clockwise and holes clockwise keep the solid on the left, so out is to the right.
    for (const ring of [signedArea(shape) >= 0 ? shape : [...shape].reverse(), ...holes.map((h) => (signedArea(h) <= 0 ? h : [...h].reverse()))]) {
      for (let k = 0; k < ring.length; k++) {
        const p = ring[k]
        const q = ring[(k + 1) % ring.length]
        const nx = q.y - p.y
        const ny = -(q.x - p.x)
        const a = m.vertex(p.x, p.y, back, nx, ny, 0)
        const b = m.vertex(q.x, q.y, back, nx, ny, 0)
        const c = m.vertex(q.x, q.y, front, nx, ny, 0)
        const e = m.vertex(p.x, p.y, front, nx, ny, 0)
        m.quad(a, b, c, e)
      }
    }
  })
  return m.build()
}

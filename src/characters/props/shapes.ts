import type { Vec3 } from '../../engine/math'

/**
 * The shapes props are built from, as small meshes: corners, and faces that
 * list corners with an outward normal. A face is seen when its normal points
 * at the viewer; an outline is drawn along an edge between a seen face and an
 * unseen one (the silhouette) or between two seen faces that meet at an angle
 * (a crease), so curved surfaces read smooth and corners read sharp.
 *
 * Prop space: +y up (the ground is y = 0), +z the way the prop faces (its
 * front), +x its left. Units are metres, so props and characters share a
 * scale; a prop target draws them at so many px per metre.
 */

/** A shape, in the prop part's own space. */
export type PropShape =
  /** A box centred on its origin */
  | { type: 'box'; size: Vec3 }
  /** A cylinder centred on its origin along an axis: wheels, discs, drums. `spokes` draws lines on its ends that turn with it */
  | { type: 'cylinder'; radius: number; length: number; axis?: 'x' | 'y' | 'z'; segments?: number; spokes?: number }
  /** An ellipsoid (a sphere when the radii match), centred on its origin */
  | { type: 'ellipsoid'; radii: Vec3; segments?: number }
  /**
   * A side profile made solid across x: points are (forward, up) pairs going
   * round the outline, and the shape is `width` wide, centred on x = 0. Car
   * bodies, house fronts, fuselages.
   */
  | { type: 'extrude'; profile: Array<[number, number]>; width: number }
  /**
   * A flat one-sided panel facing one way, drawn only from that side: windows,
   * doors, lights. Points are 2D in the panel's plane (see `facing`).
   */
  | { type: 'panel'; points: Array<[number, number]>; facing: 'left' | 'right' | 'front' | 'back' | 'up' }
  /**
   * A round tube through points: stems, branches, frames, skids, legs. A
   * radius per point tapers it. `joined` leaves its end rings unoutlined, for
   * a tube that continues into another (a segment of a bending tail)
   */
  | { type: 'tube'; points: Vec3[]; radius: number | number[]; segments?: number; joined?: boolean }

export interface Mesh {
  vertices: Vec3[]
  faces: Array<{ corners: number[]; normal: Vec3 }>
  /** Lines drawn on the shape that move with it (a wheel's spokes), as vertex index pairs */
  marks?: Array<[number, number]>
  /** Smooth surfaces only show silhouette edges; faceted ones show creases too (default true) */
  creases?: boolean
  /** Its open edges are joins to another shape, not outlines (a tube segment of a bending tail) */
  joined?: boolean
  /** A piece cut from a bigger shape: the column walls (x and z planes) it was cut at, whose edges are not outlines */
  walls?: { x: number[]; z: number[] }
}

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1
  return [x / length, y / length, z / length]
}

export function boxMesh([w, h, d]: Vec3): Mesh {
  const [x, y, z] = [w / 2, h / 2, d / 2]
  const vertices: Vec3[] = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ]
  return {
    vertices,
    faces: [
      { corners: [4, 5, 6, 7], normal: [0, 0, 1] },
      { corners: [1, 0, 3, 2], normal: [0, 0, -1] },
      { corners: [5, 1, 2, 6], normal: [1, 0, 0] },
      { corners: [0, 4, 7, 3], normal: [-1, 0, 0] },
      { corners: [7, 6, 2, 3], normal: [0, 1, 0] },
      { corners: [0, 1, 5, 4], normal: [0, -1, 0] },
    ],
  }
}

/** Swap axes so a shape built along z lies along `axis`. */
const along = (axis: 'x' | 'y' | 'z', [a, b, c]: Vec3): Vec3 => (axis === 'z' ? [a, b, c] : axis === 'x' ? [c, b, a] : [a, c, b])

export function cylinderMesh(radius: number, length: number, axis: 'x' | 'y' | 'z' = 'x', segments = 20, spokes = 0): Mesh {
  const vertices: Vec3[] = []
  const half = length / 2
  for (const end of [-half, half]) {
    for (let i = 0; i < segments; i++) {
      const a = (Math.PI * 2 * i) / segments
      vertices.push(along(axis, [Math.cos(a) * radius, Math.sin(a) * radius, end]))
    }
  }
  const faces: Mesh['faces'] = [
    { corners: Array.from({ length: segments }, (_, i) => segments - 1 - i), normal: along(axis, [0, 0, -1]) },
    { corners: Array.from({ length: segments }, (_, i) => segments + i), normal: along(axis, [0, 0, 1]) },
  ]
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments
    const a = (Math.PI * 2 * (i + 0.5)) / segments
    faces.push({ corners: [i, j, segments + j, segments + i], normal: along(axis, [Math.cos(a), Math.sin(a), 0]) })
  }
  // Spokes: lines from the middle of each end out, which show the shape turning.
  const marks: Array<[number, number]> = []
  if (spokes > 0) {
    for (const end of [-half, half]) {
      const middle = vertices.push(along(axis, [0, 0, end * 1.01])) - 1
      for (let k = 0; k < spokes; k++) {
        const a = (Math.PI * 2 * k) / spokes
        const tip = vertices.push(along(axis, [Math.cos(a) * radius * 0.82, Math.sin(a) * radius * 0.82, end * 1.01])) - 1
        marks.push([middle, tip])
      }
    }
  }
  return { vertices, faces, marks, creases: true }
}

export function ellipsoidMesh([rx, ry, rz]: Vec3, segments = 16): Mesh {
  const rings = Math.max(4, Math.round(segments / 2))
  const vertices: Vec3[] = [[0, ry, 0]]
  for (let ring = 1; ring < rings; ring++) {
    const polar = (Math.PI * ring) / rings
    for (let i = 0; i < segments; i++) {
      const a = (Math.PI * 2 * i) / segments
      vertices.push([Math.sin(polar) * Math.cos(a) * rx, Math.cos(polar) * ry, Math.sin(polar) * Math.sin(a) * rz])
    }
  }
  const bottom = vertices.push([0, -ry, 0]) - 1
  const at = (ring: number, i: number) => 1 + (ring - 1) * segments + (i % segments)
  const normalAt = (corners: number[]): Vec3 => {
    const c = corners.reduce<Vec3>((sum, index) => [sum[0] + vertices[index][0], sum[1] + vertices[index][1], sum[2] + vertices[index][2]], [0, 0, 0])
    return normalize([c[0] / (rx * rx), c[1] / (ry * ry), c[2] / (rz * rz)])
  }
  const faces: Mesh['faces'] = []
  for (let i = 0; i < segments; i++) {
    const top = [0, at(1, i + 1), at(1, i)]
    faces.push({ corners: top, normal: normalAt(top) })
    for (let ring = 1; ring < rings - 1; ring++) {
      const quad = [at(ring, i), at(ring, i + 1), at(ring + 1, i + 1), at(ring + 1, i)]
      faces.push({ corners: quad, normal: normalAt(quad) })
    }
    const end = [at(rings - 1, i), at(rings - 1, i + 1), bottom]
    faces.push({ corners: end, normal: normalAt(end) })
  }
  return { vertices, faces, creases: false }
}

/** Signed area of a profile in (forward, up): positive when it runs anticlockwise. */
const signedArea = (points: Array<[number, number]>) =>
  points.reduce((sum, [u, v], i) => {
    const [u2, v2] = points[(i + 1) % points.length]
    return sum + u * v2 - u2 * v
  }, 0) / 2

export function extrudeMesh(profile: Array<[number, number]>, width: number): Mesh {
  // Run the outline anticlockwise (seen from the prop's left, +x), so edge normals point out.
  const points = signedArea(profile) < 0 ? [...profile].reverse() : profile
  const n = points.length
  const half = width / 2
  const vertices: Vec3[] = [...points.map(([u, v]): Vec3 => [half, v, u]), ...points.map(([u, v]): Vec3 => [-half, v, u])]
  const faces: Mesh['faces'] = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: n }, (_, i) => n - 1 - i), normal: [1, 0, 0] },
    { corners: Array.from({ length: n }, (_, i) => n + i), normal: [-1, 0, 0] },
  ]
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const [du, dv] = [points[j][0] - points[i][0], points[j][1] - points[i][1]]
    faces.push({ corners: [i, j, n + j, n + i], normal: normalize([0, -du, dv]) })
  }
  return { vertices, faces, creases: true }
}

export function panelMesh(points: Array<[number, number]>, facing: 'left' | 'right' | 'front' | 'back' | 'up'): Mesh {
  const place: Record<typeof facing, (p: [number, number]) => Vec3> = {
    left: ([u, v]) => [0, v, u],
    right: ([u, v]) => [0, v, u],
    front: ([u, v]) => [u, v, 0],
    back: ([u, v]) => [u, v, 0],
    up: ([u, v]) => [u, 0, v],
  }
  const normal: Record<typeof facing, Vec3> = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] }
  return { vertices: points.map(place[facing]), faces: [{ corners: points.map((_, i) => i), normal: normal[facing] }] }
}

export function tubeMesh(path: Vec3[], radius: number | number[], segments = 8): Mesh {
  const radiusAt = (k: number) => (Array.isArray(radius) ? radius[Math.min(k, radius.length - 1)] : radius)
  const vertices: Vec3[] = []
  const faces: Mesh['faces'] = []
  path.forEach((point, k) => {
    const next = path[Math.min(k + 1, path.length - 1)]
    const previous = path[Math.max(k - 1, 0)]
    const direction = normalize([next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]])
    // Two directions across the tube.
    const helper: Vec3 = Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const side = normalize(cross(direction, helper))
    const up = cross(side, direction)
    for (let i = 0; i < segments; i++) {
      const a = (Math.PI * 2 * i) / segments
      const c = Math.cos(a) * radiusAt(k)
      const s = Math.sin(a) * radiusAt(k)
      vertices.push([point[0] + side[0] * c + up[0] * s, point[1] + side[1] * c + up[1] * s, point[2] + side[2] * c + up[2] * s])
    }
  })
  for (let k = 0; k < path.length - 1; k++) {
    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % segments
      const corners = [k * segments + i, k * segments + j, (k + 1) * segments + j, (k + 1) * segments + i]
      const middle = corners.reduce<Vec3>((sum, index) => [sum[0] + vertices[index][0] / 4, sum[1] + vertices[index][1] / 4, sum[2] + vertices[index][2] / 4], [0, 0, 0])
      const axis: Vec3 = [(path[k][0] + path[k + 1][0]) / 2, (path[k][1] + path[k + 1][1]) / 2, (path[k][2] + path[k + 1][2]) / 2]
      faces.push({ corners, normal: normalize([middle[0] - axis[0], middle[1] - axis[1], middle[2] - axis[2]]) })
    }
  }
  return { vertices, faces, creases: false }
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/** A shape's mesh. */
export function shapeMesh(shape: PropShape): Mesh {
  switch (shape.type) {
    case 'box':
      return boxMesh(shape.size)
    case 'cylinder':
      return cylinderMesh(shape.radius, shape.length, shape.axis, shape.segments, shape.spokes)
    case 'ellipsoid':
      return ellipsoidMesh(shape.radii, shape.segments)
    case 'extrude':
      return extrudeMesh(shape.profile, shape.width)
    case 'panel':
      return panelMesh(shape.points, shape.facing)
    case 'tube':
      return { ...tubeMesh(shape.points, shape.radius, shape.segments), joined: shape.joined }
  }
}

/**
 * A smooth curve through points (Catmull-Rom), as `count` points evenly
 * spread along it: a tail's line from a few points of its shape.
 */
export function smoothPath(points: Vec3[], count: number): Vec3[] {
  if (points.length < 2) return points
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]
  const sample = (t: number): Vec3 => {
    const scaled = t * (points.length - 1)
    const i = Math.min(points.length - 2, Math.floor(scaled))
    const u = scaled - i
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    return [0, 1, 2].map((k) => {
      const a = p0[k], b = p1[k], c = p2[k], d = p3[k]
      return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u)
    }) as Vec3
  }
  return Array.from({ length: count }, (_, i) => sample(i / (count - 1)))
}

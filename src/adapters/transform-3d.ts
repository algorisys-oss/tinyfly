import { mat4, quat, type Mat4, type Quat, type Vec3 } from '../engine/math'

/**
 * CSS-style 3D transforms for flat targets (Canvas and WebGL), as pure functions.
 *
 * A target's transform is the same 4×4 matrix CSS builds from its transform
 * list, about the target's pivot (its transform-origin):
 *
 *   pivot · perspective · translate(x, y, z) · rotate · rotateX · rotateY ·
 *   quaternion · scale · skew · pivot⁻¹
 *
 * the order the DOM and SVG adapters write the functions in, so a target
 * lands on the same pixels in all three. Without perspective the matrix keeps
 * flat things flat, and its x / y part is an ordinary 2D canvas transform
 * (exact). With perspective, the target is drawn through a mesh of small
 * triangles, each a 2D transform of its own (see `perspectiveMesh`).
 */

export interface Transform3DValues {
  z?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  /** `[x, y, z, w]`; a track with `interpolation: 'slerp'` */
  quaternion?: number[]
  scale?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  /** Distance from the viewer, px (CSS `perspective()`); none means no foreshortening */
  perspective?: number
}

export interface Point {
  x: number
  y: number
}

const DEG = Math.PI / 180

/**
 * A quaternion as a CSS `matrix3d()`: its rotation matrix, column-major as CSS
 * reads it (null for anything that is not 4 numbers). The DOM and SVG adapters
 * write a `quaternion` value with it.
 */
export function quaternionCss(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 4) return null
  const matrix = mat4.fromQuat(quat.normalize(value as Quat))
  // Six decimals: exact enough for any screen, and no 1e-17 noise in the style.
  return `matrix3d(${matrix.map((n) => Math.round(n * 1e6) / 1e6 + 0).join(', ')})`
}

/** Whether a target needs the 3D path: anything with depth, a 3D turn or perspective. */
export function has3dTransform(t: Transform3DValues): boolean {
  return (
    t.z !== undefined ||
    t.rotateX !== undefined ||
    t.rotateY !== undefined ||
    t.perspective !== undefined ||
    (Array.isArray(t.quaternion) && t.quaternion.length === 4)
  )
}

/** CSS `perspective(d)`: things nearer the viewer (+z) grow. */
function perspectiveMatrix(distance: number): Mat4 {
  const m = mat4.identity()
  if (distance > 0) m[11] = -1 / distance
  return m
}

function skewMatrix(skewX: number, skewY: number): Mat4 {
  const m = mat4.identity()
  m[4] = Math.tan(skewX * DEG)
  m[1] = Math.tan(skewY * DEG)
  return m
}

const turn = (axis: Vec3, degrees: number | undefined) => (degrees ? mat4.fromQuat(quat.fromAxisAngle(axis, degrees)) : null)

/**
 * The target's whole transform: `offset` is its animated x / y, `pivot` its
 * transform-origin, both in canvas coordinates. `scale` wins over
 * `scaleX` / `scaleY`, as in the 2D canvas transform.
 */
export function elementMatrix(t: Transform3DValues, offset: Point, pivot: Point): Mat4 {
  const parts: Array<Mat4 | null> = [
    mat4.translation([pivot.x, pivot.y, 0]),
    t.perspective !== undefined ? perspectiveMatrix(t.perspective) : null,
    mat4.translation([offset.x, offset.y, t.z ?? 0]),
    turn([0, 0, 1], t.rotate),
    turn([1, 0, 0], t.rotateX),
    turn([0, 1, 0], t.rotateY),
    Array.isArray(t.quaternion) && t.quaternion.length === 4 ? mat4.fromQuat(quat.normalize(t.quaternion as Quat)) : null,
    t.scale !== undefined ? mat4.scaling([t.scale, t.scale, 1]) : mat4.scaling([t.scaleX ?? 1, t.scaleY ?? 1, 1]),
    t.skewX !== undefined || t.skewY !== undefined ? skewMatrix(t.skewX ?? 0, t.skewY ?? 0) : null,
    mat4.translation([-pivot.x, -pivot.y, 0]),
  ]
  return parts.reduce<Mat4>((m, part) => (part ? mat4.multiply(m, part) : m), mat4.identity())
}

/** No perspective: flat stays flat, and the x / y part is an exact 2D transform. */
export function isAffine(m: Mat4): boolean {
  return m[3] === 0 && m[7] === 0 && m[11] === 0 && m[15] === 1
}

/** The 2D canvas transform `[a, b, c, d, e, f]` of an affine matrix (its x / y part). */
export function affinePart(m: Mat4): [number, number, number, number, number, number] {
  return [m[0], m[1], m[4], m[5], m[12], m[13]]
}

/**
 * Whether the target shows its back, as CSS decides it for
 * `backface-visibility: hidden`: its front normal, carried through the
 * transform, points away from the viewer. A mirror (`scaleX: -1`) is not a
 * back.
 */
export function isBackFacing(m: Mat4): boolean {
  const inverse = mat4.invert(m)
  return inverse !== null && inverse[10] < 0
}

/** Where a point of the target's plane lands on the canvas; null behind the viewer. */
export function projectPoint(m: Mat4, x: number, y: number): Point | null {
  const w = m[3] * x + m[7] * y + m[15]
  if (w <= 1e-6) return null
  return { x: (m[0] * x + m[4] * y + m[12]) / w, y: (m[1] * x + m[5] * y + m[13]) / w }
}

/**
 * The 2D transform `[a, b, c, d, e, f]` that carries triangle `from` onto
 * triangle `to` (null when `from` is degenerate).
 */
export function triangleTransform(from: [Point, Point, Point], to: [Point, Point, Point]): [number, number, number, number, number, number] | null {
  const [s0, s1, s2] = from
  const [d0, d1, d2] = to
  const sx1 = s1.x - s0.x
  const sy1 = s1.y - s0.y
  const sx2 = s2.x - s0.x
  const sy2 = s2.y - s0.y
  const det = sx1 * sy2 - sx2 * sy1
  if (Math.abs(det) < 1e-9) return null
  const dx1 = d1.x - d0.x
  const dy1 = d1.y - d0.y
  const dx2 = d2.x - d0.x
  const dy2 = d2.y - d0.y
  const a = (dx1 * sy2 - dx2 * sy1) / det
  const b = (dy1 * sy2 - dy2 * sy1) / det
  const c = (dx2 * sx1 - dx1 * sx2) / det
  const d = (dy2 * sx1 - dy1 * sx2) / det
  return [a, b, c, d, d0.x - a * s0.x - c * s0.y, d0.y - b * s0.x - d * s0.y]
}

export interface MeshTriangle {
  /** In the target's own plane (canvas coordinates before the transform) */
  source: [Point, Point, Point]
  /** On the canvas, after the transform */
  target: [Point, Point, Point]
}

/** Cells per side of a perspective mesh: finer for bigger and more slanted targets. */
export function meshDivisions(m: Mat4, bounds: { x: number; y: number; width: number; height: number }): number {
  const corners = [
    projectPoint(m, bounds.x, bounds.y),
    projectPoint(m, bounds.x + bounds.width, bounds.y),
    projectPoint(m, bounds.x, bounds.y + bounds.height),
    projectPoint(m, bounds.x + bounds.width, bounds.y + bounds.height),
  ]
  if (corners.some((c) => c === null)) return 16
  const [a, b, c, d] = corners as Point[]
  const size = Math.max(Math.hypot(d.x - a.x, d.y - a.y), Math.hypot(c.x - b.x, c.y - b.y))
  return Math.min(16, Math.max(2, Math.round(size / 40)))
}

/**
 * The target's bounds cut into a grid of triangles, each with where it lands.
 * Close enough to the true (curved-in-texture) perspective that a 40 px cell
 * is off by well under a pixel. Triangles with a corner behind the viewer are
 * left out.
 */
export function perspectiveMesh(m: Mat4, bounds: { x: number; y: number; width: number; height: number }, divisions = meshDivisions(m, bounds)): MeshTriangle[] {
  const n = Math.max(1, Math.round(divisions))
  const grid: Array<Array<{ source: Point; target: Point | null }>> = []
  for (let row = 0; row <= n; row++) {
    const line: Array<{ source: Point; target: Point | null }> = []
    for (let col = 0; col <= n; col++) {
      const source = { x: bounds.x + (bounds.width * col) / n, y: bounds.y + (bounds.height * row) / n }
      line.push({ source, target: projectPoint(m, source.x, source.y) })
    }
    grid.push(line)
  }
  const triangles: MeshTriangle[] = []
  const add = (p: (typeof grid)[0][0], q: (typeof grid)[0][0], r: (typeof grid)[0][0]) => {
    if (p.target && q.target && r.target) triangles.push({ source: [p.source, q.source, r.source], target: [p.target, q.target, r.target] })
  }
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const tl = grid[row][col]
      const tr = grid[row][col + 1]
      const bl = grid[row + 1][col]
      const br = grid[row + 1][col + 1]
      add(tl, tr, br)
      add(tl, br, bl)
    }
  }
  return triangles
}

/**
 * A triangle with each edge pushed outward by `amount` px, so neighbouring
 * clipped triangles overlap a little and no anti-aliased seam shows between
 * them. Each corner moves along its bisector, as far as keeps both of its
 * edges `amount` out (capped, so needle-thin corners do not shoot off).
 */
export function growTriangle(points: [Point, Point, Point], amount: number): [Point, Point, Point] {
  // Winding sign, so "outward" is the same side for every triangle.
  const [a, b, c] = points
  const sign = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) >= 0 ? 1 : -1
  const outward = (p: Point, q: Point) => {
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    return { x: (sign * dy) / len, y: (-sign * dx) / len }
  }
  return points.map((p, i) => {
    const prev = points[(i + 2) % 3]
    const next = points[(i + 1) % 3]
    const n1 = outward(prev, p)
    const n2 = outward(p, next)
    // The corner moves by amount / cos(half the turn between the two normals).
    const bx = n1.x + n2.x
    const by = n1.y + n2.y
    const half = Math.hypot(bx, by) / 2 || 1
    const reach = Math.min(amount / half, amount * 4)
    const len = Math.hypot(bx, by) || 1
    return { x: p.x + (bx / len) * reach, y: p.y + (by / len) * reach }
  }) as [Point, Point, Point]
}

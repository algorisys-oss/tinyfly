import { describe, it, expect } from 'vitest'
import { triangulate, signedArea, type Point2 } from './triangulate'
import { extrudeMesh } from './extrude'
import { meshEdges, type Mesh } from './mesh'

const area = (points: Point2[], triangles: number[]) => {
  let sum = 0
  for (let i = 0; i < triangles.length; i += 3) {
    const [a, b, c] = [points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]]]
    sum += ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2
  }
  return sum
}
const square = (x: number, y: number, s: number): Point2[] => [
  { x, y },
  { x: x + s, y },
  { x: x + s, y: y + s },
  { x, y: y + s },
]

describe('triangulate', () => {
  it('covers a square, a concave L and a star with counter-clockwise triangles', () => {
    for (const [shape, expected] of [
      [square(0, 0, 2), 4],
      [[{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 0, y: 3 }], 5],
    ] as Array<[Point2[], number]>) {
      const { points, triangles } = triangulate(shape)
      expect(triangles.length / 3).toBe(shape.length - 2)
      expect(area(points, triangles)).toBeCloseTo(expected, 9)
    }
    const star = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 2 : 0.8
      const a = (i / 10) * Math.PI * 2
      return { x: r * Math.cos(a), y: r * Math.sin(a) }
    })
    const { points, triangles } = triangulate([...star].reverse()) // clockwise in: still covered, counter-clockwise out
    expect(area(points, triangles)).toBeCloseTo(Math.abs(signedArea(star)) / 2, 9)
  })

  it('cuts holes: a frame is the square minus the hole', () => {
    const { points, triangles } = triangulate(square(0, 0, 4), [square(1, 1, 2)])
    expect(area(points, triangles)).toBeCloseTo(16 - 4, 9)
    const two = triangulate(square(0, 0, 6), [square(1, 1, 1), square(4, 4, 1)])
    expect(area(two.points, two.triangles)).toBeCloseTo(36 - 2, 9)
  })
})

const faceNormal = (m: Mesh, f: number) => {
  const at = (i: number) => [m.positions[i * 3], m.positions[i * 3 + 1], m.positions[i * 3 + 2]]
  const [a, b, c] = [0, 1, 2].map((k) => at(m.indices[f * 3 + k]))
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
}

describe('extrudeMesh', () => {
  /** A ring: an outer circle and a hole, drawn with curves (like an "o"). */
  const ring = 'M 0 -50 C 28 -50 50 -28 50 0 C 50 28 28 50 0 50 C -28 50 -50 28 -50 0 C -50 -28 -28 -50 0 -50 Z ' +
    'M 0 -25 C -14 -25 -25 -14 -25 0 C -25 14 -14 25 0 25 C 14 25 25 14 25 0 C 25 -14 14 -25 0 -25 Z'

  for (const [name, d] of [
    ['a square', 'M 0 0 L 100 0 L 100 100 L 0 100 Z'],
    ['a star', 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z'],
    ['a ring with a hole', ring],
  ]) {
    it(`${name}: a closed solid with outward faces`, () => {
      const mesh = extrudeMesh(d, { depth: 0.2, width: 1 })
      expect(meshEdges(mesh).every((edge) => edge.faces.length === 2)).toBe(true)
      for (let f = 0; f < mesh.indices.length / 3; f++) {
        const n = faceNormal(mesh, f)
        expect(Math.hypot(...n), `${name} face ${f} is not degenerate`).toBeGreaterThan(0)
      }
      // Front faces point +z, back faces -z.
      const zs = Array.from({ length: mesh.indices.length / 3 }, (_, f) => faceNormal(mesh, f)[2])
      expect(zs.some((z) => z > 0) && zs.some((z) => z < 0)).toBe(true)
    })
  }

  it('is scaled to its width, centred, flipped to y up, and as deep as asked', () => {
    const mesh = extrudeMesh('M 0 0 L 200 0 L 200 100 L 0 100 Z', { depth: 0.5, width: 2 })
    const xs = mesh.positions.filter((_, i) => i % 3 === 0)
    const ys = mesh.positions.filter((_, i) => i % 3 === 1)
    const zs = mesh.positions.filter((_, i) => i % 3 === 2)
    expect(Math.min(...xs)).toBeCloseTo(-1, 9)
    expect(Math.max(...xs)).toBeCloseTo(1, 9)
    expect(Math.max(...ys)).toBeCloseTo(0.5, 9)
    expect(Math.min(...zs)).toBeCloseTo(-0.25, 9)
    expect(Math.max(...zs)).toBeCloseTo(0.25, 9)
    // A triangle whose top is up in SVG (small y) points up in 3D.
    const up = extrudeMesh('M 50 0 L 100 100 L 0 100 Z', { depth: 0.1 })
    const apex = Math.max(...up.positions.filter((_, i) => i % 3 === 1))
    expect(up.positions.some((v, i) => i % 3 === 1 && v === apex && Math.abs(up.positions[i - 1]) < 1e-9)).toBe(true)
  })

  it('the front face of a ring has the hole cut out', () => {
    const mesh = extrudeMesh(ring, { depth: 0.2, width: 1, curveSegments: 16 })
    let front = 0
    for (let f = 0; f < mesh.indices.length / 3; f++) {
      const n = faceNormal(mesh, f)
      if (n[2] > 0 && Math.abs(n[0]) < 1e-9 && Math.abs(n[1]) < 1e-9) front += n[2] / 2
    }
    // The ring's area at width 1: π (0.5² − 0.25²), within the curves' sampling.
    expect(front).toBeCloseTo(Math.PI * (0.25 - 0.0625), 1)
  })
})

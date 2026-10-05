import { describe, it, expect } from 'vitest'
import { boxMesh, coneMesh, cylinderMesh, geometryMesh, planeMesh, sphereMesh, torusMesh } from './primitives'
import { meshEdges, type Mesh } from './mesh'

const at = (m: Mesh, i: number) => [m.positions[i * 3], m.positions[i * 3 + 1], m.positions[i * 3 + 2]]
const faceNormal = (m: Mesh, f: number) => {
  const [a, b, c] = [0, 1, 2].map((k) => at(m, m.indices[f * 3 + k]))
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
}
const centroid = (m: Mesh, f: number) => {
  const pts = [0, 1, 2].map((k) => at(m, m.indices[f * 3 + k]))
  return [0, 1, 2].map((k) => (pts[0][k] + pts[1][k] + pts[2][k]) / 3)
}

const closed: Array<[string, Mesh]> = [
  ['box', boxMesh([1, 2, 3])],
  ['sphere', sphereMesh(1, 12)],
  ['cylinder', cylinderMesh(1, 2, 12)],
  ['cone', coneMesh(1, 2, 12)],
  ['torus', torusMesh(2, 0.5, 12)],
]

describe('primitives', () => {
  for (const [name, mesh] of closed) {
    it(`${name}: closed, every edge shared by two faces`, () => {
      expect(meshEdges(mesh).every((edge) => edge.faces.length === 2)).toBe(true)
    })

    it(`${name}: unit normals, and faces wind outward`, () => {
      for (let i = 0; i < mesh.normals.length; i += 3) expect(Math.hypot(mesh.normals[i], mesh.normals[i + 1], mesh.normals[i + 2])).toBeCloseTo(1, 9)
      for (let f = 0; f < mesh.indices.length / 3; f++) {
        const n = faceNormal(mesh, f)
        const c = centroid(mesh, f)
        // Outward: away from the centre (for the torus, from the ring's middle line).
        const out = name === 'torus' ? (() => { const r = Math.hypot(c[0], c[2]); return [c[0] - (2 * c[0]) / r, c[1], c[2] - (2 * c[2]) / r] })() : c
        expect(n[0] * out[0] + n[1] * out[1] + n[2] * out[2], `${name} face ${f}`).toBeGreaterThan(0)
      }
    })
  }

  it('a box has 12 triangles and 18 edges (12 sides, 6 diagonals)', () => {
    const box = boxMesh([1, 1, 1])
    expect(box.indices.length / 3).toBe(12)
    expect(meshEdges(box)).toHaveLength(18)
  })

  it('a plane is a floor facing up, with an open rim', () => {
    const plane = planeMesh([4, 2])
    expect(faceNormal(plane, 0)[1]).toBeGreaterThan(0)
    expect(meshEdges(plane).filter((edge) => edge.faces.length === 1)).toHaveLength(4)
  })

  it('builds from a geometry description', () => {
    expect(geometryMesh({ type: 'sphere', radius: 2 }).positions.length).toBeGreaterThan(0)
    expect(geometryMesh({ type: 'box', size: [1, 1, 1] }).indices.length).toBe(36)
  })
})

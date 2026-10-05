/**
 * A triangle mesh as plain arrays: vertex positions and normals (flat x, y, z
 * runs) and triangles as vertex index triples. Triangles wind
 * counter-clockwise seen from outside, so `(b - a) × (c - a)` points out.
 */
export interface Mesh {
  positions: number[]
  /** Per vertex, unit length: what smooth (lambert) shading reads */
  normals: number[]
  indices: number[]
}

/** A mesh edge: two vertex indices and the one or two triangles that share it. */
export interface MeshEdge {
  a: number
  b: number
  faces: number[]
}

/** Builds a mesh one vertex and one triangle at a time. */
export class MeshBuilder {
  readonly positions: number[] = []
  readonly normals: number[] = []
  readonly indices: number[] = []

  /** Add a vertex; returns its index. */
  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number): number {
    const length = Math.hypot(nx, ny, nz) || 1
    this.positions.push(x, y, z)
    this.normals.push(nx / length, ny / length, nz / length)
    return this.positions.length / 3 - 1
  }

  /** Add a triangle, counter-clockwise seen from its front. */
  triangle(a: number, b: number, c: number): void {
    this.indices.push(a, b, c)
  }

  /** Add a quad a-b-c-d (counter-clockwise) as two triangles. */
  quad(a: number, b: number, c: number, d: number): void {
    this.indices.push(a, b, c, a, c, d)
  }

  build(): Mesh {
    return { positions: this.positions, normals: this.normals, indices: this.indices }
  }
}

/**
 * The mesh's edges, with the triangles on each side. Vertices at the same
 * position count as one (a box's corners are split for hard normals, but its
 * edges are still shared), so outlines can find silhouettes and creases.
 */
export function meshEdges(mesh: Mesh): MeshEdge[] {
  // Weld by position, rounded so float noise does not split a corner.
  const weld = new Map<string, number>()
  const canonical: number[] = []
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    const key = [0, 1, 2].map((k) => Math.round(mesh.positions[i * 3 + k] * 1e6)).join(',')
    if (!weld.has(key)) weld.set(key, i)
    canonical.push(weld.get(key)!)
  }
  const edges = new Map<string, MeshEdge>()
  for (let face = 0; face < mesh.indices.length / 3; face++) {
    for (let k = 0; k < 3; k++) {
      const p = canonical[mesh.indices[face * 3 + k]]
      const q = canonical[mesh.indices[face * 3 + ((k + 1) % 3)]]
      if (p === q) continue
      const key = p < q ? `${p}-${q}` : `${q}-${p}`
      const edge = edges.get(key)
      if (edge) edge.faces.push(face)
      else edges.set(key, { a: Math.min(p, q), b: Math.max(p, q), faces: [face] })
    }
  }
  return [...edges.values()]
}

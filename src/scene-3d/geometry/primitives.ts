import type { Geometry3D } from '../scene-types'
import { MeshBuilder, type Mesh } from './mesh'
import { extrudeMesh } from './extrude'

/**
 * The built-in shapes as meshes, centred on the origin (a plane lies on
 * y = 0 facing up, a floor). Sizes are metres. Curved shapes take a segment
 * count: more is rounder and slower to draw.
 */

const TAU = Math.PI * 2

export function boxMesh([w, h, d]: [number, number, number]): Mesh {
  const m = new MeshBuilder()
  const x = w / 2
  const y = h / 2
  const z = d / 2
  // Each face: its normal and its four corners, counter-clockwise seen from outside.
  const faces: Array<[[number, number, number], number[][]]> = [
    [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
    [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
    [[1, 0, 0], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],
    [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]],
    [[0, 1, 0], [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]],
    [[0, -1, 0], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]],
  ]
  for (const [[nx, ny, nz], corners] of faces) {
    const [a, b, c, d] = corners.map(([px, py, pz]) => m.vertex(px, py, pz, nx, ny, nz))
    m.quad(a, b, c, d)
  }
  return m.build()
}

/**
 * A floor: `width` along x, `depth` along z, facing +y, cut into a grid of
 * `segments` × `segments` cells (default 1). More cells sort better against
 * what stands on it, and fog and light vary across it.
 */
export function planeMesh([width, depth]: [number, number], segments = 1): Mesh {
  const m = new MeshBuilder()
  const n = Math.max(1, Math.round(segments))
  const grid: number[][] = []
  for (let row = 0; row <= n; row++) {
    const z = depth / 2 - (depth * row) / n
    grid.push(Array.from({ length: n + 1 }, (_, col) => m.vertex(-width / 2 + (width * col) / n, 0, z, 0, 1, 0)))
  }
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) m.quad(grid[row][col], grid[row][col + 1], grid[row + 1][col + 1], grid[row + 1][col])
  }
  return m.build()
}

export function sphereMesh(radius: number, segments = 16): Mesh {
  const m = new MeshBuilder()
  const around = Math.max(6, Math.round(segments))
  const rings = Math.max(3, Math.round(around / 2))
  const grid: number[][] = []
  for (let ring = 0; ring <= rings; ring++) {
    const polar = (ring / rings) * Math.PI // 0 at the top
    const row: number[] = []
    for (let i = 0; i <= around; i++) {
      const azimuth = (i / around) * TAU
      const nx = Math.sin(polar) * Math.sin(azimuth)
      const ny = Math.cos(polar)
      const nz = Math.sin(polar) * Math.cos(azimuth)
      row.push(m.vertex(nx * radius, ny * radius, nz * radius, nx, ny, nz))
    }
    grid.push(row)
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let i = 0; i < around; i++) {
      const a = grid[ring][i]
      const b = grid[ring + 1][i]
      const c = grid[ring + 1][i + 1]
      const d = grid[ring][i + 1]
      if (ring > 0) m.triangle(a, b, d)
      if (ring < rings - 1) m.triangle(b, c, d)
    }
  }
  return m.build()
}

/** A disc at height `y`, facing up (+1) or down (-1). */
function cap(m: MeshBuilder, radius: number, y: number, facing: 1 | -1, around: number): void {
  const centre = m.vertex(0, y, 0, 0, facing, 0)
  const rim = Array.from({ length: around }, (_, i) => {
    const a = (i / around) * TAU
    return m.vertex(Math.sin(a) * radius, y, Math.cos(a) * radius, 0, facing, 0)
  })
  for (let i = 0; i < around; i++) {
    const p = rim[i]
    const q = rim[(i + 1) % around]
    if (facing === 1) m.triangle(centre, p, q)
    else m.triangle(centre, q, p)
  }
}

export function cylinderMesh(radius: number, height: number, segments = 24): Mesh {
  const m = new MeshBuilder()
  const around = Math.max(6, Math.round(segments))
  const top = height / 2
  const bottom = -height / 2
  const ring = (y: number) =>
    Array.from({ length: around + 1 }, (_, i) => {
      const a = (i / around) * TAU
      return m.vertex(Math.sin(a) * radius, y, Math.cos(a) * radius, Math.sin(a), 0, Math.cos(a))
    })
  const low = ring(bottom)
  const high = ring(top)
  for (let i = 0; i < around; i++) m.quad(low[i], low[i + 1], high[i + 1], high[i])
  cap(m, radius, top, 1, around)
  cap(m, radius, bottom, -1, around)
  return m.build()
}

export function coneMesh(radius: number, height: number, segments = 24): Mesh {
  const m = new MeshBuilder()
  const around = Math.max(6, Math.round(segments))
  const top = height / 2
  const bottom = -height / 2
  // The side's normal leans up by the slope: (sin a, radius / height, cos a) before normalising.
  const lift = radius / height
  for (let i = 0; i < around; i++) {
    const a0 = (i / around) * TAU
    const a1 = ((i + 1) / around) * TAU
    const mid = (a0 + a1) / 2
    const p = m.vertex(Math.sin(a0) * radius, bottom, Math.cos(a0) * radius, Math.sin(a0), lift, Math.cos(a0))
    const q = m.vertex(Math.sin(a1) * radius, bottom, Math.cos(a1) * radius, Math.sin(a1), lift, Math.cos(a1))
    const tip = m.vertex(0, top, 0, Math.sin(mid), lift, Math.cos(mid))
    m.triangle(p, q, tip)
  }
  cap(m, radius, bottom, -1, around)
  return m.build()
}

/** A ring in the xz plane: `radius` to the middle of the tube, `tube` its thickness. */
export function torusMesh(radius: number, tube: number, segments = 24): Mesh {
  const m = new MeshBuilder()
  const around = Math.max(6, Math.round(segments))
  const sides = Math.max(4, Math.round(around / 2))
  const grid: number[][] = []
  for (let i = 0; i <= around; i++) {
    const a = (i / around) * TAU
    const row: number[] = []
    for (let j = 0; j <= sides; j++) {
      const b = (j / sides) * TAU
      const nx = Math.cos(b) * Math.sin(a)
      const ny = Math.sin(b)
      const nz = Math.cos(b) * Math.cos(a)
      const r = radius + tube * Math.cos(b)
      row.push(m.vertex(r * Math.sin(a), tube * Math.sin(b), r * Math.cos(a), nx, ny, nz))
    }
    grid.push(row)
  }
  for (let i = 0; i < around; i++) {
    for (let j = 0; j < sides; j++) m.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])
  }
  return m.build()
}

/** The mesh for a geometry description. */
export function geometryMesh(geometry: Geometry3D): Mesh {
  switch (geometry.type) {
    case 'box':
      return boxMesh(geometry.size)
    case 'plane':
      return planeMesh(geometry.size, geometry.segments)
    case 'sphere':
      return sphereMesh(geometry.radius, geometry.segments)
    case 'cylinder':
      return cylinderMesh(geometry.radius, geometry.height, geometry.segments)
    case 'cone':
      return coneMesh(geometry.radius, geometry.height, geometry.segments)
    case 'torus':
      return torusMesh(geometry.radius, geometry.tube, geometry.segments)
    case 'extrude':
      return extrudeMesh(geometry.path, { depth: geometry.depth, width: geometry.width, curveSegments: geometry.curveSegments })
  }
}

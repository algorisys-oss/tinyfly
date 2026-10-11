import { describe, it, expect } from 'vitest'
import { penroseTriangle3D } from './impossible-3d'

describe('penroseTriangle3D', () => {
  it('builds three beams that line up from a camera on the (1, 1, 1) diagonal', () => {
    const { objects, camera } = penroseTriangle3D({ length: 4, thickness: 0.8, material: 'bar', id: 'tri' })
    expect(objects.map((o) => o.id)).toEqual(['tri-x', 'tri-y', 'tri-z'])
    expect(objects.every((o) => o.material === 'bar' && o.geometry.type === 'box')).toBe(true)
    // The first beam begins at the origin's end; the third ends at (4, 4, 4): the same screen point down the diagonal.
    const start = [objects[0].position![0] - (objects[0].geometry as { size: number[] }).size[0] / 2, 0, 0]
    const end = [4, 4, objects[2].position![2] + (objects[2].geometry as { size: number[] }).size[2] / 2]
    expect(start[0]).toBeCloseTo(-0.4, 9)
    expect(end[2]).toBeCloseTo(4, 9)
    const diagonal = [end[0] - 0, end[1] - 0, end[2] - 0]
    expect(diagonal[0]).toBeCloseTo(diagonal[1], 9)
    expect(diagonal[1]).toBeCloseTo(diagonal[2], 9)
    expect(camera.projection).toBe('orthographic')
    const [cx, cy, cz] = camera.position!
    const [lx, ly, lz] = camera.lookAt!
    expect(cx - lx).toBeCloseTo(cy - ly, 9)
    expect(cy - ly).toBeCloseTo(cz - lz, 9)
    expect(cx - lx).toBeGreaterThan(0)
  })
})

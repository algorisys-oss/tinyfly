import { describe, it, expect } from 'vitest'
import { polygonVertices, starVertices, verticesToPath, polyStarPath } from './poly-star'

describe('polygonVertices', () => {
  it('produces one vertex per side, first pointing up', () => {
    const v = polygonVertices(100, 100, 3)
    expect(v).toHaveLength(3)
    // First vertex is top-centre.
    expect(v[0][0]).toBeCloseTo(50, 5)
    expect(v[0][1]).toBeCloseTo(0, 5)
  })

  it('inscribes a square (4 sides) touching the box edges', () => {
    const v = polygonVertices(100, 100, 4)
    const xs = v.map((p) => p[0])
    const ys = v.map((p) => p[1])
    expect(Math.min(...xs)).toBeCloseTo(0, 5)
    expect(Math.max(...xs)).toBeCloseTo(100, 5)
    expect(Math.min(...ys)).toBeCloseTo(0, 5)
    expect(Math.max(...ys)).toBeCloseTo(100, 5)
  })

  it('clamps to at least 3 sides', () => {
    expect(polygonVertices(100, 100, 1)).toHaveLength(3)
  })
})

describe('starVertices', () => {
  it('produces 2 vertices per point (outer + inner)', () => {
    expect(starVertices(100, 100, 5, 0.5)).toHaveLength(10)
  })

  it('inner vertices sit at innerRatio of the outer radius', () => {
    const v = starVertices(100, 100, 4, 0.4)
    // Vertex 0 outer (top, y=0); vertex 2 is the next outer point.
    // Inner vertex 1 is between them at ratio 0.4 from centre (50,50).
    const inner = v[1]
    const dx = inner[0] - 50
    const dy = inner[1] - 50
    const dist = Math.hypot(dx, dy)
    expect(dist).toBeCloseTo(50 * 0.4, 1)
  })

  it('clamps the inner ratio into (0,1]', () => {
    expect(() => starVertices(100, 100, 5, 5)).not.toThrow()
    const v = starVertices(100, 100, 5, 5)
    // Ratio clamped to 1 → inner radius equals outer.
    expect(Math.hypot(v[1][0] - 50, v[1][1] - 50)).toBeCloseTo(50, 1)
  })
})

describe('verticesToPath', () => {
  it('builds a closed M/L path', () => {
    expect(verticesToPath([[0, 0], [10, 0], [10, 10]])).toBe('M 0 0 L 10 0 L 10 10 Z')
  })

  it('is empty for no vertices', () => {
    expect(verticesToPath([])).toBe('')
  })
})

describe('polyStarPath', () => {
  it('routes to polygon or star by kind', () => {
    const poly = polyStarPath({ kind: 'polygon', points: 6 }, 100, 100)
    const star = polyStarPath({ kind: 'star', points: 6, innerRatio: 0.5 }, 100, 100)
    // Polygon: 6 L-commands' worth of vertices (M + 5 L + Z); star has 12 verts.
    expect((poly.match(/L/g) || []).length).toBe(5)
    expect((star.match(/L/g) || []).length).toBe(11)
  })
})

import { describe, it, expect } from 'vitest'
import { isometricBoxFaces, isometricFaces, penroseStairs, penroseTriangle, projectIsometric } from './impossible'

const near = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 9)
  expect(a.y).toBeCloseTo(b.y, 9)
}

describe('isometric projection', () => {
  it('sends the (1, 1, 1) diagonal to one point, x down-right, y down-left, z up', () => {
    near(projectIsometric([3, 3, 3]), projectIsometric([0, 0, 0]))
    const o = projectIsometric([0, 0, 0], { centre: { x: 100, y: 50 }, scale: 10 })
    expect(o).toEqual({ x: 100, y: 50 })
    const px = projectIsometric([1, 0, 0], { centre: { x: 100, y: 50 }, scale: 10 })
    expect(px.x).toBeGreaterThan(100)
    expect(px.y).toBeGreaterThan(50)
    const py = projectIsometric([0, 1, 0], { centre: { x: 100, y: 50 }, scale: 10 })
    expect(py.x).toBeLessThan(100)
    expect(py.y).toBe(px.y)
    expect(projectIsometric([0, 0, 1], { centre: { x: 100, y: 50 }, scale: 10 })).toEqual({ x: 100, y: 40 })
  })

  it('gives a box its three visible faces, far boxes first, and leaves out hidden ones', () => {
    const faces = isometricBoxFaces({ min: [0, 0, 0], max: [1, 2, 3], tag: 7 })
    expect(faces.map((f) => f.side)).toEqual(['top', 'left', 'right'])
    expect(faces.every((f) => f.points.length === 4 && f.tag === 7)).toBe(true)
    expect(isometricBoxFaces({ min: [0, 0, 0], max: [1, 1, 1], hide: ['right'] }).map((f) => f.side)).toEqual(['top', 'left'])
    const ordered = isometricFaces([{ min: [5, 5, 0], max: [6, 6, 1], tag: 1 }, { min: [0, 0, 0], max: [1, 1, 1], tag: 0 }])
    expect(ordered.map((f) => f.tag)).toEqual([0, 0, 0, 1, 1, 1])
  })
})

describe('Penrose figures', () => {
  it('triangle: three beams whose loop closes on screen, the first drawn again over the third', () => {
    const { boxes, faces } = penroseTriangle({ size: 10, thickness: 2, centre: { x: 200, y: 200 }, scale: 10 })
    expect(boxes.length).toBe(3)
    // The third beam ends one (1, 1, 1) diagonal from the first's axis start: the same point on screen.
    const endOfThird = [10, 10, 10] as const
    near(projectIsometric([...endOfThird]), projectIsometric([0, 0, 0]))
    // 3 beams × 3 faces, then the first beam's two faces again (its end cap left out).
    expect(faces.length).toBe(11)
    expect(faces.slice(9).map((f) => f.side)).toEqual(['top', 'left'])
    expect(faces.slice(9).every((f) => f.tag === 0)).toBe(true)
    // Centred where asked: the faces' points spread round the centre.
    const xs = faces.flatMap((f) => f.points.map((p) => p.x))
    expect(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 200)).toBeLessThan(20)
  })

  it('stairs: every step higher than the last and the last one diagonal from the first', () => {
    const { boxes, rise } = penroseStairs({ steps: 8, tread: 1.5, rise: 0.25, width: 3 })
    expect(rise).toBeCloseTo(0.25, 6)
    expect(boxes.length).toBe(24)
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].max[2] - boxes[i - 1].max[2]).toBeCloseTo(rise, 9)
    // Walking on from the last step lands one (1, 1, 1) step from the first: the same place on screen.
    const climb = boxes.length * rise
    expect(climb).toBeCloseTo(6, 9)
    const last = boxes[boxes.length - 1]
    // The last block (walking −y) ends at y = climb, at x = climb: the first block starts at the origin.
    expect(last.min[1]).toBeCloseTo(climb, 9)
    expect(last.min[0]).toBeCloseTo(climb, 9)
    expect(() => penroseStairs({ steps: 2, rise: 5 })).not.toThrow()
    // A rise that would not divide evenly is nudged.
    expect(penroseStairs({ steps: 7, rise: 0.33 }).rise).toBeCloseTo(0.3, 9)
  })
})

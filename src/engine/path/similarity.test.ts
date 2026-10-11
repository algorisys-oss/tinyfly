import { describe, it, expect } from 'vitest'
import { applySimilarity, composeSimilarity, invertSimilarity, powSimilarity, similarity, similarityAbout, similarityFixedPoint, similarityMatrix, IDENTITY_SIMILARITY } from './similarity'

const near = (a: { x: number; y: number }, b: { x: number; y: number }, digits = 9) => {
  expect(a.x).toBeCloseTo(b.x, digits)
  expect(a.y).toBeCloseTo(b.y, digits)
}

describe('similarity transforms', () => {
  it('scale, turn and move a point; a turn is clockwise with y down', () => {
    near(applySimilarity(similarity({ scale: 2 }), { x: 1, y: 1 }), { x: 2, y: 2 })
    near(applySimilarity(similarity({ turn: 90 }), { x: 1, y: 0 }), { x: 0, y: 1 })
    near(applySimilarity(similarity({ x: 5, y: -3 }), { x: 1, y: 1 }), { x: 6, y: -2 })
    near(applySimilarity(IDENTITY_SIMILARITY, { x: 4, y: 7 }), { x: 4, y: 7 })
  })

  it('keeps the centre of a zoom step where it is', () => {
    const step = similarityAbout(0.5, 15, { x: 640, y: 360 })
    near(applySimilarity(step, { x: 640, y: 360 }), { x: 640, y: 360 })
    near(similarityFixedPoint(step)!, { x: 640, y: 360 })
    expect(similarityFixedPoint(similarity({ x: 3, y: 4 }))).toBeNull()
    // A corner moves half way to the centre, turned a little.
    const corner = applySimilarity(step, { x: 0, y: 0 })
    expect(Math.hypot(corner.x - 640, corner.y - 360)).toBeCloseTo(Math.hypot(640, 360) / 2, 9)
  })

  it('composes, inverts and takes fractional powers', () => {
    const a = similarityAbout(0.6, 20, { x: 100, y: 50 })
    const b = similarity({ scale: 1.5, turn: -35, x: 12, y: -7 })
    const p = { x: 33, y: -21 }
    near(applySimilarity(composeSimilarity(a, b), p), applySimilarity(b, applySimilarity(a, p)))
    near(applySimilarity(invertSimilarity(a), applySimilarity(a, p)), p)
    near(applySimilarity(powSimilarity(a, 2), p), applySimilarity(a, applySimilarity(a, p)))
    near(applySimilarity(powSimilarity(a, -1), p), applySimilarity(invertSimilarity(a), p))
    const half = powSimilarity(a, 0.5)
    near(applySimilarity(composeSimilarity(half, half), p), applySimilarity(a, p))
    near(applySimilarity(powSimilarity(a, 0), p), p)
    // The fixed point is the same at every power.
    near(similarityFixedPoint(powSimilarity(a, 0.3))!, similarityFixedPoint(a)!)
    // A pure move scales its distance.
    near(applySimilarity(powSimilarity(similarity({ x: 10, y: 4 }), 0.25), p), { x: p.x + 2.5, y: p.y + 1 })
  })

  it('gives the matrix a canvas context takes', () => {
    const [ma, mb, mc, md, me, mf] = similarityMatrix(similarity({ scale: 2, turn: 90, x: 3, y: 4 }))
    expect(ma).toBeCloseTo(0, 12)
    expect(mb).toBeCloseTo(2, 12)
    expect(mc).toBeCloseTo(-2, 12)
    expect(md).toBeCloseTo(0, 12)
    expect([me, mf]).toEqual([3, 4])
  })
})

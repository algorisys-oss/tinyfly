import { describe, it, expect } from 'vitest'
import { quadMatrix, parseColor, type WebGLTarget } from './webgl-adapter'

/**
 * The GL calls themselves need a real context, so these tests cover the pure
 * parts: the transform matrix and colour parsing. Between them they decide
 * where everything lands on screen.
 */

const target = (overrides: Partial<WebGLTarget> = {}): WebGLTarget => ({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  ...overrides,
})

/** Apply the matrix to a unit-quad corner, returning clip-space coordinates. */
function project(matrix: Float32Array, x: number, y: number): [number, number] {
  // Column-major 3x3: columns are [0..2], [3..5], [6..8].
  return [
    matrix[0] * x + matrix[3] * y + matrix[6],
    matrix[1] * x + matrix[4] * y + matrix[7],
  ]
}

describe('quadMatrix', () => {
  it('centres a quad placed at the canvas centre', () => {
    const m = quadMatrix(target({ x: 200, y: 100 }), 400, 200)
    // The quad's own centre (0.5, 0.5) should land at clip-space origin.
    const [x, y] = project(m, 0.5, 0.5)
    expect(x).toBeCloseTo(0, 6)
    expect(y).toBeCloseTo(0, 6)
  })

  it('maps the full canvas to the clip-space extents', () => {
    const m = quadMatrix(target({ x: 200, y: 100, width: 400, height: 200 }), 400, 200)
    const [left, top] = project(m, 0, 0)
    const [right, bottom] = project(m, 1, 1)

    expect(left).toBeCloseTo(-1, 6)
    expect(right).toBeCloseTo(1, 6)
    // y is flipped: canvas top is clip-space +1.
    expect(top).toBeCloseTo(1, 6)
    expect(bottom).toBeCloseTo(-1, 6)
  })

  it('flips the y axis, so canvas-down is clip-space-down', () => {
    const high = quadMatrix(target({ x: 200, y: 50 }), 400, 200)
    const low = quadMatrix(target({ x: 200, y: 150 }), 400, 200)
    expect(project(high, 0.5, 0.5)[1]).toBeGreaterThan(project(low, 0.5, 0.5)[1])
  })

  it('scales about the pivot', () => {
    const m = quadMatrix(target({ x: 200, y: 100, scale: 2 }), 400, 200)
    // Doubling the scale keeps the centre put.
    const [x, y] = project(m, 0.5, 0.5)
    expect(x).toBeCloseTo(0, 6)
    expect(y).toBeCloseTo(0, 6)
  })

  it('honours scaleX and scaleY independently', () => {
    const m = quadMatrix(target({ x: 200, y: 100, scaleX: 2 }), 400, 200)
    const [left] = project(m, 0, 0.5)
    const [right] = project(m, 1, 0.5)
    // Width 100 scaled by 2 = 200px, which is half a 400px canvas.
    expect(right - left).toBeCloseTo(1, 6)
  })

  it('rotates about the pivot, leaving the centre fixed', () => {
    const m = quadMatrix(target({ x: 200, y: 100, rotate: 90 }), 400, 200)
    const [x, y] = project(m, 0.5, 0.5)
    expect(x).toBeCloseTo(0, 6)
    expect(y).toBeCloseTo(0, 6)
  })

  it('a 90-degree rotation swaps the corners as expected', () => {
    const m = quadMatrix(target({ x: 200, y: 100, width: 100, height: 100 }), 400, 200)
    const r = quadMatrix(target({ x: 200, y: 100, width: 100, height: 100, rotate: 90 }), 400, 200)

    const flat = project(m, 1, 0.5)
    const turned = project(r, 1, 0.5)
    // The point that was to the right is now below (clip-space y decreases).
    expect(turned[0]).toBeCloseTo(0, 6)
    expect(turned[1]).toBeLessThan(flat[1])
  })

  it('moves the pivot to a corner with originX/originY', () => {
    const m = quadMatrix(target({ x: 200, y: 100, originX: 0, originY: 0 }), 400, 200)
    // With a top-left pivot the quad's own (0,0) lands on the target position.
    const [x, y] = project(m, 0, 0)
    expect(x).toBeCloseTo(0, 6)
    expect(y).toBeCloseTo(0, 6)
  })

  it('returns a 9-element Float32Array', () => {
    const m = quadMatrix(target(), 400, 200)
    expect(m).toBeInstanceOf(Float32Array)
    expect(m).toHaveLength(9)
  })
})

describe('parseColor', () => {
  it('parses six-digit hex', () => {
    expect(parseColor('#ff0000')).toEqual([1, 0, 0])
  })

  it('parses three-digit hex', () => {
    expect(parseColor('#0f0')).toEqual([0, 1, 0])
  })

  it('works without the leading hash', () => {
    expect(parseColor('0000ff')).toEqual([0, 0, 1])
  })

  it('normalises to 0..1', () => {
    const [r, g, b] = parseColor('#808080')
    for (const channel of [r, g, b]) {
      expect(channel).toBeGreaterThan(0)
      expect(channel).toBeLessThan(1)
    }
  })

  it('falls back to white for unparseable input', () => {
    expect(parseColor('rebeccapurple')).toEqual([1, 1, 1])
  })
})

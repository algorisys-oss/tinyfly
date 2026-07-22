import { describe, it, expect } from 'vitest'
import { morphPath, isPathData } from './path-morph'

const square = 'M 0 0 L 100 0 L 100 100 L 0 100 Z'
const bigSquare = 'M 0 0 L 200 0 L 200 200 L 0 200 Z'

// Pull the numeric coordinate pairs out of a generated "M x y L x y … Z".
function coords(d: string): [number, number][] {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((m) => [
    parseFloat(m[1]),
    parseFloat(m[2]),
  ])
}

describe('morphPath', () => {
  it('produces samples+1 points and closes the path', () => {
    const d = morphPath(square, bigSquare, 0.5, 8)
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(coords(d)).toHaveLength(9)
  })

  it('at progress 0 approximates the from-path (small square)', () => {
    const d = morphPath(square, bigSquare, 0, 16)
    const xs = coords(d).map((c) => c[0])
    const ys = coords(d).map((c) => c[1])
    expect(Math.max(...xs)).toBeLessThanOrEqual(100.01)
    expect(Math.max(...ys)).toBeLessThanOrEqual(100.01)
  })

  it('at progress 1 approximates the to-path (big square)', () => {
    const d = morphPath(square, bigSquare, 1, 16)
    const xs = coords(d).map((c) => c[0])
    expect(Math.max(...xs)).toBeGreaterThan(150)
  })

  it('at progress 0.5 lands between the two (e.g. ~150 max x)', () => {
    const d = morphPath(square, bigSquare, 0.5, 16)
    const maxX = Math.max(...coords(d).map((c) => c[0]))
    expect(maxX).toBeGreaterThan(120)
    expect(maxX).toBeLessThan(180)
  })

  it('clamps progress outside [0,1]', () => {
    expect(morphPath(square, bigSquare, -1, 8)).toBe(morphPath(square, bigSquare, 0, 8))
    expect(morphPath(square, bigSquare, 2, 8)).toBe(morphPath(square, bigSquare, 1, 8))
  })

  it('falls back to the other path when one is empty', () => {
    expect(morphPath('', bigSquare, 0.5)).toBe(bigSquare)
    expect(morphPath(square, '', 0.5)).toBe(square)
  })
})

describe('isPathData', () => {
  it('recognises path data', () => {
    expect(isPathData('M 0 0 L 10 10')).toBe(true)
    expect(isPathData('  m10 10 l5 5')).toBe(true)
  })

  it('rejects non-paths (colors, plain strings)', () => {
    expect(isPathData('#ff0000')).toBe(false)
    expect(isPathData('rgb(1,2,3)')).toBe(false)
    expect(isPathData('hello')).toBe(false)
  })
})

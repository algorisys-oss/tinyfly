import { describe, it, expect } from 'vitest'
import { morphPath, isPathData, clearMorphCache } from './path-morph'
import { parsePath, getPointAtProgress } from './path-utils'

const square = 'M0 0 L100 0 L100 100 L0 100 Z'
const bigSquare = 'M0 0 L200 0 L200 200 L0 200 Z'

/** Coordinate pairs of a generated "Mx y Lx y … Z". */
function coords(d: string): [number, number][] {
  return [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [parseFloat(m[1]), parseFloat(m[2])])
}

/** Distance from a point to the boundary of the 0..size axis-aligned square. */
const offSquare = ([x, y]: [number, number], size = 100) =>
  Math.min(Math.abs(x), Math.abs(x - size), Math.abs(y), Math.abs(y - size)) +
  Math.max(0, -x, x - size, -y, y - size)

describe('morphPath', () => {
  it('returns the original strings exactly at the ends, and clamps', () => {
    expect(morphPath(square, bigSquare, 0)).toBe(square)
    expect(morphPath(square, bigSquare, 1)).toBe(bigSquare)
    expect(morphPath(square, bigSquare, -1)).toBe(square)
    expect(morphPath(square, bigSquare, 2)).toBe(bigSquare)
  })

  it('falls back to the other path when one is empty', () => {
    expect(morphPath('', bigSquare, 0.5)).toBe(bigSquare)
    expect(morphPath(square, '', 0.5)).toBe(square)
  })

  it('blends to the in-between shape, corners intact', () => {
    const points = coords(morphPath(square, bigSquare, 0.5))
    for (const corner of [[0, 0], [150, 0], [150, 150], [0, 150]]) {
      expect(points).toContainEqual(corner)
    }
    for (const p of points) expect(offSquare(p, 150)).toBeLessThan(0.01)
  })

  it('keeps sharp corners when morphing between different polygons', () => {
    const triangle = 'M50 0 L100 100 L0 100 Z'
    const points = coords(morphPath(triangle, square, 0.001))
    // Near the start, the triangle's apex is present as a sampled point.
    expect(points.some(([x, y]) => Math.abs(x - 50) < 0.2 && Math.abs(y) < 0.2)).toBe(true)
  })

  it('does not twist when the target starts at a different corner', () => {
    const sameSquareOtherStart = 'M100 100 L0 100 L0 0 L100 0 Z'
    for (const p of coords(morphPath(square, sameSquareOtherStart, 0.5))) {
      expect(offSquare(p)).toBeLessThan(0.01)
    }
  })

  it('does not twist when the target winds the other way', () => {
    const counterClockwise = 'M0 0 L0 100 L100 100 L100 0 Z'
    for (const p of coords(morphPath(square, counterClockwise, 0.5))) {
      expect(offSquare(p)).toBeLessThan(0.01)
    }
  })

  it('matches shapes about their centres, so a moved shape slides rather than spins', () => {
    const moved = 'M200 0 L300 0 L300 100 L200 100 Z'
    const mid = coords(morphPath(square, moved, 0.5))
    for (const [x, y] of mid) expect(offSquare([x - 100, y])).toBeLessThan(0.01)
  })

  it('honours a forced shapeIndex', () => {
    const auto = morphPath(square, bigSquare, 0.5)
    expect(morphPath(square, bigSquare, 0.5, { shapeIndex: 18 })).not.toBe(auto)
  })

  it('leaves open paths open and closes closed ones', () => {
    expect(morphPath('M0 0 L100 0', 'M0 50 L100 50', 0.5).endsWith('Z')).toBe(false)
    expect(morphPath(square, bigSquare, 0.5).endsWith('Z')).toBe(true)
    expect(morphPath('M0 0 L100 0', square, 0.5).endsWith('Z')).toBe(false)
  })

  it('reverses an open path when that moves points less', () => {
    const mid = coords(morphPath('M0 0 L100 0', 'M100 10 L0 10', 0.5))
    expect(mid[0]).toEqual([0, 5])
  })

  it('pairs subpaths, so a hole morphs into a hole', () => {
    const framed = `${square} M25 25 L75 25 L75 75 L25 75 Z`
    const bigFramed = `${bigSquare} M50 50 L150 50 L150 150 L50 150 Z`
    const d = morphPath(framed, bigFramed, 0.5)
    expect(d.match(/M/g)).toHaveLength(2)
    expect(d.match(/Z/g)).toHaveLength(2)
  })

  it('merges subpaths into one run when the counts differ', () => {
    const d = morphPath(`${square} M25 25 L75 25 L75 75 L25 75 Z`, bigSquare, 0.5)
    expect(d.match(/M/g)).toHaveLength(1)
  })

  it('samples curves densely enough to stay smooth', () => {
    const circle = 'M100 50 A50 50 0 1 1 0 50 A50 50 0 1 1 100 50 Z'
    const points = coords(morphPath(circle, 'M100 50 A50 50 0 1 1 0 50 A50 50 0 1 1 100 50 Z M0 0', 0.5))
    expect(points.length).toBeGreaterThan(100)
    for (const [x, y] of points) expect(Math.abs(Math.hypot(x - 50, y - 50) - 50)).toBeLessThan(0.1)
  })

  it('is deterministic, including after clearing its cache', () => {
    const star = 'M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z'
    const first = morphPath(star, square, 0.37)
    clearMorphCache()
    expect(morphPath(star, square, 0.37)).toBe(first)
  })
})

describe('parsePath subpaths', () => {
  it('records each drawn subpath and whether it is closed', () => {
    const { subpaths } = parsePath('M0 0 L10 0 L10 10 Z M20 0 L30 0 M40 0')
    expect(subpaths.map((s) => [s.end - s.start, s.closed])).toEqual([[3, true], [1, false]])
  })

  it('treats a subpath that ends at its start as closed', () => {
    expect(parsePath('M0 0 L10 0 L0 0').subpaths[0].closed).toBe(true)
  })

  it('ignores movetos that draw nothing', () => {
    expect(parsePath('M0 0 M5 5 L10 5').subpaths).toHaveLength(1)
    expect(getPointAtProgress('M0 0 M5 5 L10 5', 0)).toMatchObject({ x: 5, y: 5 })
  })
})

describe('isPathData', () => {
  it('recognises path data, including compact starts', () => {
    expect(isPathData('M 0 0 L 10 10')).toBe(true)
    expect(isPathData('  m10 10 l5 5')).toBe(true)
    expect(isPathData('M.5.5L1 1')).toBe(true)
    expect(isPathData('M-.5 1')).toBe(true)
  })

  it('rejects non-paths (colors, plain strings)', () => {
    expect(isPathData('#ff0000')).toBe(false)
    expect(isPathData('rgb(1,2,3)')).toBe(false)
    expect(isPathData('hello')).toBe(false)
  })
})

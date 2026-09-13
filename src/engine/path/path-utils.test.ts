import { describe, it, expect } from 'vitest'
import { parsePath, getPointAtProgress, getPathLength } from './path-utils'

/**
 * The parser has to cope with what real exporters emit, and progress has to be
 * by arc length — these are what motion paths and shape morphs rest on.
 */

const close = (actual: number, expected: number, tolerance = 0.01) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)

describe('parsePath: commands', () => {
  it('reads lines, including H and V', () => {
    expect(getPathLength('M0 0 L30 40')).toBe(50)
    expect(getPathLength('M0 0 H10 V10')).toBe(20)
  })

  it('treats extra coordinates after M as implicit linetos', () => {
    expect(getPathLength('M0 0 10 0 10 10')).toBe(20)
  })

  it('repeats commands for extra argument groups', () => {
    expect(getPathLength('M0 0 L10 0 10 10 0 10')).toBe(30)
    expect(getPathLength('M0 0 H10 20 30')).toBe(30)
  })

  it('resolves relative commands, including a closing Z', () => {
    expect(getPathLength('m10 10 l10 0 v10 h-10 z')).toBe(40)
  })

  it('starts relative coordinates after Z from the subpath start', () => {
    const { segments } = parsePath('M10 10 L20 10 Z l5 0')
    const last = segments[segments.length - 1]
    expect([last.startX, last.endX]).toEqual([10, 15])
  })

  it('raises quadratics to exact cubics', () => {
    // Symmetric quadratic: the arc-length midpoint is the apex, t = 0.5 → (50, 50).
    const mid = getPointAtProgress('M0 0 Q50 100 100 0', 0.5)
    close(mid.x, 50)
    close(mid.y, 50)
  })

  it('reflects the previous control point for S', () => {
    const first = getPathLength('M0 0 C0 10 10 10 10 0')
    const joined = 'M0 0 C0 10 10 10 10 0 S20 -10 20 0'
    close(getPathLength(joined), first * 2, 0.02)
    close(getPointAtProgress(joined, 0.5).x, 10, 0.05)
  })

  it('reflects the previous quadratic control for T', () => {
    const joined = 'M0 0 Q10 10 20 0 T40 0'
    close(getPathLength(joined), getPathLength('M0 0 Q10 10 20 0') * 2, 0.02)
    // The reflected half dips below the axis.
    expect(getPointAtProgress(joined, 0.75).y).toBeLessThan(-1)
  })

  it('treats S without a preceding cubic as using the current point', () => {
    close(getPathLength('M0 0 S10 10 20 0'), getPathLength('M0 0 C0 0 10 10 20 0'), 1e-9)
  })

  it('draws arcs as true ellipse segments', () => {
    const circle = 'M0 50 A50 50 0 0 1 100 50 A50 50 0 0 1 0 50'
    close(getPathLength(circle), 2 * Math.PI * 50, 0.5)
    for (const progress of [0.1, 0.3, 0.6, 0.9]) {
      const p = getPointAtProgress(circle, progress)
      close(Math.hypot(p.x - 50, p.y - 50), 50, 0.1)
    }
  })

  it('scales arc radii that are too small to reach the end point', () => {
    // Radius 1 cannot span 100 units; the spec scales it to a semicircle.
    close(getPathLength('M0 0 A1 1 0 0 1 100 0'), Math.PI * 50, 0.5)
  })

  it('treats a zero-radius arc as a straight line', () => {
    close(getPathLength('M0 0 A0 10 0 0 1 30 40'), 50, 1e-9)
  })
})

describe('parsePath: compact notation', () => {
  it('splits numbers run together with signs and dots', () => {
    expect(getPathLength('M0,0L10-0L10-10')).toBe(10 + 10)
    expect(getPathLength('M.5.5L10.5.5')).toBe(10)
  })

  it('reads exponents', () => {
    expect(getPathLength('M1e1 0L2e1 0')).toBe(10)
  })

  it('reads arc flags written without separators', () => {
    close(getPathLength('M0 0a10 10 0 0110 10'), getPathLength('M0 0 a10 10 0 0 1 10 10'), 1e-9)
  })

  it('stops at the first malformed token, keeping what came before', () => {
    expect(getPathLength('M0 0 L10 0 L oops 20 0')).toBe(10)
  })

  it('returns an empty path for empty or command-less input', () => {
    expect(getPathLength('')).toBe(0)
    expect(getPointAtProgress('10 10', 0.5)).toEqual({ x: 0, y: 0, angle: 0 })
  })
})

describe('getPointAtProgress', () => {
  it('moves at an even speed along a curve with bunched control points', () => {
    // Controls sit on the start point, so t races near the end: by t it is uneven.
    const d = 'M0 0 C0 0 0 0 100 0'
    const xs = [0, 0.25, 0.5, 0.75, 1].map((p) => getPointAtProgress(d, p).x)
    for (let i = 1; i < xs.length; i++) close(xs[i] - xs[i - 1], 25, 0.5)
  })

  it('reports the tangent angle', () => {
    close(getPointAtProgress('M0 0 L10 10', 0.5).angle, 45)
    close(getPointAtProgress('M0 0 Q50 100 100 0', 0.5).angle, 0, 0.5)
  })

  it('gives a usable angle where a curve\'s derivative vanishes', () => {
    // At t=0 both controls coincide with the start: derivative is zero there.
    close(getPointAtProgress('M0 0 C0 0 0 0 100 0', 0).angle, 0)
  })

  it('clamps progress and hits the exact end points', () => {
    expect(getPointAtProgress('M0 0 L10 0', -1)).toMatchObject({ x: 0, y: 0 })
    expect(getPointAtProgress('M0 0 C5 5 5 5 10 0', 2)).toMatchObject({ x: 10, y: 0 })
  })

  it('crosses subpaths without drawing the jump between them', () => {
    const d = 'M0 0 L10 0 M100 0 L110 0'
    expect(getPathLength(d)).toBe(20)
    close(getPointAtProgress(d, 0.75).x, 105)
  })
})

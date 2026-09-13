import { describe, it, expect } from 'vitest'
import { customEase, customBounce, customWiggle } from './custom-ease'

describe('customEase', () => {
  it('keeps a single cubic as an exact bezier, from points or path data', () => {
    expect(customEase([0.2, 0, 0.3, 1]).bezier).toEqual([0.2, 0, 0.3, 1])
    const fromPath = customEase('M0,0 C0.2,0 0.3,1 1,1')
    expect(fromPath.bezier).toEqual([0.2, 0, 0.3, 1])
    expect(fromPath.fn(0)).toBe(0)
    expect(fromPath.fn(1)).toBe(1)
    expect(fromPath.fn(0.5)).toBeGreaterThan(0.5)
  })

  it('samples multi-segment curves, including overshoot', () => {
    const hop = customEase('M0,0 C0.2,0 0.3,1.4 0.5,1.2 C0.7,1 0.8,1 1,1')
    expect(hop.bezier).toBeUndefined()
    expect(hop.fn(0)).toBeCloseTo(0)
    expect(hop.fn(1)).toBeCloseTo(1)
    expect(hop.fn(0.5)).toBeCloseTo(1.2, 2) // the overshoot's peak point
  })

  it('normalises design-tool coordinates: any scale, y growing downward', () => {
    // A straight line drawn on a 500×500 artboard from bottom-left to top-right.
    const line = customEase('M0,500 L500,0')
    expect(line.fn(0.25)).toBeCloseTo(0.25)
    expect(line.fn(0.75)).toBeCloseTo(0.75)
  })

  it('rejects paths that do not move along both axes', () => {
    expect(() => customEase('M0,0 L1,0')).toThrow(/both axes/)
  })
})

describe('customBounce', () => {
  it('falls to the end value, bounces back less each time, and settles there', () => {
    const bounce = customBounce({ strength: 0.7 })
    expect(bounce(0)).toBe(0)
    expect(bounce(1)).toBe(1)
    const samples = Array.from({ length: 1001 }, (_, i) => bounce(i / 1000))
    expect(Math.max(...samples)).toBeLessThanOrEqual(1 + 1e-9)
    // Count landings (touching 1) and check rebounds shrink.
    const lows: number[] = []
    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i] < samples[i - 1] && samples[i] <= samples[i + 1]) lows.push(samples[i])
    }
    expect(lows.length).toBeGreaterThan(2)
    for (let i = 1; i < lows.length; i++) expect(lows[i]).toBeGreaterThan(lows[i - 1])
  })

  it('bounces more with more strength', () => {
    const landings = (strength: number) => {
      const f = customBounce({ strength })
      let count = 0
      for (let i = 1; i < 2000; i++) if (f(i / 2000) >= 0.999 && f((i - 1) / 2000) < 0.999) count++
      return count
    }
    expect(landings(0.9)).toBeGreaterThan(landings(0.2))
  })
})

describe('customWiggle', () => {
  it('swings around 0 and ends where it began, dying away by default', () => {
    const wiggle = customWiggle({ wiggles: 5 })
    expect(wiggle(0)).toBe(0)
    expect(wiggle(1)).toBe(0)
    const early = Math.max(...Array.from({ length: 100 }, (_, i) => Math.abs(wiggle(i / 1000))))
    const late = Math.max(...Array.from({ length: 100 }, (_, i) => Math.abs(wiggle(0.9 + i / 1000))))
    expect(early).toBeGreaterThan(late)
    expect(Math.min(...Array.from({ length: 1000 }, (_, i) => wiggle(i / 1000)))).toBeLessThan(-0.3)
  })

  it('keeps a constant swing with uniform', () => {
    const wiggle = customWiggle({ wiggles: 4, type: 'uniform' })
    expect(Math.abs(wiggle(1 / 16))).toBeCloseTo(1)
    expect(Math.abs(wiggle(15 / 16))).toBeCloseTo(1)
  })
})

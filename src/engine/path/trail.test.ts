import { describe, it, expect } from 'vitest'
import { ribbon, ribbonHeadCap, trailSamples } from './trail'

describe('trailSamples', () => {
  const along = (t: number) => ({ x: t, y: 0 })

  it('samples back from now, oldest first, with ages from 1 to 0', () => {
    const trail = trailSamples(along, 1000, { length: 400, samples: 5 })
    expect(trail.map((s) => s.time)).toEqual([600, 700, 800, 900, 1000])
    expect(trail.map((s) => s.age)).toEqual([1, 0.75, 0.5, 0.25, 0])
    expect(trail[4].at).toEqual({ x: 1000, y: 0 })
  })

  it('is the same at the same time, whatever came before', () => {
    expect(trailSamples(along, 1234, { length: 300 })).toEqual(trailSamples(along, 1234, { length: 300 }))
  })

  it('grows from `since`; nothing before it', () => {
    const trail = trailSamples(along, 100, { length: 400, samples: 3, since: 0 })
    expect(trail.map((s) => s.time)).toEqual([0, 50, 100])
    expect(trail[0].age).toBeCloseTo(0.25)
    expect(trailSamples(along, 0, { length: 400, since: 0 })).toEqual([])
  })

  it('wraps earlier times into the period, so a loop starts with last lap’s tail', () => {
    const asked: number[] = []
    trailSamples((t) => asked.push(t), 100, { length: 400, samples: 5, period: 1000 })
    expect(asked).toEqual([700, 800, 900, 0, 100])
  })
})

describe('ribbon', () => {
  it('a straight band keeps its width, and its edges sit either side', () => {
    const { left, right } = ribbon([{ x: 0, y: 0, width: 4 }, { x: 10, y: 0, width: 4 }, { x: 20, y: 0, width: 2 }])
    expect(left.map((p) => p.y)).toEqual([2, 2, 1])
    expect(right.map((p) => p.y)).toEqual([-2, -2, -1])
  })

  it('keeps its width through a turn (mitred), and cuts very sharp turns short', () => {
    const { left, right } = ribbon([{ x: 0, y: 0, width: 2 }, { x: 10, y: 0, width: 2 }, { x: 10, y: 10, width: 2 }])
    // The corner of a right angle sits √2 half-widths out.
    expect(Math.hypot(left[1].x - 10, left[1].y)).toBeCloseTo(Math.SQRT2)
    expect(Math.hypot(right[1].x - 10, right[1].y)).toBeCloseTo(Math.SQRT2)
    const hairpin = ribbon([{ x: 0, y: 0, width: 2 }, { x: 10, y: 0, width: 2 }, { x: 0, y: 0.01, width: 2 }])
    expect(Math.hypot(hairpin.left[1].x - 10, hairpin.left[1].y)).toBeLessThanOrEqual(2.5 + 1e-9)
  })

  it('skips repeated points when finding directions', () => {
    const { left } = ribbon([{ x: 0, y: 0, width: 2 }, { x: 0, y: 0, width: 2 }, { x: 10, y: 0, width: 2 }])
    expect(left[0].y).toBeCloseTo(1)
    expect(left[1].y).toBeCloseTo(1)
  })

  it('ends in a half circle the way it travels', () => {
    const cap = ribbonHeadCap([{ x: 0, y: 0, width: 4 }, { x: 10, y: 0, width: 4 }])!
    expect(cap).toMatchObject({ x: 10, y: 0, radius: 2 })
    // From the left edge (+y, angle π/2), decreasing through 0 (travel, +x) to the right edge.
    expect(cap.start).toBeCloseTo(Math.PI / 2)
    expect(ribbonHeadCap([{ x: 1, y: 1, width: 4 }])).toBeNull()
  })
})

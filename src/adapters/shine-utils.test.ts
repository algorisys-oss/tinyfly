import { describe, it, expect } from 'vitest'
import { shineStops } from './shine-utils'

describe('shineStops', () => {
  it('always anchors the base colour at both ends', () => {
    const stops = shineStops(0.5, '#123456')
    expect(stops[0]).toEqual({ offset: 0, color: '#123456' })
    expect(stops[stops.length - 1]).toEqual({ offset: 1, color: '#123456' })
  })

  it('returns stops in ascending offset order', () => {
    const stops = shineStops(0.5, '#000')
    const offsets = stops.map((s) => s.offset)
    const sorted = [...offsets].sort((a, b) => a - b)
    expect(offsets).toEqual(sorted)
  })

  it('places a highlight inside the fill at mid-progress', () => {
    const stops = shineStops(0.5, '#000', { highlight: '#fff' })
    const highlight = stops.find((s) => s.color === '#fff')
    expect(highlight).toBeDefined()
    // At progress 0.5, band centre = -0.2 + 0.5*1.4 = 0.5.
    expect(highlight!.offset).toBeCloseTo(0.5, 5)
  })

  it('shows no highlight when the band is off the left edge', () => {
    // progress 0 -> centre -0.2, band [-0.32, -0.08] all < 0 -> only base ends.
    const stops = shineStops(0, '#000', { highlight: '#fff' })
    expect(stops.every((s) => s.color === '#000')).toBe(true)
    expect(stops).toHaveLength(2)
  })

  it('shows no highlight when the band is off the right edge', () => {
    const stops = shineStops(1, '#000', { highlight: '#fff' })
    expect(stops.every((s) => s.color === '#000')).toBe(true)
  })

  it('keeps all offsets within [0, 1]', () => {
    for (let p = 0; p <= 1; p += 0.1) {
      for (const s of shineStops(p, '#000')) {
        expect(s.offset).toBeGreaterThanOrEqual(0)
        expect(s.offset).toBeLessThanOrEqual(1)
      }
    }
  })
})

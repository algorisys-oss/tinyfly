import { describe, it, expect } from 'vitest'
import { loopSamples } from './loop-audio'

describe('loopSamples', () => {
  it('cuts to the length with the tail blended into the head, tiling short audio', () => {
    const ramp = Float32Array.from({ length: 1000 }, (_, i) => i / 1000)
    const out = loopSamples(ramp, { length: 500, crossfade: 100 })
    expect(out.length).toBe(500)
    // Past the crossfade it is the source; at the very start it is mostly what followed sample 500.
    expect(out[300]).toBeCloseTo(0.3, 5)
    expect(out[0]).toBeGreaterThan(0.45)
    expect(out[0]).toBeLessThan(0.52)
    expect(out[99]).toBeCloseTo(0.099 * Math.sin((100 / 101) * Math.PI / 2) + 0.599 * Math.cos((100 / 101) * Math.PI / 2), 6)
    // The seam: the end runs on into the (blended) start without a jump bigger than the ramp's own steps.
    expect(Math.abs(out[499] - out[0])).toBeLessThan(0.02)
    const short = loopSamples(Float32Array.from([1, 2, 3]), { length: 7, crossfade: 0 })
    expect(Array.from(short)).toEqual([1, 2, 3, 1, 2, 3, 1])
    expect(Array.from(loopSamples(new Float32Array(0), { length: 3 }))).toEqual([0, 0, 0])
  })

  it('fades a riser in and out', () => {
    const flat = new Float32Array(100).fill(1)
    const out = loopSamples(flat, { length: 100, crossfade: 0, fadeIn: 10, fadeOut: 10 })
    expect(out[0]).toBe(0)
    expect(out[5]).toBeCloseTo(0.5, 9)
    expect(out[50]).toBe(1)
    expect(out[99]).toBe(0)
  })
})

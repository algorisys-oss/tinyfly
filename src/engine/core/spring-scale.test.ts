import { describe, it, expect } from 'vitest'
import { SpringSampler, springDuration, isUnderdamped } from './spring'

/**
 * Regression cover for a bug found by driving the editor: a `scale: 0 → 1`
 * spring reported "settles in 140 ms" and never overshot, while the inspector's
 * badge said it would. The rest thresholds were absolute, so a spring travelling
 * 1 unit hit them ~100x sooner than one travelling 100 — it was declared at rest
 * at its first pass through the target, before any bounce.
 *
 * The whole existing spring suite used `from: 0, to: 100`, which is why it did
 * not catch this. These tests use small-magnitude springs on purpose.
 */

const peakOf = (config: Parameters<typeof springDuration>[0], overMs = 3000) => {
  const sampler = new SpringSampler(config)
  let peak = -Infinity
  for (let t = 0; t <= overMs; t += 1) peak = Math.max(peak, sampler.valueAt(t))
  return peak
}

describe('small-magnitude springs', () => {
  const unitSpring = { from: 0, to: 1, stiffness: 220, damping: 11, mass: 1 }

  it('a unit-scale spring actually overshoots', () => {
    expect(peakOf(unitSpring)).toBeGreaterThan(1.05)
  })

  it('its overshoot happens inside the reported settle window', () => {
    // A settle time that cut the bounce off would silently truncate the motion.
    const settle = springDuration(unitSpring)
    expect(peakOf(unitSpring, settle)).toBeGreaterThan(1.05)
  })

  it('the overshoot badge tells the truth for it', () => {
    expect(isUnderdamped(unitSpring)).toBe(true)
    expect(peakOf(unitSpring)).toBeGreaterThan(unitSpring.to)
  })

  it('settles in a plausible time rather than instantly', () => {
    const settle = springDuration(unitSpring)
    expect(settle).toBeGreaterThan(400)
    expect(settle).toBeLessThan(3000)
  })
})

describe('scale invariance', () => {
  // The property a spring drives should not change how long it takes; only its
  // parameters should.
  const params = { stiffness: 220, damping: 11, mass: 1 }

  it('settle time does not depend on travel distance', () => {
    const small = springDuration({ from: 0, to: 1, ...params })
    const large = springDuration({ from: 0, to: 100, ...params })
    expect(small).toBe(large)
  })

  it('holds for a tiny opacity-sized spring too', () => {
    const tiny = springDuration({ from: 0, to: 0.01, ...params })
    const normal = springDuration({ from: 0, to: 1, ...params })
    expect(tiny).toBe(normal)
  })

  it('holds for a downward spring', () => {
    expect(springDuration({ from: 1, to: 0, ...params })).toBe(
      springDuration({ from: 0, to: 1, ...params })
    )
  })

  it('normalised motion matches across scales', () => {
    const small = new SpringSampler({ from: 0, to: 1, ...params })
    const large = new SpringSampler({ from: 0, to: 100, ...params })

    for (const t of [20, 60, 120, 300, 600]) {
      expect(large.valueAt(t) / 100).toBeCloseTo(small.valueAt(t), 9)
    }
  })
})

describe('zero-travel springs', () => {
  // "Spring Wobble" is from === to with initial velocity — a knock, not a
  // journey — so the distance yardstick has to fall back to something.
  const knock = { from: 0, to: 0, stiffness: 160, damping: 6, mass: 1, velocity: 700 }

  it('still terminates', () => {
    const settle = springDuration(knock)
    expect(settle).toBeGreaterThan(0)
    expect(Number.isFinite(settle)).toBe(true)
  })

  it('actually moves', () => {
    expect(peakOf(knock)).toBeGreaterThan(1)
  })

  it('returns to its rest value', () => {
    const sampler = new SpringSampler(knock)
    expect(sampler.valueAt(springDuration(knock))).toBe(0)
  })
})

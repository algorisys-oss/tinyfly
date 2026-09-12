import { describe, it, expect } from 'vitest'
import { SpringSampler, springValueAt, springDuration, SPRING_MAX_DURATION_MS } from './spring'

const basic = { from: 0, to: 100 }

describe('SpringSampler', () => {
  it('starts at the from value', () => {
    expect(new SpringSampler(basic).valueAt(0)).toBe(0)
  })

  it('clamps times before the start', () => {
    expect(new SpringSampler(basic).valueAt(-500)).toBe(0)
  })

  it('settles exactly on the target', () => {
    const s = new SpringSampler(basic)
    expect(s.valueAt(s.settleTime() + 1000)).toBe(100)
  })

  it('moves toward the target over time', () => {
    const s = new SpringSampler(basic)
    expect(s.valueAt(50)).toBeGreaterThan(s.valueAt(10))
  })

  it('overshoots when underdamped', () => {
    const s = new SpringSampler({ from: 0, to: 100, stiffness: 200, damping: 4 })
    // Sample the first second; an underdamped spring must exceed its target.
    let peak = 0
    for (let t = 0; t <= 1000; t += 5) peak = Math.max(peak, s.valueAt(t))
    expect(peak).toBeGreaterThan(100)
  })

  it('does not overshoot when heavily damped', () => {
    const s = new SpringSampler({ from: 0, to: 100, stiffness: 100, damping: 60 })
    for (let t = 0; t <= 2000; t += 5) expect(s.valueAt(t)).toBeLessThanOrEqual(100.001)
  })

  it('respects an initial velocity', () => {
    const still = new SpringSampler({ from: 0, to: 100 })
    const thrown = new SpringSampler({ from: 0, to: 100, velocity: 500 })
    expect(thrown.valueAt(20)).toBeGreaterThan(still.valueAt(20))
  })

  it('animates downward as well as up', () => {
    const s = new SpringSampler({ from: 100, to: 0 })
    expect(s.valueAt(50)).toBeLessThan(100)
    expect(s.valueAt(s.settleTime())).toBe(0)
  })
})

describe('determinism', () => {
  // The reason this module integrates from t=0 on every query rather than from
  // the previous frame: output must not depend on how time was traversed.
  it('gives the same value regardless of sampling order', () => {
    const forward = new SpringSampler(basic)
    const times = [0, 25, 50, 100, 200, 400]
    const forwardValues = times.map((t) => forward.valueAt(t))

    const backward = new SpringSampler(basic)
    const backwardValues = [...times].reverse().map((t) => backward.valueAt(t)).reverse()

    expect(backwardValues).toEqual(forwardValues)
  })

  it('gives the same value regardless of sampling density', () => {
    const coarse = new SpringSampler(basic)
    const fine = new SpringSampler(basic)

    // Walk one sampler in 1ms steps and the other straight to the same time.
    for (let t = 0; t <= 300; t += 1) fine.valueAt(t)

    expect(coarse.valueAt(300)).toBe(fine.valueAt(300))
  })

  it('two identical springs produce identical output', () => {
    const a = new SpringSampler({ from: 5, to: 55, stiffness: 210, damping: 9, mass: 2 })
    const b = new SpringSampler({ from: 5, to: 55, stiffness: 210, damping: 9, mass: 2 })
    for (let t = 0; t <= 500; t += 17) {
      expect(a.valueAt(t)).toBe(b.valueAt(t))
    }
  })
})

describe('settleTime', () => {
  it('is finite for a normal spring', () => {
    const t = springDuration(basic)
    expect(t).toBeGreaterThan(0)
    expect(t).toBeLessThan(SPRING_MAX_DURATION_MS)
  })

  it('settles sooner with more damping', () => {
    const loose = springDuration({ from: 0, to: 100, stiffness: 180, damping: 8 })
    const tight = springDuration({ from: 0, to: 100, stiffness: 180, damping: 26 })
    expect(tight).toBeLessThan(loose)
  })

  it('caps an undamped spring rather than hanging', () => {
    // damping: 0 oscillates forever; the cap is what keeps duration finite.
    expect(springDuration({ from: 0, to: 100, damping: 0 })).toBe(SPRING_MAX_DURATION_MS)
  })

  it('is already settled when from equals to', () => {
    expect(springDuration({ from: 10, to: 10 })).toBe(0)
  })
})

describe('springValueAt', () => {
  it('matches a long-lived sampler', () => {
    expect(springValueAt(basic, 120)).toBe(new SpringSampler(basic).valueAt(120))
  })
})

import { describe, it, expect } from 'vitest'
import {
  isNumericTrack,
  paddedRange,
  sampleCurve,
  sampleSpringCurve,
  springRange,
  isGraphableTrack,
  easingToBezierPoints,
} from './curve-math'
import { SpringSampler } from '../../engine'
import type { SpringTrack } from '../../engine'
import type { Track } from '../../engine'

function track(partial: Partial<Track>): Track {
  return {
    id: 't1',
    target: 'Box',
    property: 'x',
    keyframes: [],
    ...partial,
  } as Track
}

describe('isNumericTrack', () => {
  it('accepts a track whose keyframe values are all numbers', () => {
    expect(
      isNumericTrack(track({ keyframes: [{ time: 0, value: 0 }, { time: 100, value: 50 }] }))
    ).toBe(true)
  })

  it('rejects string (colour) values', () => {
    expect(
      isNumericTrack(track({ property: 'fill', keyframes: [{ time: 0, value: '#fff' }] }))
    ).toBe(false)
  })

  it('rejects array values', () => {
    expect(
      isNumericTrack(track({ keyframes: [{ time: 0, value: [1, 2, 3] }] }))
    ).toBe(false)
  })

  it('rejects motion-path tracks and empty tracks', () => {
    expect(isNumericTrack(track({ property: 'motionPath', keyframes: [{ time: 0, value: 0 }] }))).toBe(false)
    expect(isNumericTrack(track({ keyframes: [] }))).toBe(false)
  })
})

describe('paddedRange', () => {
  it('pads the min/max by the given fraction', () => {
    const r = paddedRange([{ time: 0, value: 0 }, { time: 1, value: 100 }], 0.1)
    expect(r.vmin).toBeCloseTo(-10)
    expect(r.vmax).toBeCloseTo(110)
  })

  it('centers a flat track in a ±1 band', () => {
    const r = paddedRange([{ time: 0, value: 5 }, { time: 1, value: 5 }])
    expect(r).toEqual({ vmin: 4, vmax: 6 })
  })

  it('falls back to 0..1 for no numeric values', () => {
    expect(paddedRange([])).toEqual({ vmin: 0, vmax: 1 })
  })
})

describe('easingToBezierPoints', () => {
  it('returns a cubic-bezier easing\'s own points', () => {
    expect(
      easingToBezierPoints({ type: 'cubic-bezier', points: [0.1, 0.2, 0.3, 0.4] })
    ).toEqual([0.1, 0.2, 0.3, 0.4])
  })

  it('maps a named easing to its approximation', () => {
    expect(easingToBezierPoints('ease-out')).toEqual([0, 0, 0.58, 1])
  })

  it('falls back to a straight line for undefined/unknown', () => {
    expect(easingToBezierPoints(undefined)).toEqual([0, 0, 1, 1])
  })
})

describe('sampleCurve', () => {
  it('returns [] for an empty track', () => {
    expect(sampleCurve([], 1000)).toEqual([])
  })

  it('adds a flat lead-in and tail-out around the keyframes', () => {
    const pts = sampleCurve([{ time: 200, value: 10 }, { time: 800, value: 20 }], 1000, 4)
    // Starts at t=0 holding the first value…
    expect(pts[0]).toEqual({ time: 0, value: 10 })
    expect(pts[1]).toEqual({ time: 200, value: 10 })
    // …and ends holding the last value out to endTime.
    expect(pts[pts.length - 1]).toEqual({ time: 1000, value: 20 })
  })

  it('samples a linear segment as a straight ramp', () => {
    // No easing => linear. Midpoint of a 0→100 ramp should be 50.
    const pts = sampleCurve([{ time: 0, value: 0 }, { time: 100, value: 100 }], 100, 2)
    const mid = pts.find((p) => p.time === 50)
    expect(mid?.value).toBeCloseTo(50)
  })

  it('applies easing so the curve is not linear', () => {
    // ease-in-out is symmetric: at the midpoint it still passes through 50,
    // but before the midpoint it lags a linear ramp.
    const pts = sampleCurve(
      [{ time: 0, value: 0 }, { time: 100, value: 100 }],
      100,
      4,
      // default samples path uses kf.easing
    )
    void pts
    const eased = sampleCurve(
      [{ time: 0, value: 0 }, { time: 100, value: 100, easing: 'ease-in-out' }],
      100,
      4
    )
    const quarter = eased.find((p) => p.time === 25)
    // At 25% time, an ease-in-out curve is below the linear value of 25.
    expect(quarter!.value).toBeLessThan(25)
  })
})

describe('sampleSpringCurve', () => {
  const spring = (overrides = {}): SpringTrack => ({
    id: 's',
    target: 'box',
    property: 'scale',
    kind: 'spring',
    spring: { from: 0, to: 100 },
    ...overrides,
  })

  it('starts at the spring start value', () => {
    const pts = sampleSpringCurve(spring(), 2000)
    expect(pts[0]).toEqual({ time: 0, value: 0 })
  })

  it('ends at the resting value', () => {
    const pts = sampleSpringCurve(spring(), 5000)
    expect(pts[pts.length - 1].value).toBe(100)
  })

  it('extends a flat tail to endTime', () => {
    const pts = sampleSpringCurve(spring(), 5000)
    expect(pts[pts.length - 1].time).toBe(5000)
  })

  it('holds the start value through a delay', () => {
    const pts = sampleSpringCurve(spring({ delay: 300 }), 3000)
    expect(pts[0]).toEqual({ time: 0, value: 0 })
    expect(pts[1]).toEqual({ time: 300, value: 0 })
  })

  it('produces times in ascending order', () => {
    const times = sampleSpringCurve(spring(), 3000).map((p) => p.time)
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('matches what the engine plays back', () => {
    const track = spring()
    const sampler = new SpringSampler(track.spring)
    const pts = sampleSpringCurve(track, 3000)

    // Pick a mid-curve sample and check it against the engine's own value.
    const mid = pts[Math.floor(pts.length / 3)]
    expect(mid.value).toBeCloseTo(sampler.valueAt(mid.time), 10)
  })

  it('captures the overshoot of an underdamped spring', () => {
    const pts = sampleSpringCurve(spring({ spring: { from: 0, to: 100, stiffness: 200, damping: 4 } }), 4000)
    expect(Math.max(...pts.map((p) => p.value))).toBeGreaterThan(100)
  })

  it('is deterministic', () => {
    expect(sampleSpringCurve(spring(), 3000)).toEqual(sampleSpringCurve(spring(), 3000))
  })
})

describe('springRange', () => {
  const spring: SpringTrack = {
    id: 's',
    target: 'box',
    property: 'x',
    kind: 'spring',
    spring: { from: 0, to: 100, stiffness: 200, damping: 4 },
  }

  it('covers the overshoot, not just from/to', () => {
    // An underdamped spring exceeds its target; a range taken from `to` alone
    // would clip the curve out of the lane.
    expect(springRange(spring, 4000).vmax).toBeGreaterThan(100)
  })

  it('pads below the minimum', () => {
    expect(springRange(spring, 4000).vmin).toBeLessThanOrEqual(0)
  })
})

describe('isGraphableTrack', () => {
  it('accepts a numeric keyframe track', () => {
    expect(isGraphableTrack(track({ keyframes: [{ time: 0, value: 0 }, { time: 1, value: 1 }] }))).toBe(true)
  })

  it('accepts a spring track', () => {
    expect(
      isGraphableTrack({
        id: 's', target: 'b', property: 'x', kind: 'spring', spring: { from: 0, to: 1 },
      })
    ).toBe(true)
  })

  it('rejects a colour track', () => {
    expect(isGraphableTrack(track({ property: 'fill', keyframes: [{ time: 0, value: '#fff' }] }))).toBe(false)
  })
})

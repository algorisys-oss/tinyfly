import { describe, it, expect } from 'vitest'
import { isNumericTrack, paddedRange, sampleCurve, easingToBezierPoints } from './curve-math'
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

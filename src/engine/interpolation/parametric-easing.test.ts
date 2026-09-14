import { describe, it, expect } from 'vitest'
import { getEasingFunction } from './easing'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'
import { toKeyframedTracks } from '../core/bake'
import { deserializeTimeline } from '../serialization'
import type { EasingType } from '../types'

/** Parametric eases: steps, elastic, bounce and back, evaluated at play time. */

const sample = (easing: EasingType, count = 200) => Array.from({ length: count + 1 }, (_, i) => getEasingFunction(easing)(i / count))

describe('parametric eases', () => {
  it('start at 0 and end at 1 in every mode', () => {
    const eases: EasingType[] = [
      { type: 'elastic' },
      { type: 'elastic', mode: 'in', amplitude: 1.5, period: 0.4 },
      { type: 'elastic', mode: 'in-out' },
      { type: 'bounce' },
      { type: 'bounce', mode: 'in' },
      { type: 'bounce', mode: 'in-out' },
      { type: 'back', overshoot: 3 },
      { type: 'back', mode: 'in-out' },
    ]
    for (const easing of eases) {
      const values = sample(easing)
      expect(values[0], JSON.stringify(easing)).toBeCloseTo(0, 6)
      expect(values[values.length - 1], JSON.stringify(easing)).toBeCloseTo(1, 6)
    }
  })

  it('elastic out overshoots, and more with a larger amplitude', () => {
    const peak = (amplitude: number) => Math.max(...sample({ type: 'elastic', amplitude }))
    expect(peak(1)).toBeGreaterThan(1)
    expect(peak(2)).toBeGreaterThan(peak(1))
  })

  it('back in dips below 0 by the overshoot; bounce out never goes past 1', () => {
    expect(Math.min(...sample({ type: 'back', mode: 'in', overshoot: 1.70158 }))).toBeLessThan(-0.05)
    expect(Math.max(...sample({ type: 'bounce' }))).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('steps follow CSS jump positions', () => {
    const at = (position: 'start' | 'end' | 'none' | 'both', t: number) => getEasingFunction({ type: 'steps', count: 4, position })(t)
    expect([0.1, 0.3, 0.6, 0.9].map((t) => at('end', t))).toEqual([0, 0.25, 0.5, 0.75])
    expect([0.1, 0.3, 0.6, 0.9].map((t) => at('start', t))).toEqual([0.25, 0.5, 0.75, 1])
    expect([0.1, 0.3, 0.6, 0.9].map((t) => at('none', t))).toEqual([0, 1 / 3, 2 / 3, 1])
    expect([0.1, 0.3, 0.6, 0.9].map((t) => at('both', t))).toEqual([0.2, 0.4, 0.6, 0.8])
    expect(at('end', 1)).toBe(1)
  })

  it('round-trip through JSON and play the same', () => {
    const timeline = new Timeline({ id: 't', config: { duration: 1000 } })
    timeline.addTrack(createTrack({ id: 'x', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 100, easing: { type: 'elastic', mode: 'out', amplitude: 1.2 } }] }))
    const copy = deserializeTimeline(JSON.parse(JSON.stringify(timeline.toDefinition())))
    for (const time of [100, 250, 400, 800]) {
      expect(copy.getStateAtTime(time).values.get('box')!.get('x')).toBeCloseTo(timeline.getStateAtTime(time).values.get('box')!.get('x') as number, 9)
    }
  })

  it('are sampled into linear keyframes for keyframe-only exports', () => {
    const track = createTrack({ id: 'x', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 50, easing: 'ease-out' }, { time: 1000, value: 100, easing: { type: 'bounce' } }] })
    const [expanded] = toKeyframedTracks([track])
    expect(expanded.keyframes[1]).toEqual(track.keyframes[1])
    expect(expanded.keyframes.length).toBeGreaterThan(20)
    expect(expanded.keyframes.slice(2).every((kf) => kf.easing === 'linear')).toBe(true)
    expect(expanded.keyframes[expanded.keyframes.length - 1].value).toBe(100)
  })
})

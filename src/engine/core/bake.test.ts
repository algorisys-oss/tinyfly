import { describe, it, expect } from 'vitest'
import { bakeSpringTrack, bakeEasing, toKeyframedTrack, toKeyframedTracks, simplifyKeyframes } from './bake'
import { createTrack } from './track'
import type { SpringTrack, Keyframe } from '../types'

const springTrack: SpringTrack = {
  id: 'spring-1',
  target: 'box',
  property: 'x',
  kind: 'spring',
  spring: { from: 0, to: 100 },
}

describe('bakeSpringTrack', () => {
  it('produces an ordinary keyframe track', () => {
    const baked = bakeSpringTrack(springTrack)
    expect(baked.id).toBe('spring-1')
    expect(baked.target).toBe('box')
    expect(baked.property).toBe('x')
    expect(baked.keyframes.length).toBeGreaterThan(2)
  })

  it('starts at the spring start and ends exactly on the target', () => {
    const kfs = bakeSpringTrack(springTrack).keyframes
    expect(kfs[0].value).toBe(0)
    expect(kfs[kfs.length - 1].value).toBe(100)
  })

  it('uses linear easing between samples (the curve is in the sampling)', () => {
    const kfs = bakeSpringTrack(springTrack).keyframes
    expect(kfs.every((k) => k.easing === 'linear')).toBe(true)
  })

  it('keeps keyframes sorted', () => {
    const kfs = bakeSpringTrack(springTrack).keyframes
    const times = kfs.map((k) => k.time)
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('holds the start value through a delay', () => {
    const kfs = bakeSpringTrack({ ...springTrack, delay: 200 }).keyframes
    expect(kfs[0].time).toBe(0)
    expect(kfs[0].value).toBe(0)
    expect(kfs[1].time).toBeGreaterThanOrEqual(200)
  })

  it('is deterministic', () => {
    expect(bakeSpringTrack(springTrack)).toEqual(bakeSpringTrack(springTrack))
  })

  it('carries stagger settings through', () => {
    const baked = bakeSpringTrack({ ...springTrack, targets: ['a', 'b'], stagger: { each: 50 } })
    expect(baked.targets).toEqual(['a', 'b'])
    expect(baked.stagger).toEqual({ each: 50 })
  })

  it('emits fewer keyframes at a coarser interval', () => {
    const fine = bakeSpringTrack(springTrack, { intervalMs: 4, tolerance: 0 })
    const coarse = bakeSpringTrack(springTrack, { intervalMs: 32, tolerance: 0 })
    expect(coarse.keyframes.length).toBeLessThan(fine.keyframes.length)
  })

  it('rejects a non-spring track', () => {
    const plain = createTrack({ id: 't', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }] })
    expect(() => bakeSpringTrack(plain)).toThrow(/not a spring track/)
  })
})

describe('bakeEasing', () => {
  const from: Keyframe<number> = { time: 0, value: 0 }
  const to: Keyframe<number> = { time: 100, value: 100 }

  it('samples a segment into intermediate keyframes', () => {
    const out = bakeEasing(from, to, 'ease-in-out', { intervalMs: 25 })
    expect(out.length).toBeGreaterThan(1)
    expect(out[out.length - 1].time).toBe(100)
    expect(out[out.length - 1].value).toBe(100)
  })

  it('accepts a raw easing function — this is how elastic/bounce are handled', () => {
    // An overshooting ease: no single cubic-bezier can express this, so it must
    // be baked into keyframes.
    const overshoot = (t: number) => t * (2.5 - 1.5 * t) * 1.2
    const out = bakeEasing(from, to, overshoot, { intervalMs: 10 })
    expect(Math.max(...out.map((k) => k.value))).toBeGreaterThan(100)
  })

  it('marks baked keyframes linear', () => {
    const out = bakeEasing(from, to, 'ease-in', { intervalMs: 20 })
    expect(out.every((k) => k.easing === 'linear')).toBe(true)
  })

  it('returns just the endpoint for a zero-length segment', () => {
    expect(bakeEasing(from, { time: 0, value: 50 }, 'ease-in')).toEqual([{ time: 0, value: 50 }])
  })
})

describe('toKeyframedTrack', () => {
  it('passes an ordinary track through untouched', () => {
    const plain = createTrack({ id: 't', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }] })
    expect(toKeyframedTrack(plain)).toBe(plain)
  })

  it('bakes a spring track', () => {
    const out = toKeyframedTrack(springTrack)
    expect('keyframes' in out).toBe(true)
  })
})

describe('toKeyframedTracks', () => {
  it('returns every track in keyframed form', () => {
    const plain = createTrack({ id: 'p', target: 'box', property: 'y', keyframes: [{ time: 0, value: 0 }] })
    const out = toKeyframedTracks([plain, springTrack])
    expect(out).toHaveLength(2)
    expect(out.every((t) => 'keyframes' in t)).toBe(true)
  })
})

describe('simplifyKeyframes', () => {
  it('drops points that sit on a straight line', () => {
    const straight: Keyframe<number>[] = [
      { time: 0, value: 0 },
      { time: 50, value: 50 },
      { time: 100, value: 100 },
    ]
    expect(simplifyKeyframes(straight, 0.01)).toHaveLength(2)
  })

  it('keeps points that deviate', () => {
    const curved: Keyframe<number>[] = [
      { time: 0, value: 0 },
      { time: 50, value: 90 },
      { time: 100, value: 100 },
    ]
    expect(simplifyKeyframes(curved, 0.01)).toHaveLength(3)
  })

  it('always keeps the endpoints', () => {
    const out = simplifyKeyframes(
      [
        { time: 0, value: 0 },
        { time: 25, value: 25 },
        { time: 50, value: 50 },
        { time: 100, value: 100 },
      ],
      0.01
    )
    expect(out[0].time).toBe(0)
    expect(out[out.length - 1].time).toBe(100)
  })

  it('leaves short lists alone', () => {
    const two: Keyframe<number>[] = [{ time: 0, value: 0 }, { time: 10, value: 1 }]
    expect(simplifyKeyframes(two, 1)).toBe(two)
  })
})

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage } from './stage'
import { expandKeyframes } from './keyframes-vars'

let live: LiveApi
const at = (tl: ReturnType<LiveApi['to']>, name: string, property: string, seconds: number) =>
  tl.timeline.getStateAtTime(seconds * 1000).values.get(name)?.get(property)

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div><i class="dot"></i><i class="dot"></i>'
  live = createLive(new Stage({ scheduler: { request: () => 1, cancel: () => {} } }))
})

describe('expandKeyframes', () => {
  it('shares duration across percentages, easing each with easeEach', () => {
    const segments = expandKeyframes({ duration: 2, easeEach: 'none', keyframes: { '0%': { x: 0 }, '25%': { x: 100 }, '100%': { x: 0, ease: 'power2.out' } } })
    expect(segments.map((s) => [s.duration, s.ease, s.x])).toEqual([
      [0, 'none', 0],
      [0.5, 'none', 100],
      [1.5, 'power2.out', 0],
    ])
  })

  it('spreads value arrays evenly', () => {
    const segments = expandKeyframes({ duration: 1, keyframes: { x: [100, 0, 50], y: [10, 20] } })
    expect(segments.map((s) => [s.duration, s.x, s.y])).toEqual([
      [1 / 3, 100, 10],
      [1 / 3, 0, 20],
      [1 / 3, 50, undefined],
    ])
    expect(segments[0].ease).toBe('power1.inOut')
  })
})

describe('keyframes on live', () => {
  it('plays array keyframes one after another', () => {
    const tl = live.to('#box', { keyframes: [{ x: 100, duration: 1, ease: 'none' }, { y: 50, duration: 0.5, ease: 'none' }], paused: true })
    const [name] = live.stage.resolveTargets('#box')
    expect(tl.duration()).toBe(1.5)
    expect(at(tl, name, 'x', 0.5)).toBeCloseTo(50)
    expect(at(tl, name, 'y', 1.25)).toBeCloseTo(25)
    expect(at(tl, name, 'x', 1.5)).toBeCloseTo(100)
  })

  it('places percentage keyframes within the duration, after a delay', () => {
    const tl = live.to('#box', { duration: 2, delay: 1, easeEach: 'none', keyframes: { '0%': { x: 0 }, '50%': { x: 200 }, '100%': { x: 100 } }, paused: true })
    const [name] = live.stage.resolveTargets('#box')
    expect(tl.duration()).toBe(3)
    expect(at(tl, name, 'x', 1.5)).toBeCloseTo(100)
    expect(at(tl, name, 'x', 2)).toBeCloseTo(200)
    expect(at(tl, name, 'x', 3)).toBeCloseTo(100)
  })

  it('staggers the whole sequence per target', () => {
    const tl = live.to('.dot', { keyframes: { x: [100, 0] }, easeEach: 'none', duration: 1, stagger: 0.5, paused: true })
    const [first, second] = live.stage.resolveTargets('.dot')
    expect(tl.duration()).toBe(1.5)
    expect(at(tl, first, 'x', 0.5)).toBeCloseTo(100)
    expect(at(tl, second, 'x', 0.5)).toBeCloseTo(0)
    expect(at(tl, second, 'x', 1)).toBeCloseTo(100)
  })
})

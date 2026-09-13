import { describe, it, expect, vi } from 'vitest'
import { CustomEase, CustomBounce, CustomWiggle, timeline } from './index'

describe('CustomEase / CustomBounce / CustomWiggle', () => {
  it('a registered single-cubic curve compiles to an exact cubic-bezier keyframe', () => {
    CustomEase.create('snappyIn', 'M0,0 C0.7,0 0.9,0.4 1,1')
    const tl = timeline()
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'snappyIn' })
    const keyframes = (tl.timeline.tracks[0] as { keyframes: { easing?: unknown }[] }).keyframes
    expect(keyframes).toHaveLength(2)
    expect(keyframes[1].easing).toEqual({ type: 'cubic-bezier', points: [0.7, 0, 0.9, 0.4] })
  })

  it('other curves are sampled into keyframes even without bakeEases, with no fallback warning', () => {
    CustomBounce.create('drop', { strength: 0.6 })
    const warn = vi.fn()
    const tl = timeline({ onWarning: warn })
    tl.fromTo('ball', { y: 0 }, { y: 300, duration: 1, ease: 'drop' })
    const keyframes = (tl.timeline.tracks[0] as { keyframes: { value: number }[] }).keyframes
    expect(keyframes.length).toBeGreaterThan(20)
    expect(keyframes.at(-1)!.value).toBe(300)
    expect(warn).not.toHaveBeenCalled()
    // It really bounces: the value turns back upward (away from 300) several times.
    const values = keyframes.map((k) => k.value)
    let rebounds = 0
    for (let i = 2; i < values.length; i++) {
      if (values[i - 1] > values[i - 2] && values[i] < values[i - 1]) rebounds++
    }
    expect(rebounds).toBeGreaterThanOrEqual(3)
  })

  it('a wiggle swings around the start and returns to it', () => {
    CustomWiggle.create('shake', { wiggles: 6 })
    const tl = timeline()
    tl.fromTo('card', { rotate: 0 }, { rotate: 20, duration: 1, ease: 'shake' })
    const values = (tl.timeline.tracks[0] as { keyframes: { value: number }[] }).keyframes.map((k) => k.value)
    expect(values.at(-1)).toBeCloseTo(0)
    expect(Math.max(...values)).toBeGreaterThan(10)
    expect(Math.min(...values)).toBeLessThan(-10)
  })

  it('names are case-insensitive and create returns the name', () => {
    expect(CustomEase.create('MyEase', [0.1, 0.2, 0.3, 1])).toBe('MyEase')
    const tl = timeline()
    tl.to('b', { x: 1, ease: 'myease' })
    expect((tl.timeline.tracks[0] as { keyframes: { easing?: unknown }[] }).keyframes[1].easing).toEqual({ type: 'cubic-bezier', points: [0.1, 0.2, 0.3, 1] })
  })
})

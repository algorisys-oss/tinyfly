import { describe, it, expect, vi } from 'vitest'
import { snapProgress, snapDuration, snapConfig, ScrollAnimator } from './scroll-snap'
import { containerProgressAt } from './scroll-math'

describe('snapProgress', () => {
  it('snaps to the nearest step, list point, or what a function chooses', () => {
    expect(snapProgress(0.3, 0, 0.25)).toBe(0.25)
    expect(snapProgress(0.4, 0, 0.25)).toBe(0.5)
    expect(snapProgress(0.62, 0, [0, 0.4, 0.9])).toBe(0.4)
    expect(snapProgress(0.62, 0, (p) => (p > 0.5 ? 1 : 0))).toBe(1)
  })

  it('lets a flick carry on to the next point instead of falling back', () => {
    expect(snapProgress(0.3, 0, [0, 0.5, 1])).toBe(0.5) // nearest anyway
    expect(snapProgress(0.2, 0, [0, 0.5, 1])).toBe(0)
    expect(snapProgress(0.2, 2, [0, 0.5, 1])).toBe(0.5) // moving on at 2 progress/s
  })

  it('clamps to the range', () => {
    expect(snapProgress(0.9, 5, 0.25)).toBe(1)
    expect(snapProgress(0.1, -5, () => -2)).toBe(0)
  })
})

describe('snapDuration and snapConfig', () => {
  it('scales between min and max by distance, or uses a fixed duration', () => {
    expect(snapDuration({ snapTo: 1 }, 0, 1000)).toBeCloseTo(0.2)
    expect(snapDuration({ snapTo: 1 }, 1000, 1000)).toBeCloseTo(0.8)
    expect(snapDuration({ snapTo: 1, duration: 0.5 }, 5000, 1000)).toBe(0.5)
    expect(snapConfig([0, 1])).toEqual({ snapTo: [0, 1] })
    expect(snapConfig({ snapTo: 0.5, delay: 0.1 })).toEqual({ snapTo: 0.5, delay: 0.1 })
  })
})

describe('ScrollAnimator', () => {
  it('animates the offset over the duration and stops when the person scrolls', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => frames.splice(0))
    const target = new EventTarget()
    const writes: number[] = []
    const animator = new ScrollAnimator((y) => writes.push(y), target)

    animator.animate(0, 100, 0.2, (t) => t)
    frames.shift()!(0)
    frames.shift()!(100)
    expect(writes.at(-1)).toBeCloseTo(50)
    expect(animator.active).toBe(true)

    target.dispatchEvent(new Event('wheel'))
    expect(animator.active).toBe(false)
    expect(frames).toHaveLength(0)
    vi.unstubAllGlobals()
  })
})

describe('containerProgressAt', () => {
  // A 1000px track moving from x = 0 to x = -2000 across its progress; a 100px item
  // sits 1500px along it, in an 800px-wide viewport.
  const shift = (p: number) => -2000 * p

  it('finds when an edge of the item reaches a viewport edge', () => {
    // left edge reaches the right edge (800): 1500 - 2000p = 800 → p = 0.35
    expect(containerProgressAt(1500, 100, 800, 'left right', shift)).toBeCloseTo(0.35, 6)
    // centre at centre: 1550 - 2000p = 400 → p = 0.575
    expect(containerProgressAt(1500, 100, 800, 'center center', shift)).toBeCloseTo(0.575, 6)
  })

  it('returns 0 or 1 when the position is outside the travel', () => {
    expect(containerProgressAt(100, 100, 800, 'left right', shift)).toBe(0) // already past at rest
    expect(containerProgressAt(5000, 100, 800, 'left right', shift)).toBe(1) // never reached
  })
})

import { describe, it, expect } from 'vitest'
import {
  parseEdge,
  parseTrigger,
  triggerDistance,
  scrollProgress,
  smoothToward,
  clamp01,
} from './scroll-math'

const VH = 1000
const rect = (top: number, height = 500) => ({ top, bottom: top + height, height })

describe('parseEdge', () => {
  it('maps keywords to fractions', () => {
    expect(parseEdge('top')).toBe(0)
    expect(parseEdge('center')).toBe(0.5)
    expect(parseEdge('bottom')).toBe(1)
  })

  it('accepts the British spelling of centre', () => {
    expect(parseEdge('centre')).toBe(0.5)
  })

  it('is case-insensitive and trims', () => {
    expect(parseEdge('  BOTTOM ')).toBe(1)
  })

  it('accepts percentages', () => {
    expect(parseEdge('25%')).toBe(0.25)
    expect(parseEdge('0%')).toBe(0)
  })

  it('returns undefined for nonsense', () => {
    expect(parseEdge('sideways')).toBeUndefined()
  })
})

describe('parseTrigger', () => {
  it('parses a two-token position', () => {
    expect(parseTrigger('top bottom')).toEqual({
      elementFraction: 0,
      viewportFraction: 1,
      offsetPx: 0,
    })
  })

  it('defaults the viewport edge to top', () => {
    expect(parseTrigger('center')).toMatchObject({ elementFraction: 0.5, viewportFraction: 0 })
  })

  it('pulls out a trailing relative offset', () => {
    expect(parseTrigger('top bottom+=100')).toMatchObject({
      elementFraction: 0,
      viewportFraction: 1,
      offsetPx: 100,
    })
  })

  it('pulls out a negative offset', () => {
    expect(parseTrigger('top bottom-=50')).toMatchObject({ offsetPx: -50 })
  })

  it('accepts an offset on the first token', () => {
    expect(parseTrigger('top+=25 bottom')).toMatchObject({
      elementFraction: 0,
      viewportFraction: 1,
      offsetPx: 25,
    })
  })

  it('treats a bare number as pixels from the element top', () => {
    expect(parseTrigger(300)).toMatchObject({ absolutePx: 300 })
    expect(parseTrigger('300')).toMatchObject({ absolutePx: 300 })
  })
})

describe('triggerDistance', () => {
  it('is 0 exactly when "top bottom" fires', () => {
    // Element top sitting on the viewport bottom.
    expect(triggerDistance(rect(1000), VH, 'top bottom')).toBe(0)
  })

  it('is positive while the trigger is still below the fold', () => {
    expect(triggerDistance(rect(1500), VH, 'top bottom')).toBe(500)
  })

  it('is negative once the trigger has passed', () => {
    expect(triggerDistance(rect(800), VH, 'top bottom')).toBe(-200)
  })

  it('measures the element bottom against the viewport top', () => {
    // "bottom top" fires when the element's bottom reaches y=0.
    expect(triggerDistance(rect(-500), VH, 'bottom top')).toBe(0)
  })

  it('applies a relative offset', () => {
    expect(triggerDistance(rect(1000), VH, 'top bottom+=100')).toBe(100)
  })

  it('honours an absolute pixel position', () => {
    expect(triggerDistance(rect(200), VH, 100)).toBe(300)
  })
})

describe('scrollProgress', () => {
  const start = 'top bottom'
  const end = 'bottom top'

  it('is 0 before the start trigger', () => {
    expect(scrollProgress(rect(1500), VH, start, end)).toBe(0)
  })

  it('is 0 exactly at the start trigger', () => {
    expect(scrollProgress(rect(1000), VH, start, end)).toBe(0)
  })

  it('is 1 exactly at the end trigger', () => {
    // Element bottom at the viewport top: top = -height.
    expect(scrollProgress(rect(-500), VH, start, end)).toBe(1)
  })

  it('is 1 after the end trigger', () => {
    expect(scrollProgress(rect(-900), VH, start, end)).toBe(1)
  })

  it('is 0.5 halfway through the span', () => {
    // Span is height + viewport = 1500; halfway is 750px of scrolling.
    expect(scrollProgress(rect(250), VH, start, end)).toBeCloseTo(0.5, 10)
  })

  it('increases monotonically as the element scrolls up', () => {
    const tops = [1500, 1000, 700, 250, 0, -250, -500, -900]
    const values = tops.map((t) => scrollProgress(rect(t), VH, start, end))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1])
    }
  })

  it('never leaves 0..1', () => {
    for (const top of [5000, 1000, 0, -5000]) {
      const p = scrollProgress(rect(top), VH, start, end)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('handles a degenerate range without dividing by zero', () => {
    expect(scrollProgress(rect(1500), VH, 'top top', 'top top')).toBe(0)
    expect(scrollProgress(rect(-100), VH, 'top top', 'top top')).toBe(1)
  })

  it('supports a fixed-pixel span', () => {
    // Start when the element top hits the viewport top, end 500px later.
    expect(scrollProgress(rect(0), VH, 'top top', 'top top+=500')).toBe(0)
    expect(scrollProgress(rect(-250), VH, 'top top', 'top top+=500')).toBeCloseTo(0.5, 10)
    expect(scrollProgress(rect(-500), VH, 'top top', 'top top+=500')).toBe(1)
  })

  it('is deterministic — the same geometry always gives the same progress', () => {
    const a = scrollProgress(rect(333), VH, start, end)
    const b = scrollProgress(rect(333), VH, start, end)
    expect(a).toBe(b)
  })
})

describe('smoothToward', () => {
  it('jumps straight to the target with no smoothing', () => {
    expect(smoothToward(0, 100, 0, 16)).toBe(100)
  })

  it('moves partway toward the target', () => {
    const next = smoothToward(0, 100, 0.5, 16)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(100)
  })

  it('converges on the target over many steps', () => {
    let value = 0
    for (let i = 0; i < 500; i++) value = smoothToward(value, 100, 0.3, 16)
    expect(value).toBeCloseTo(100, 5)
  })

  it('moves further in a longer frame', () => {
    expect(smoothToward(0, 100, 0.5, 32)).toBeGreaterThan(smoothToward(0, 100, 0.5, 16))
  })

  it('approaches from above too', () => {
    expect(smoothToward(100, 0, 0.5, 16)).toBeLessThan(100)
  })
})

describe('clamp01', () => {
  it('clamps both ends and passes the middle through', () => {
    expect(clamp01(-5)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(5)).toBe(1)
  })
})

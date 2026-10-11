import { describe, it, expect } from 'vitest'
import { curve } from './curve'

describe('curve', () => {
  it('reads keys at any input, holding beyond the ends and easing between', () => {
    const size = curve([{ at: 10, value: 0 }, { at: 20, value: 100, easing: 'ease-in' }, { at: 40, value: 50 }])
    expect(size(0)).toBe(0)
    expect(size(10)).toBe(0)
    expect(size(15)).toBeCloseTo(12.5, 9) // ease-in (cubic) at half way
    expect(size(20)).toBe(100)
    expect(size(30)).toBe(75)
    expect(size(99)).toBe(50)
  })

  it('blends colours and arrays, and sorts its keys', () => {
    const tint = curve([{ at: 100, value: '#ffffff' }, { at: 0, value: '#000000' }])
    expect(tint(50)).toMatch(/^(#808080|rgb\(128, 128, 128\))$/)
    const at = curve([{ at: 0, value: [0, 10] }, { at: 1, value: [10, 30] }])
    expect(at(0.5)).toEqual([5, 20])
    expect(curve([{ at: 3, value: 7 }])(-1)).toBe(7)
    expect(() => curve([])).toThrow(/at least one key/)
  })
})

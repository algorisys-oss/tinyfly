import { describe, it, expect } from 'vitest'
import { staggerDistance, maxStaggerDistance, staggerOffset, staggerOffsets, staggerSpan } from './stagger'

describe('staggerDistance', () => {
  it('counts up from the start by default', () => {
    expect([0, 1, 2, 3].map((i) => staggerDistance(i, 4))).toEqual([0, 1, 2, 3])
  })

  it('counts down from the end', () => {
    expect([0, 1, 2, 3].map((i) => staggerDistance(i, 4, 'end'))).toEqual([3, 2, 1, 0])
  })

  it('grows outward from the centre', () => {
    expect([0, 1, 2, 3, 4].map((i) => staggerDistance(i, 5, 'center'))).toEqual([2, 1, 0, 1, 2])
  })

  it('grows inward from the edges', () => {
    expect([0, 1, 2, 3, 4].map((i) => staggerDistance(i, 5, 'edges'))).toEqual([0, 1, 2, 1, 0])
  })

  it('measures from a numeric anchor', () => {
    expect([0, 1, 2, 3].map((i) => staggerDistance(i, 4, 1))).toEqual([1, 0, 1, 2])
  })

  it('clamps an out-of-range anchor', () => {
    expect([0, 1, 2].map((i) => staggerDistance(i, 3, 99))).toEqual([2, 1, 0])
  })

  it('is 0 for a single item', () => {
    expect(staggerDistance(0, 1, 'center')).toBe(0)
  })
})

describe('maxStaggerDistance', () => {
  it('matches the largest distance in the set', () => {
    expect(maxStaggerDistance(4, 'start')).toBe(3)
    expect(maxStaggerDistance(5, 'center')).toBe(2)
    expect(maxStaggerDistance(5, 'edges')).toBe(2)
  })
})

describe('staggerOffset', () => {
  it('spaces targets by `each`', () => {
    expect([0, 1, 2].map((i) => staggerOffset(i, 3, { each: 100 }))).toEqual([0, 100, 200])
  })

  it('spreads targets across a total `amount`', () => {
    expect([0, 1, 2].map((i) => staggerOffset(i, 3, { amount: 300 }))).toEqual([0, 150, 300])
  })

  it('prefers `amount` over `each` when both are given', () => {
    // GSAP resolves this the same way: amount wins.
    expect(staggerOffset(2, 3, { amount: 300, each: 999 })).toBe(300)
  })

  it('does nothing when the config specifies neither', () => {
    expect(staggerOffset(2, 3, {})).toBe(0)
  })

  it('honours `from`', () => {
    expect([0, 1, 2].map((i) => staggerOffset(i, 3, { each: 50, from: 'end' }))).toEqual([100, 50, 0])
  })
})

describe('staggerSpan', () => {
  it('reports how far a stagger extends a timeline', () => {
    expect(staggerSpan(4, { each: 100 })).toBe(300)
    expect(staggerSpan(4, { amount: 600 })).toBe(600)
    expect(staggerSpan(1, { each: 100 })).toBe(0)
  })

  it('matches the longest offset for centre fans', () => {
    expect(staggerSpan(5, { each: 10, from: 'center' })).toBe(20)
  })
})

describe('staggerOffsets', () => {
  it('returns one offset per target, in order', () => {
    expect(staggerOffsets(3, { each: 20 })).toEqual([0, 20, 40])
  })
})

import { describe, it, expect } from 'vitest'
import { createRandom, randomNormal, shuffled } from './random'

describe('randomNormal', () => {
  it('repeats for a seed and has the asked mean and spread', () => {
    const draw = (seed: number) => {
      const source = createRandom(seed)
      return Array.from({ length: 20000 }, () => randomNormal(source, 3, 2))
    }
    expect(draw(7).slice(0, 5)).toEqual(draw(7).slice(0, 5))
    const values = draw(11)
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
    expect(mean).toBeCloseTo(3, 1)
    expect(sd).toBeCloseTo(2, 1)
    expect(values.every(Number.isFinite)).toBe(true)
  })
})

describe('shuffled', () => {
  it('returns a reordered copy, the same for a seed, leaving the input alone', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = shuffled(createRandom(3), items)
    expect(a).toEqual(shuffled(createRandom(3), items))
    expect([...a].sort()).toEqual(items)
    expect(a).not.toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

import { describe, it, expect } from 'vitest'
import { createRandom, hashSeed, randomBetween, randomSnapped, randomChoice } from './random'
import {
  resolveValue,
  resolveSequence,
  isUnresolved,
  ValueResolver,
} from './resolve-values'

describe('createRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    const first = Array.from({ length: 10 }, () => a.next())
    const second = Array.from({ length: 10 }, () => b.next())
    expect(second).toEqual(first)
  })

  it('produces different sequences for different seeds', () => {
    expect(createRandom(1).next()).not.toBe(createRandom(2).next())
  })

  it('stays within [0, 1)', () => {
    const r = createRandom(7)
    for (let i = 0; i < 1000; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('survives a zero seed', () => {
    const r = createRandom(0)
    // xorshift locks up at state 0, so the constructor must substitute one.
    expect(r.next()).toBeGreaterThan(0)
  })

  it('records its seed', () => {
    expect(createRandom(123).seed).toBe(123)
  })
})

describe('hashSeed', () => {
  it('is stable for the same string', () => {
    expect(hashSeed('letter-drop')).toBe(hashSeed('letter-drop'))
  })

  it('differs for different strings', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'))
  })

  it('returns a non-negative 32-bit integer', () => {
    const h = hashSeed('anything at all')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(0xffffffff)
  })
})

describe('randomBetween', () => {
  it('stays within range', () => {
    const r = createRandom(3)
    for (let i = 0; i < 200; i++) {
      const v = randomBetween(r, -50, 50)
      expect(v).toBeGreaterThanOrEqual(-50)
      expect(v).toBeLessThan(50)
    }
  })
})

describe('randomSnapped', () => {
  it('returns multiples of the step', () => {
    const r = createRandom(5)
    for (let i = 0; i < 100; i++) {
      const v = randomSnapped(r, 0, 100, 25)
      expect([0, 25, 50, 75, 100]).toContain(v)
    }
  })

  it('measures steps from the minimum', () => {
    const r = createRandom(5)
    for (let i = 0; i < 100; i++) {
      expect(randomSnapped(r, 10, 50, 10) % 10).toBe(0)
    }
  })

  it('falls back to an unsnapped value for a non-positive step', () => {
    const v = randomSnapped(createRandom(5), 0, 10, 0)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(10)
  })
})

describe('randomChoice', () => {
  it('picks an item from the list', () => {
    const items = ['a', 'b', 'c']
    expect(items).toContain(randomChoice(createRandom(9), items))
  })

  it('returns undefined for an empty list', () => {
    expect(randomChoice(createRandom(9), [])).toBeUndefined()
  })
})

describe('isUnresolved', () => {
  it('recognises relative expressions', () => {
    expect(isUnresolved('+=100')).toBe(true)
    expect(isUnresolved('-=50')).toBe(true)
    expect(isUnresolved('*=2')).toBe(true)
  })

  it('recognises random expressions', () => {
    expect(isUnresolved('random(0, 100)')).toBe(true)
  })

  it('rejects ordinary values', () => {
    expect(isUnresolved(100)).toBe(false)
    expect(isUnresolved('#ff0000')).toBe(false)
    expect(isUnresolved('M0 0 L10 10')).toBe(false)
  })
})

describe('resolveValue — relative', () => {
  it('adds', () => {
    expect(resolveValue('+=100', { base: 50 })).toBe(150)
  })

  it('subtracts', () => {
    expect(resolveValue('-=20', { base: 50 })).toBe(30)
  })

  it('multiplies', () => {
    expect(resolveValue('*=3', { base: 5 })).toBe(15)
  })

  it('divides', () => {
    expect(resolveValue('/=2', { base: 10 })).toBe(5)
  })

  it('treats a missing base as 0', () => {
    expect(resolveValue('+=100')).toBe(100)
  })

  it('leaves the base alone rather than producing Infinity', () => {
    expect(resolveValue('/=0', { base: 10 })).toBe(10)
  })

  it('accepts a negative amount', () => {
    expect(resolveValue('+=-25', { base: 100 })).toBe(75)
  })

  it('tolerates surrounding whitespace', () => {
    expect(resolveValue('  += 40 ', { base: 10 })).toBe(50)
  })
})

describe('resolveValue — random', () => {
  it('resolves to a number inside the range', () => {
    const v = resolveValue('random(10, 20)', { random: createRandom(1) }) as number
    expect(v).toBeGreaterThanOrEqual(10)
    expect(v).toBeLessThan(20)
  })

  it('honours a snap step', () => {
    const v = resolveValue('random(0, 100, 50)', { random: createRandom(1) })
    expect([0, 50, 100]).toContain(v)
  })

  it('is reproducible from the same seed — the whole point', () => {
    const a = resolveValue('random(-100, 100)', { random: createRandom(77) })
    const b = resolveValue('random(-100, 100)', { random: createRandom(77) })
    expect(a).toBe(b)
  })

  it('throws when no random source is supplied', () => {
    expect(() => resolveValue('random(0, 1)')).toThrow(/needs a random source/)
  })
})

describe('resolveValue — pass-through', () => {
  it('leaves numbers alone', () => {
    expect(resolveValue(42)).toBe(42)
  })

  it('leaves colours alone', () => {
    expect(resolveValue('#ff0000')).toBe('#ff0000')
  })

  it('leaves arrays alone', () => {
    expect(resolveValue([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('leaves path data alone', () => {
    expect(resolveValue('M0 0 L100 100')).toBe('M0 0 L100 100')
  })
})

describe('resolveSequence', () => {
  it('threads each result forward as the next base', () => {
    expect(resolveSequence(['+=100', '+=100'], 0)).toEqual([100, 200])
  })

  it('starts from the given value', () => {
    expect(resolveSequence(['+=10'], 5)).toEqual([15])
  })

  it('mixes literal and relative values', () => {
    expect(resolveSequence([0, '+=50', 200, '-=100'])).toEqual([0, 50, 200, 100])
  })

  it('does not rebase on non-numeric values', () => {
    expect(resolveSequence(['#fff', '+=10'], 5)).toEqual(['#fff', 15])
  })
})

describe('ValueResolver', () => {
  it('gives identical output for identical seeds', () => {
    const build = () => {
      const r = new ValueResolver(2024)
      return [r.resolve('random(0, 100)'), r.resolve('random(0, 100)'), r.resolve('random(0, 100)')]
    }
    expect(build()).toEqual(build())
  })

  it('exposes the seed so it can be stored with the timeline', () => {
    expect(new ValueResolver(99).seed).toBe(99)
  })

  it('advances the sequence across calls rather than repeating', () => {
    const r = new ValueResolver(11)
    expect(r.resolve('random(0, 1000)')).not.toBe(r.resolve('random(0, 1000)'))
  })

  it('resolves sequences with a shared random stream', () => {
    const r = new ValueResolver(4)
    const out = r.resolveSequence([0, '+=100', 'random(0, 10)'])
    expect(out[0]).toBe(0)
    expect(out[1]).toBe(100)
    expect(out[2]).toBeGreaterThanOrEqual(0)
  })

  it('produces plain numbers, so the result is serializable', () => {
    const r = new ValueResolver(5)
    const values = r.resolveSequence(['+=10', 'random(0, 50)'])
    expect(JSON.parse(JSON.stringify(values))).toEqual(values)
    expect(values.every((v) => typeof v === 'number')).toBe(true)
  })
})

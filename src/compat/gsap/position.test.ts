import { describe, it, expect } from 'vitest'
import { resolvePosition, type PositionContext } from './position'

const context = (overrides: Partial<PositionContext> = {}): PositionContext => ({
  cursor: 1000,
  previousStart: 400,
  previousEnd: 900,
  labels: new Map([['intro', 250], ['outro', 2000]]),
  ...overrides,
})

describe('resolvePosition', () => {
  it('appends at the cursor when omitted', () => {
    expect(resolvePosition(undefined, context())).toBe(1000)
  })

  it('appends at the cursor for an empty string', () => {
    expect(resolvePosition('   ', context())).toBe(1000)
  })

  it('takes a number as an absolute time', () => {
    expect(resolvePosition(300, context())).toBe(300)
  })

  it('takes a numeric string as an absolute time', () => {
    expect(resolvePosition('300', context())).toBe(300)
  })

  describe('relative to the timeline end', () => {
    it('adds with +=', () => {
      expect(resolvePosition('+=200', context())).toBe(1200)
    })

    it('subtracts with -= — the overlap idiom', () => {
      expect(resolvePosition('-=300', context())).toBe(700)
    })

    it('tolerates whitespace', () => {
      expect(resolvePosition('+= 150', context())).toBe(1150)
    })
  })

  describe('relative to the previous tween', () => {
    it('< is the previous start', () => {
      expect(resolvePosition('<', context())).toBe(400)
    })

    it('> is the previous end', () => {
      expect(resolvePosition('>', context())).toBe(900)
    })

    it('<n offsets from the previous start', () => {
      expect(resolvePosition('<+=100', context())).toBe(500)
      expect(resolvePosition('<-=100', context())).toBe(300)
    })

    it('>n offsets from the previous end', () => {
      expect(resolvePosition('>+=250', context())).toBe(1150)
    })

    it('accepts a bare number after the marker', () => {
      expect(resolvePosition('<100', context())).toBe(500)
    })
  })

  describe('labels', () => {
    it('resolves a label to its time', () => {
      expect(resolvePosition('intro', context())).toBe(250)
    })

    it('offsets from a label', () => {
      expect(resolvePosition('intro+=100', context())).toBe(350)
      expect(resolvePosition('outro-=500', context())).toBe(1500)
    })

    it('falls back to the cursor for an unknown label', () => {
      expect(resolvePosition('nowhere', context())).toBe(1000)
    })
  })

  it('handles a zero cursor at the start of a timeline', () => {
    expect(resolvePosition('+=100', context({ cursor: 0 }))).toBe(100)
  })

  it('allows a negative result', () => {
    expect(resolvePosition('-=2000', context())).toBe(-1000)
  })
})

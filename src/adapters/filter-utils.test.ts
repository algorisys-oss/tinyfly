import { describe, it, expect } from 'vitest'
import { composeFilter, FILTER_PROPERTIES } from './filter-utils'

describe('composeFilter', () => {
  it('returns null when no filter properties are present', () => {
    expect(composeFilter({})).toBeNull()
  })

  it('composes a blur filter', () => {
    expect(composeFilter({ blur: 8 })).toBe('blur(8px)')
  })

  it('clamps negative blur to 0', () => {
    expect(composeFilter({ blur: -5 })).toBe('blur(0px)')
  })

  it('composes a brightness filter', () => {
    expect(composeFilter({ brightness: 1.5 })).toBe('brightness(1.5)')
  })

  it('composes a glow as a zero-offset drop-shadow with default colour', () => {
    expect(composeFilter({ glow: 10 })).toBe('drop-shadow(0 0 10px #ffffff)')
  })

  it('uses the provided glow colour', () => {
    expect(composeFilter({ glow: 12, glowColor: '#66d9ff' })).toBe(
      'drop-shadow(0 0 12px #66d9ff)'
    )
  })

  it('composes a drop shadow from offset + blur + colour', () => {
    expect(
      composeFilter({ shadowX: 4, shadowY: 6, shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' })
    ).toBe('drop-shadow(4px 6px 8px rgba(0,0,0,0.5))')
  })

  it('defaults missing shadow parts', () => {
    expect(composeFilter({ shadowBlur: 5 })).toBe('drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.5))')
  })

  it('combines multiple filters in order', () => {
    expect(composeFilter({ blur: 2, glow: 6, glowColor: '#fff' })).toBe(
      'blur(2px) drop-shadow(0 0 6px #fff)'
    )
  })

  it('exposes all filter property names', () => {
    expect(FILTER_PROPERTIES.has('blur')).toBe(true)
    expect(FILTER_PROPERTIES.has('glow')).toBe(true)
    expect(FILTER_PROPERTIES.has('glowColor')).toBe(true)
    expect(FILTER_PROPERTIES.has('shadowBlur')).toBe(true)
  })
})

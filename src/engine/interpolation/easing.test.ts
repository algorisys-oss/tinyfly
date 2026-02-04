import { describe, it, expect } from 'vitest'
import {
  linear,
  easeIn,
  easeOut,
  easeInOut,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  getEasingFunction,
} from './easing'

describe('easing functions', () => {
  describe('boundary conditions', () => {
    const easingFunctions = [
      { name: 'linear', fn: linear },
      { name: 'easeIn', fn: easeIn },
      { name: 'easeOut', fn: easeOut },
      { name: 'easeInOut', fn: easeInOut },
      { name: 'easeInQuad', fn: easeInQuad },
      { name: 'easeOutQuad', fn: easeOutQuad },
      { name: 'easeInOutQuad', fn: easeInOutQuad },
      { name: 'easeInCubic', fn: easeInCubic },
      { name: 'easeOutCubic', fn: easeOutCubic },
      { name: 'easeInOutCubic', fn: easeInOutCubic },
    ]

    easingFunctions.forEach(({ name, fn }) => {
      it(`${name} should return 0 when t=0`, () => {
        expect(fn(0)).toBe(0)
      })

      it(`${name} should return 1 when t=1`, () => {
        expect(fn(1)).toBe(1)
      })

      it(`${name} should return value between 0 and 1 for t=0.5`, () => {
        const result = fn(0.5)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('linear', () => {
    it('should return input unchanged', () => {
      expect(linear(0.25)).toBe(0.25)
      expect(linear(0.5)).toBe(0.5)
      expect(linear(0.75)).toBe(0.75)
    })
  })

  describe('easeInQuad', () => {
    it('should accelerate (slower at start)', () => {
      expect(easeInQuad(0.5)).toBeLessThan(0.5)
    })

    it('should follow t^2 curve', () => {
      expect(easeInQuad(0.5)).toBeCloseTo(0.25)
      expect(easeInQuad(0.25)).toBeCloseTo(0.0625)
    })
  })

  describe('easeOutQuad', () => {
    it('should decelerate (faster at start)', () => {
      expect(easeOutQuad(0.5)).toBeGreaterThan(0.5)
    })

    it('should follow 1-(1-t)^2 curve', () => {
      expect(easeOutQuad(0.5)).toBeCloseTo(0.75)
    })
  })

  describe('easeInOutQuad', () => {
    it('should be at 0.5 when t=0.5', () => {
      expect(easeInOutQuad(0.5)).toBeCloseTo(0.5)
    })

    it('should accelerate in first half', () => {
      expect(easeInOutQuad(0.25)).toBeLessThan(0.25)
    })

    it('should decelerate in second half', () => {
      expect(easeInOutQuad(0.75)).toBeGreaterThan(0.75)
    })
  })

  describe('easeInCubic', () => {
    it('should follow t^3 curve', () => {
      expect(easeInCubic(0.5)).toBeCloseTo(0.125)
    })
  })

  describe('easeOutCubic', () => {
    it('should follow 1-(1-t)^3 curve', () => {
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
    })
  })

  describe('easeInOutCubic', () => {
    it('should be at 0.5 when t=0.5', () => {
      expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
    })
  })

  describe('getEasingFunction', () => {
    it('should return linear for "linear"', () => {
      expect(getEasingFunction('linear')).toBe(linear)
    })

    it('should return easeIn for "ease-in"', () => {
      expect(getEasingFunction('ease-in')).toBe(easeIn)
    })

    it('should return easeOut for "ease-out"', () => {
      expect(getEasingFunction('ease-out')).toBe(easeOut)
    })

    it('should return easeInOut for "ease-in-out"', () => {
      expect(getEasingFunction('ease-in-out')).toBe(easeInOut)
    })

    it('should return correct quad functions', () => {
      expect(getEasingFunction('ease-in-quad')).toBe(easeInQuad)
      expect(getEasingFunction('ease-out-quad')).toBe(easeOutQuad)
      expect(getEasingFunction('ease-in-out-quad')).toBe(easeInOutQuad)
    })

    it('should return correct cubic functions', () => {
      expect(getEasingFunction('ease-in-cubic')).toBe(easeInCubic)
      expect(getEasingFunction('ease-out-cubic')).toBe(easeOutCubic)
      expect(getEasingFunction('ease-in-out-cubic')).toBe(easeInOutCubic)
    })

    it('should default to linear for undefined', () => {
      expect(getEasingFunction(undefined)).toBe(linear)
    })
  })
})

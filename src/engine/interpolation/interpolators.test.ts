import { describe, it, expect } from 'vitest'
import {
  interpolateNumber,
  interpolateColor,
  interpolateArray,
  getInterpolator,
} from './interpolators'

describe('interpolators', () => {
  describe('interpolateNumber', () => {
    it('should return from value when progress is 0', () => {
      expect(interpolateNumber(0, 100, 0)).toBe(0)
    })

    it('should return to value when progress is 1', () => {
      expect(interpolateNumber(0, 100, 1)).toBe(100)
    })

    it('should interpolate at midpoint', () => {
      expect(interpolateNumber(0, 100, 0.5)).toBe(50)
    })

    it('should handle negative values', () => {
      expect(interpolateNumber(-50, 50, 0.5)).toBe(0)
    })

    it('should handle decimal values', () => {
      expect(interpolateNumber(0.5, 1.5, 0.5)).toBe(1)
    })

    it('should handle reverse interpolation (from > to)', () => {
      expect(interpolateNumber(100, 0, 0.5)).toBe(50)
    })
  })

  describe('interpolateColor', () => {
    it('should return from color when progress is 0', () => {
      expect(interpolateColor('#000000', '#ffffff', 0)).toBe('#000000')
    })

    it('should return to color when progress is 1', () => {
      expect(interpolateColor('#000000', '#ffffff', 1)).toBe('#ffffff')
    })

    it('should interpolate to gray at midpoint', () => {
      const result = interpolateColor('#000000', '#ffffff', 0.5)
      expect(result.toLowerCase()).toBe('#808080')
    })

    it('should handle rgb() format', () => {
      expect(interpolateColor('rgb(0, 0, 0)', 'rgb(255, 255, 255)', 0.5)).toBe(
        'rgb(128, 128, 128)'
      )
    })

    it('should handle rgba() format', () => {
      const result = interpolateColor(
        'rgba(0, 0, 0, 0)',
        'rgba(255, 255, 255, 1)',
        0.5
      )
      expect(result).toBe('rgba(128, 128, 128, 0.5)')
    })

    it('should interpolate between different colors', () => {
      const result = interpolateColor('#ff0000', '#0000ff', 0.5)
      expect(result.toLowerCase()).toBe('#800080')
    })
  })

  describe('interpolateArray', () => {
    it('should return from array when progress is 0', () => {
      expect(interpolateArray([0, 0, 0], [100, 100, 100], 0)).toEqual([0, 0, 0])
    })

    it('should return to array when progress is 1', () => {
      expect(interpolateArray([0, 0, 0], [100, 100, 100], 1)).toEqual([
        100, 100, 100,
      ])
    })

    it('should interpolate each element', () => {
      expect(interpolateArray([0, 10, 20], [100, 110, 120], 0.5)).toEqual([
        50, 60, 70,
      ])
    })

    it('should handle arrays of different lengths (uses shorter)', () => {
      expect(interpolateArray([0, 0], [100, 100, 100], 0.5)).toEqual([50, 50])
    })
  })

  describe('getInterpolator', () => {
    it('should return number interpolator for numbers', () => {
      const interpolator = getInterpolator<number>(0)
      expect(interpolator(0, 100, 0.5)).toBe(50)
    })

    it('should return color interpolator for hex colors', () => {
      const interpolator = getInterpolator<string>('#ff0000')
      expect(interpolator('#000000', '#ffffff', 0.5).toLowerCase()).toBe(
        '#808080'
      )
    })

    it('should return color interpolator for rgb colors', () => {
      const interpolator = getInterpolator<string>('rgb(0,0,0)')
      expect(interpolator('rgb(0, 0, 0)', 'rgb(100, 100, 100)', 0.5)).toBe(
        'rgb(50, 50, 50)'
      )
    })

    it('should return array interpolator for arrays', () => {
      const interpolator = getInterpolator<number[]>([0, 0])
      expect(interpolator([0, 0], [100, 100], 0.5)).toEqual([50, 50])
    })

    it('should return string interpolator for other strings (no interpolation)', () => {
      const interpolator = getInterpolator<string>('block')
      expect(interpolator('block', 'none', 0)).toBe('block')
      expect(interpolator('block', 'none', 0.5)).toBe('block')
      expect(interpolator('block', 'none', 1)).toBe('none')
    })
  })
})

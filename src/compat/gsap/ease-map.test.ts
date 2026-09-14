import { describe, it, expect } from 'vitest'
import {
  mapEase,
  normaliseEaseName,
  easeRequiresBaking,
  elasticOut,
  bounceOut,
  bounceIn,
  steps,
} from './ease-map'
import { isCubicBezierEasing } from '../../engine'

describe('normaliseEaseName', () => {
  it('lowercases and trims', () => {
    expect(normaliseEaseName('  Power2.Out ')).toBe('power2.out')
  })

  it('accepts GSAP 2 spellings', () => {
    expect(normaliseEaseName('Power2.easeOut')).toBe('power2.out')
    expect(normaliseEaseName('Power2.easeInOut')).toBe('power2.inout')
  })

  it('defaults a bare family to out, as GSAP does', () => {
    expect(normaliseEaseName('power3')).toBe('power3.out')
    expect(normaliseEaseName('elastic')).toBe('elastic.out')
  })

  it('leaves linear and none alone', () => {
    expect(normaliseEaseName('none')).toBe('none')
    expect(normaliseEaseName('linear')).toBe('linear')
  })
})

describe('mapEase — serializable eases', () => {
  it('maps none and linear to linear', () => {
    expect(mapEase('none').easing).toBe('linear')
    expect(mapEase('linear').easing).toBe('linear')
  })

  it('prefers an exact built-in where one exists', () => {
    // GSAP's power1 is quadratic and power2 cubic (degree N+1).
    expect(mapEase('power1.out').easing).toBe('ease-out-quad')
    expect(mapEase('power2.out').easing).toBe('ease-out-cubic')
    expect(mapEase('power2.inout').easing).toBe('ease-in-out-cubic')
    // power3 is quartic, which has no built-in.
    expect(mapEase('power3.out').easing).toEqual({ type: 'cubic-bezier', points: [0.165, 0.84, 0.44, 1] })
  })

  it('falls back to a cubic-bezier for families we have no built-in for', () => {
    const sine = mapEase('sine.out').easing
    expect(isCubicBezierEasing(sine)).toBe(true)
  })

  it('maps every standard family to something serializable', () => {
    for (const family of ['power1', 'power2', 'power3', 'power4', 'sine', 'expo', 'circ', 'back']) {
      for (const direction of ['in', 'out', 'inout']) {
        const mapped = mapEase(`${family}.${direction}`)
        expect(mapped.easing, `${family}.${direction}`).toBeDefined()
        expect(mapped.requiresBaking).toBeUndefined()
      }
    }
  })

  it('produces JSON-serializable output', () => {
    const easing = mapEase('back.out').easing
    expect(JSON.parse(JSON.stringify(easing))).toEqual(easing)
  })

  it('falls back to ease-out for an unknown name rather than throwing', () => {
    expect(mapEase('wobble.sideways').easing).toBe('ease-out')
  })
})

describe('mapEase — parametric eases', () => {
  it('maps elastic to a parametric ease, with GSAP parameters', () => {
    expect(mapEase('elastic.out').easing).toEqual({ type: 'elastic', mode: 'out' })
    expect(mapEase('elastic.inOut(1.2, 0.4)').easing).toEqual({ type: 'elastic', mode: 'in-out', amplitude: 1.2, period: 0.4 })
    expect(mapEase('Elastic(2)').easing).toEqual({ type: 'elastic', mode: 'out', amplitude: 2 })
    expect(mapEase('elastic.out').fn).toBeTypeOf('function')
  })

  it('maps bounce and back with an overshoot', () => {
    expect(mapEase('bounce.in').easing).toEqual({ type: 'bounce', mode: 'in' })
    expect(mapEase('back.out(3)').easing).toEqual({ type: 'back', mode: 'out', overshoot: 3 })
    // A plain back ease keeps its exact cubic-bezier.
    expect(isCubicBezierEasing(mapEase('back.out').easing)).toBe(true)
  })

  it("maps steps(n) to GSAP's n + 1 levels", () => {
    expect(mapEase('steps(5)').easing).toEqual({ type: 'steps', count: 6, position: 'none' })
  })

  it('only registered custom curves still need sampling', () => {
    expect(easeRequiresBaking('elastic.out')).toBe(false)
    expect(easeRequiresBaking('steps(3)')).toBe(false)
    expect(easeRequiresBaking('power2.out')).toBe(false)
  })
})

describe('elasticOut', () => {
  const ease = elasticOut()

  it('starts at 0 and ends at 1', () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
  })

  it('overshoots — which is why no bezier can express it', () => {
    let peak = 0
    for (let t = 0; t <= 1; t += 0.01) peak = Math.max(peak, ease(t))
    expect(peak).toBeGreaterThan(1)
  })
})

describe('bounceOut', () => {
  it('starts at 0 and ends at 1', () => {
    expect(bounceOut(0)).toBe(0)
    expect(bounceOut(1)).toBeCloseTo(1, 10)
  })

  it('is never negative and never exceeds 1', () => {
    for (let t = 0; t <= 1; t += 0.01) {
      expect(bounceOut(t)).toBeGreaterThanOrEqual(0)
      expect(bounceOut(t)).toBeLessThanOrEqual(1.0001)
    }
  })

  it('reverses for bounceIn', () => {
    expect(bounceIn(0)).toBeCloseTo(0, 10)
    expect(bounceIn(1)).toBe(1)
  })

  it('changes direction — it is not monotonic', () => {
    // Sample densely and confirm at least one step goes backwards.
    let wentBackwards = false
    let previous = bounceOut(0)
    for (let t = 0.01; t <= 1; t += 0.01) {
      const value = bounceOut(t)
      if (value < previous - 1e-9) wentBackwards = true
      previous = value
    }
    expect(wentBackwards).toBe(true)
  })
})

describe('steps', () => {
  it('jumps in discrete increments', () => {
    const ease = steps(4)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
  })

  it('holds within a step: steps(4) has five levels, 0.2 apart in time', () => {
    const ease = steps(4)
    expect(ease(0.05)).toBe(ease(0.15))
    expect(ease(0.25)).toBe(0.25)
    expect(ease(0.85)).toBe(1)
  })

  it('never exceeds 1', () => {
    const ease = steps(3)
    for (let t = 0; t <= 1; t += 0.01) expect(ease(t)).toBeLessThanOrEqual(1)
  })

  it('treats a step count below 1 as 1', () => {
    expect(() => steps(0)(0.5)).not.toThrow()
  })
})

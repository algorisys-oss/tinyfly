import { describe, it, expect } from 'vitest'
import { loopEase, loopNoise, phaseOf, pingPong, torusNoise, wobble } from './periodic'

const P = 4000

describe('periodic helpers', () => {
  it('phase and ping-pong repeat exactly', () => {
    expect(phaseOf(0, P)).toBe(0)
    expect(phaseOf(P, P)).toBe(0)
    expect(phaseOf(1000, P)).toBeCloseTo(0.25, 12)
    expect(phaseOf(1000, P, 2)).toBeCloseTo(0.5, 12)
    expect(phaseOf(-500, P)).toBeCloseTo(0.875, 12)
    expect(pingPong(0)).toBe(0)
    expect(pingPong(0.5)).toBe(1)
    expect(pingPong(1)).toBe(0)
    expect(pingPong(0.25)).toBeCloseTo(0.5, 12)
  })

  it('wobble: whole cycles of a sine, triangle or square, the same at 0 and the period', () => {
    for (const shape of ['sine', 'triangle', 'square'] as const) {
      for (const cycles of [1, 2, 3]) {
        const at = (t: number) => wobble(t, { period: P, cycles, amplitude: 10, shape })
        expect(at(P), `${shape} ${cycles}`).toBeCloseTo(at(0), 9)
        expect(at(P + 700)).toBeCloseTo(at(700), 9)
        for (let t = 0; t < P; t += 37) expect(Math.abs(at(t))).toBeLessThanOrEqual(10 + 1e-9)
      }
    }
    expect(wobble(P / 4, { period: P })).toBeCloseTo(1, 12)
    expect(wobble(P / 4, { period: P, shape: 'triangle' })).toBeCloseTo(1, 12)
    expect(wobble(P / 8, { period: P, shape: 'triangle' })).toBeCloseTo(0.5, 12)
    expect(wobble(100, { period: P, shape: 'square' })).toBe(1)
    expect(wobble(P / 2 + 100, { period: P, shape: 'square' })).toBe(-1)
    expect(wobble(0, { period: P, phase: 0.25 })).toBeCloseTo(1, 12)
    // A fraction of a cycle would not repeat: it is rounded to whole cycles.
    expect(wobble(P, { period: P, cycles: 1.5 })).toBeCloseTo(wobble(0, { period: P, cycles: 1.5 }), 9)
  })

  it('loopEase goes 0 → 1 → 0 with the easing mirrored, and repeats', () => {
    const at = (t: number) => loopEase(t, { period: P, easing: 'ease-out' })
    expect(at(0)).toBe(0)
    expect(at(P / 2)).toBe(1)
    expect(at(P)).toBe(0)
    expect(at(P / 4)).toBeCloseTo(at((3 * P) / 4), 12)
    expect(at(P / 8)).toBeGreaterThan(0.25) // ease-out rises fast
    expect(loopEase(P / 8, { period: P, easing: (u) => u })).toBeCloseTo(0.25, 12)
    expect(loopEase(1000, { period: P, cycles: 2 })).toBe(1)
    expect(loopEase(2000, { period: P, cycles: 2 })).toBe(0)
  })

  it('loopNoise is smooth, bounded, seeded and closes exactly', () => {
    const at = (t: number, seed: number | string = 'wind') => loopNoise(t, { period: P, seed, octaves: 3 })
    expect(at(P)).toBeCloseTo(at(0), 12)
    expect(at(P + 123)).toBeCloseTo(at(123), 12)
    let last = at(0)
    let moved = 0
    for (let t = 16; t <= P; t += 16) {
      const v = at(t)
      expect(Math.abs(v)).toBeLessThanOrEqual(1)
      expect(Math.abs(v - last)).toBeLessThan(0.1) // no jumps at 60 fps
      moved += Math.abs(v - last)
      last = v
    }
    expect(moved).toBeGreaterThan(0.5)
    expect(at(700, 'wind')).toBe(at(700, 'wind'))
    expect(at(700, 'wind')).not.toBe(at(700, 'rain'))
    expect(at(700, 7)).not.toBe(at(700, 8))
    // More cycles wiggle more over the period.
    const travel = (cycles: number) => {
      let sum = 0
      for (let t = 16; t <= P; t += 16) sum += Math.abs(loopNoise(t, { period: P, seed: 1, cycles }) - loopNoise(t - 16, { period: P, seed: 1, cycles }))
      return sum
    }
    expect(travel(4)).toBeGreaterThan(travel(1))
  })

  it('torusNoise repeats in time and along its length', () => {
    const at = (t: number, s: number) => torusNoise(t, s, { period: P, periodAlong: 500, seed: 3, cycles: 2, cyclesAlong: 3 })
    expect(at(P, 120)).toBeCloseTo(at(0, 120), 12)
    expect(at(900, 500)).toBeCloseTo(at(900, 0), 12)
    expect(at(900, 620)).toBeCloseTo(at(900, 120), 12)
    expect(Math.abs(at(333, 77))).toBeLessThanOrEqual(1)
    expect(at(333, 77)).not.toBeCloseTo(at(333, 177), 3)
  })
})

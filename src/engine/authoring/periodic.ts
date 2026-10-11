import type { EasingFunction, EasingType } from '../types'
import { getEasingFunction } from '../interpolation/easing'
import { hashSeed } from './random'

/**
 * Motion that repeats exactly over a period, for videos that loop.
 *
 * A loop closes when the frame at time = duration is the first frame, so
 * every motion must repeat over the duration: a whole number of cycles, a
 * zoom that steps one level, noise that comes back to where it started. These
 * helpers are periodic by construction. Each takes the `period` in ms (a
 * looping video scene's `frame.period` is its duration) and gives the same
 * value at `time` and `time + period` to the last bit, so a loop check
 * reports "closes" rather than "seamless".
 *
 *     draw(ctx, frame) {
 *       const sway = wobble(frame.time, { period: frame.period, cycles: 2, amplitude: 12 })
 *       const drift = loopNoise(frame.time, { period: frame.period, seed: 'tree' }) * 30
 *     }
 *
 * Everything is a pure function of time: frames render in any order, and the
 * same scene gives the same video.
 */

/** Where in its cycle a periodic motion is at `time`: 0 (inclusive) to 1 (exclusive). `cycles` whole cycles per period. */
export function phaseOf(time: number, period: number, cycles = 1): number {
  if (!(period > 0)) return 0
  const u = (time * cycles) / period
  return u - Math.floor(u)
}

/** 0 → 1 → 0 over one unit: `u` in 0..1 goes up to 1 at 0.5 and back, the same at 0 and 1. */
export function pingPong(u: number): number {
  const v = u - Math.floor(u)
  return 1 - Math.abs(v * 2 - 1)
}

export interface WobbleOptions {
  /** The period, ms: the motion repeats exactly every `period` */
  period: number
  /** Whole cycles per period (default 1); a fraction would not repeat */
  cycles?: number
  /** Peak value (default 1): the result swings between −amplitude and +amplitude */
  amplitude?: number
  /** Start part way round the cycle, 0..1 (default 0) */
  phase?: number
  /** The wave: a sine (default), a triangle, or a square */
  shape?: 'sine' | 'triangle' | 'square'
}

/** A wave that repeats exactly every period: `cycles` whole cycles of a sine (or triangle, square). */
export function wobble(time: number, options: WobbleOptions): number {
  const cycles = Math.max(1, Math.round(options.cycles ?? 1))
  const amplitude = options.amplitude ?? 1
  const u = phaseOf(time, options.period, cycles) + (options.phase ?? 0)
  const v = u - Math.floor(u)
  switch (options.shape ?? 'sine') {
    case 'triangle':
      return amplitude * (pingPong(v + 0.25) * 2 - 1)
    case 'square':
      return v < 0.5 ? amplitude : -amplitude
    default:
      return amplitude * Math.sin(v * Math.PI * 2)
  }
}

export interface LoopEaseOptions {
  /** The period, ms */
  period: number
  /** Whole cycles per period (default 1) */
  cycles?: number
  /** Easing for the way up, mirrored on the way down (default `ease-in-out`): a name or a function */
  easing?: EasingType | EasingFunction
  /** Start part way round the cycle, 0..1 (default 0) */
  phase?: number
}

/**
 * An eased there-and-back: 0 at the start of each cycle, 1 half way, 0 again
 * at the end, the easing applied on the way up and mirrored on the way down.
 * Unlike an easing of `time / period`, it repeats exactly.
 */
export function loopEase(time: number, options: LoopEaseOptions): number {
  const cycles = Math.max(1, Math.round(options.cycles ?? 1))
  const ease = typeof options.easing === 'function' ? options.easing : getEasingFunction(options.easing ?? 'ease-in-out')
  const u = phaseOf(time, options.period, cycles) + (options.phase ?? 0)
  return ease(pingPong(u))
}

export interface LoopNoiseOptions {
  /** The period, ms */
  period: number
  /** The seed: a number or any string (default 0). Different seeds give unrelated motion */
  seed?: number | string
  /** How many wiggles per period (default 1): the noise's own cycles round its circle */
  cycles?: number
  /** Layers of finer, fainter detail (default 1, up to 6) */
  octaves?: number
  /** Start part way round (default 0) */
  phase?: number
}

/**
 * Smooth random motion that repeats exactly every period: value noise read
 * round a circle, so the end joins the start. About −1..1, seeded, and the
 * same for the same time, seed and options anywhere.
 */
export function loopNoise(time: number, options: LoopNoiseOptions): number {
  const seed = seedOf(options.seed)
  const cycles = Math.max(1, Math.round(options.cycles ?? 1))
  const angle = (phaseOf(time, options.period, 1) + (options.phase ?? 0)) * Math.PI * 2
  // The circle's radius sets how much the noise changes round it: a wiggle (up and down) is two lattice cells.
  const radius = cycles / Math.PI
  return fractal([Math.cos(angle) * radius + 7.31, Math.sin(angle) * radius + 3.17], seed, options.octaves ?? 1)
}

export interface TorusNoiseOptions {
  /** The period of the first input (time), ms */
  period: number
  /** The period of the second input (a position along something): the noise repeats along it too */
  periodAlong: number
  seed?: number | string
  /** Wiggles per period of time, and per period along (default 1 each) */
  cycles?: number
  cyclesAlong?: number
  octaves?: number
}

/**
 * Noise periodic in two inputs, read round a torus: a field along a line
 * (ripples, a flag, grass) that repeats over the loop's period in time and
 * joins up along its length. About −1..1.
 */
export function torusNoise(time: number, along: number, options: TorusNoiseOptions): number {
  const seed = seedOf(options.seed)
  const cycles = Math.max(1, Math.round(options.cycles ?? 1))
  const cyclesAlong = Math.max(1, Math.round(options.cyclesAlong ?? 1))
  const a = phaseOf(time, options.period, 1) * Math.PI * 2
  const b = phaseOf(along, options.periodAlong, 1) * Math.PI * 2
  const ra = cycles / Math.PI
  const rb = cyclesAlong / Math.PI
  return fractal([Math.cos(a) * ra + 5.13, Math.sin(a) * ra + 9.47, Math.cos(b) * rb + 2.71, Math.sin(b) * rb + 6.29], seed, options.octaves ?? 1)
}

const seedOf = (seed: number | string | undefined): number => (typeof seed === 'string' ? hashSeed(seed) : (seed ?? 0) >>> 0)

/** Octaves of lattice noise, each twice as fine and half as strong, scaled back to about −1..1. */
function fractal(point: number[], seed: number, octaves: number): number {
  const count = Math.max(1, Math.min(6, Math.round(octaves)))
  let sum = 0
  let weight = 1
  let total = 0
  for (let o = 0; o < count; o++) {
    const scale = 2 ** o
    sum += weight * latticeNoise(point.map((v) => v * scale), seed + o * 1013)
    total += weight
    weight *= 0.5
  }
  return sum / total
}

/**
 * Value noise on an integer lattice of any dimension: a hashed random value
 * at each corner, blended with a smoothstep. −1..1.
 */
function latticeNoise(point: number[], seed: number): number {
  const d = point.length
  const base = point.map(Math.floor)
  const frac = point.map((v, i) => v - base[i])
  const weights = frac.map((f) => f * f * (3 - 2 * f))
  let value = 0
  for (let corner = 0; corner < 1 << d; corner++) {
    let weight = 1
    const at: number[] = []
    for (let i = 0; i < d; i++) {
      const bit = (corner >> i) & 1
      weight *= bit ? weights[i] : 1 - weights[i]
      at.push(base[i] + bit)
    }
    if (weight === 0) continue
    value += weight * cornerValue(at, seed)
  }
  return value
}

/** A fixed random value in −1..1 at a lattice corner. */
function cornerValue(at: number[], seed: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0
  for (const v of at) {
    h = Math.imul(h ^ (v | 0), 0x85ebca6b) >>> 0
    h = (h ^ (h >>> 13)) >>> 0
    h = Math.imul(h, 0xc2b2ae35) >>> 0
    h = (h ^ (h >>> 16)) >>> 0
  }
  return (h / 0x100000000) * 2 - 1
}

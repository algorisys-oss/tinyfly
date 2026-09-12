/**
 * Seeded pseudo-random numbers.
 *
 * GSAP's `random()` is evaluated at runtime, which we cannot do: a value that
 * differs between runs is neither deterministic nor serializable. Instead we
 * resolve random values once at authoring time from a recorded seed, store the
 * concrete numbers in the JSON, and keep the seed so the same animation can be
 * regenerated identically.
 *
 * This is a small xorshift generator rather than a dependency — it is a dozen
 * lines and we only need repeatability, not statistical quality.
 */

/** Deterministic 0..1 generator. */
export interface RandomSource {
  /** Next value in [0, 1) */
  next(): number
  /** The seed this source was created with */
  readonly seed: number
}

/**
 * Turn any string into a 32-bit seed, so a project name or track id can be used
 * where a number is expected.
 */
export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Create a seeded generator. The same seed always yields the same sequence,
 * on any platform.
 */
export function createRandom(seed: number): RandomSource {
  // xorshift32 needs a non-zero state.
  let state = (seed >>> 0) || 0x9e3779b9

  return {
    seed: seed >>> 0,
    next(): number {
      state ^= state << 13
      state >>>= 0
      state ^= state >> 17
      state ^= state << 5
      state >>>= 0
      return state / 0x100000000
    },
  }
}

/** A value in [min, max), drawn from `source`. */
export function randomBetween(source: RandomSource, min: number, max: number): number {
  return min + source.next() * (max - min)
}

/**
 * A value in [min, max] snapped to a multiple of `step`, measured from `min`.
 * Mirrors GSAP's third `random()` argument.
 */
export function randomSnapped(
  source: RandomSource,
  min: number,
  max: number,
  step: number
): number {
  if (step <= 0) return randomBetween(source, min, max)

  const steps = Math.floor((max - min) / step)
  const chosen = Math.round(source.next() * steps)
  return min + chosen * step
}

/** One item from `items`, drawn from `source`. */
export function randomChoice<T>(source: RandomSource, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(source.next() * items.length)]
}

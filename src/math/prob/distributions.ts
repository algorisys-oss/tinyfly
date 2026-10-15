import { createRandom, hashSeed, randomNormal, type RandomSource } from '../../engine/authoring/random'

/**
 * Probability distributions as plain data, `{ kind, …parameters }`, with
 * their density (or mass), mean, spread and a seeded sampler. Discrete ones
 * take whole-number values. Pure: samples come from a seed, never from
 * Math.random, so a histogram fills the same way every time it plays.
 */
export type Distribution =
  | { kind: 'normal'; mean?: number; sd?: number }
  | { kind: 'uniform'; min?: number; max?: number }
  | { kind: 'exponential'; rate?: number }
  | { kind: 'binomial'; n: number; p: number }
  | { kind: 'poisson'; rate: number }
  /** The number of heads in `count` fair coin tosses is binomial; this is the total of `count` fair dice */
  | { kind: 'dice'; count?: number; sides?: number }
  /** The mean of `count` draws of another distribution: the central limit theorem's subject */
  | { kind: 'mean'; of: Distribution; count: number }

export type DistributionKind = Distribution['kind']
export const DISTRIBUTION_KINDS: readonly DistributionKind[] = ['normal', 'uniform', 'exponential', 'binomial', 'poisson', 'dice', 'mean']

/** The whole numbers a discrete distribution can take, [low, high] (high may be Infinity). */
export function supportOf(d: Distribution): [number, number] {
  switch (d.kind) {
    case 'binomial': return [0, d.n]
    case 'dice': return [d.count ?? 2, (d.count ?? 2) * (d.sides ?? 6)]
    case 'poisson': return [0, Infinity]
    default: return [-Infinity, Infinity]
  }
}

/** True for distributions on whole numbers (drawn as bars, not a curve). */
export function isDiscrete(d: Distribution): boolean {
  return d.kind === 'binomial' || d.kind === 'poisson' || d.kind === 'dice'
}

const logFactorial = (() => {
  const table = [0]
  return (n: number) => {
    for (let k = table.length; k <= n; k++) table[k] = table[k - 1] + Math.log(k)
    return table[n]
  }
})()

const choose = (n: number, k: number) => Math.exp(logFactorial(n) - logFactorial(k) - logFactorial(n - k))

/** The density (continuous) or probability mass (discrete) at x. */
export function density(d: Distribution, x: number): number {
  switch (d.kind) {
    case 'normal': {
      const { mean = 0, sd = 1 } = d
      return Math.exp(-(((x - mean) / sd) ** 2) / 2) / (sd * Math.sqrt(2 * Math.PI))
    }
    case 'uniform': {
      const { min = 0, max = 1 } = d
      return x >= min && x <= max ? 1 / (max - min) : 0
    }
    case 'exponential': {
      const { rate = 1 } = d
      return x < 0 ? 0 : rate * Math.exp(-rate * x)
    }
    case 'binomial': {
      if (!Number.isInteger(x) || x < 0 || x > d.n) return 0
      return choose(d.n, x) * d.p ** x * (1 - d.p) ** (d.n - x)
    }
    case 'poisson': {
      if (!Number.isInteger(x) || x < 0) return 0
      return Math.exp(x * Math.log(d.rate) - d.rate - logFactorial(x))
    }
    case 'dice': {
      // Ways to roll a total of x with `count` dice of `sides` faces, by inclusion–exclusion.
      const { count = 2, sides = 6 } = d
      if (!Number.isInteger(x) || x < count || x > count * sides) return 0
      let ways = 0
      for (let k = 0; k <= Math.floor((x - count) / sides); k++) {
        ways += (k % 2 ? -1 : 1) * choose(count, k) * choose(x - sides * k - 1, count - 1)
      }
      return ways / sides ** count
    }
    case 'mean': {
      // One draw is the distribution itself; more average toward normal (the
      // central limit theorem), with the same mean and sd / √count.
      if (d.count === 1) return density(d.of, x)
      return density({ kind: 'normal', mean: meanOf(d.of), sd: sdOf(d.of) / Math.sqrt(d.count) }, x)
    }
  }
}

export function meanOf(d: Distribution): number {
  switch (d.kind) {
    case 'normal': return d.mean ?? 0
    case 'uniform': return ((d.min ?? 0) + (d.max ?? 1)) / 2
    case 'exponential': return 1 / (d.rate ?? 1)
    case 'binomial': return d.n * d.p
    case 'poisson': return d.rate
    case 'dice': return ((d.count ?? 2) * ((d.sides ?? 6) + 1)) / 2
    case 'mean': return meanOf(d.of)
  }
}

export function sdOf(d: Distribution): number {
  switch (d.kind) {
    case 'normal': return d.sd ?? 1
    case 'uniform': return ((d.max ?? 1) - (d.min ?? 0)) / Math.sqrt(12)
    case 'exponential': return 1 / (d.rate ?? 1)
    case 'binomial': return Math.sqrt(d.n * d.p * (1 - d.p))
    case 'poisson': return Math.sqrt(d.rate)
    case 'dice': return Math.sqrt(((d.count ?? 2) * ((d.sides ?? 6) ** 2 - 1)) / 12)
    case 'mean': return sdOf(d.of) / Math.sqrt(d.count)
  }
}

/** One draw. */
export function sample(d: Distribution, source: RandomSource): number {
  switch (d.kind) {
    case 'normal': return randomNormal(source, d.mean ?? 0, d.sd ?? 1)
    case 'uniform': return (d.min ?? 0) + source.next() * ((d.max ?? 1) - (d.min ?? 0))
    case 'exponential': return -Math.log(1 - source.next()) / (d.rate ?? 1)
    case 'binomial': {
      let heads = 0
      for (let i = 0; i < d.n; i++) if (source.next() < d.p) heads++
      return heads
    }
    case 'poisson': {
      // Knuth's method: fine for teaching-sized rates.
      const limit = Math.exp(-d.rate)
      let k = 0
      let product = source.next()
      while (product > limit) {
        k++
        product *= source.next()
      }
      return k
    }
    case 'dice': {
      let total = 0
      for (let i = 0; i < (d.count ?? 2); i++) total += 1 + Math.floor(source.next() * (d.sides ?? 6))
      return total
    }
    case 'mean': {
      let total = 0
      for (let i = 0; i < d.count; i++) total += sample(d.of, source)
      return total / d.count
    }
  }
}

const SAMPLES = new Map<string, number[]>()

/**
 * The first `count` draws from `d` with `seed`. Asking for more continues
 * the same sequence, so a histogram that grows from 10 to 1000 samples keeps
 * its first 10. Cached by distribution and seed.
 */
export function samples(d: Distribution, seed: number | string, count: number): number[] {
  const key = `${JSON.stringify(d)}|${seed}`
  let list = SAMPLES.get(key)
  if (!list) {
    list = []
    if (SAMPLES.size > 64) SAMPLES.clear()
    SAMPLES.set(key, list)
  }
  if (list.length < count) {
    // Regenerate from the start so the sequence never depends on what was asked first.
    const source = createRandom(typeof seed === 'number' ? seed : hashSeed(seed))
    const fresh: number[] = []
    for (let i = 0; i < count; i++) fresh.push(sample(d, source))
    list.splice(0, list.length, ...fresh)
  }
  return list.slice(0, count)
}

/** Checks a distribution's parameters; returns a message, or undefined when it is fine. */
export function distributionProblem(d: Distribution): string | undefined {
  if (!d || typeof d !== 'object' || !DISTRIBUTION_KINDS.includes(d.kind)) return `kind must be one of ${DISTRIBUTION_KINDS.join(', ')}`
  const positive = (v: number | undefined, name: string) => (v !== undefined && !(v > 0) ? `${name} must be positive` : undefined)
  switch (d.kind) {
    case 'normal': return positive(d.sd, 'sd')
    case 'uniform': return (d.max ?? 1) > (d.min ?? 0) ? undefined : 'max must be greater than min'
    case 'exponential': return positive(d.rate, 'rate')
    case 'binomial': return Number.isInteger(d.n) && d.n >= 0 && d.n <= 1000 && d.p >= 0 && d.p <= 1 ? undefined : 'n must be a whole number 0..1000 and p in 0..1'
    case 'poisson': return d.rate > 0 && d.rate <= 200 ? undefined : 'rate must be in (0, 200]'
    case 'dice': return Number.isInteger(d.count ?? 2) && (d.count ?? 2) >= 1 && (d.count ?? 2) <= 50 && Number.isInteger(d.sides ?? 6) && (d.sides ?? 6) >= 2 ? undefined : 'count must be 1..50 and sides a whole number ≥ 2'
    case 'mean': return Number.isInteger(d.count) && d.count >= 1 && d.count <= 200 ? distributionProblem(d.of) : 'count must be a whole number 1..200'
  }
}

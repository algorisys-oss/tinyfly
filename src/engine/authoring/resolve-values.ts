import type { AnimatableValue } from '../types'
import { createRandom, randomBetween, randomSnapped, type RandomSource } from './random'

/**
 * Compile-time resolution of relative and random property values.
 *
 * GSAP resolves `"+=100"` and `random(-50, 50)` when a tween runs. We resolve
 * them when the timeline is *built*, and store the concrete number. Two rules
 * fall out of the project's principles:
 *
 *   - Determinism: a timeline must replay identically, so nothing may be
 *     re-rolled per run or per loop (GSAP's `repeatRefresh` has no equivalent).
 *   - JSON-first: what lands in the file is a plain number, not an expression,
 *     so any player can read it without an expression evaluator.
 *
 * The seed is kept alongside so regenerating the same animation reproduces the
 * same "random" values.
 */

/** A value that still needs resolving: a number, or an expression string. */
export type UnresolvedValue = AnimatableValue | string

export interface ResolveContext {
  /**
   * The value this property currently holds — what a relative expression is
   * measured against. Defaults to 0.
   */
  base?: number
  /** Source for random expressions. Required only if random values are used. */
  random?: RandomSource
}

const RELATIVE_PATTERN = /^([+\-*/])=\s*(-?[\d.]+)$/
const RANDOM_PATTERN = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i

/** Whether a value needs resolving at all. */
export function isUnresolved(value: UnresolvedValue): value is string {
  if (typeof value !== 'string') return false
  return RELATIVE_PATTERN.test(value.trim()) || RANDOM_PATTERN.test(value.trim())
}

/**
 * Resolve one value to a concrete number.
 *
 * Non-expression values pass through untouched, so this is safe to run over
 * every keyframe regardless of what it holds (colours, paths, arrays).
 */
export function resolveValue(
  value: UnresolvedValue,
  context: ResolveContext = {}
): AnimatableValue {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()

  const relative = RELATIVE_PATTERN.exec(trimmed)
  if (relative) {
    const [, operator, amountText] = relative
    const base = context.base ?? 0
    const amount = Number.parseFloat(amountText)

    switch (operator) {
      case '+':
        return base + amount
      case '-':
        return base - amount
      case '*':
        return base * amount
      case '/':
        // Division by zero would poison the timeline with Infinity; leaving the
        // base untouched is the least surprising escape.
        return amount === 0 ? base : base / amount
    }
  }

  const random = RANDOM_PATTERN.exec(trimmed)
  if (random) {
    if (!context.random) {
      throw new Error(
        `resolveValue: "${trimmed}" needs a random source — pass one via context.random`
      )
    }

    const min = Number.parseFloat(random[1])
    const max = Number.parseFloat(random[2])
    const step = random[3] !== undefined ? Number.parseFloat(random[3]) : undefined

    return step !== undefined
      ? randomSnapped(context.random, min, max, step)
      : randomBetween(context.random, min, max)
  }

  // An ordinary string (a colour, a path) — nothing to do.
  return value
}

/**
 * Resolve a whole keyframe sequence for one property, threading each resolved
 * value forward as the base for the next.
 *
 * This is what makes a chain like `['+=100', '+=100']` mean "200 by the end"
 * rather than "100 twice".
 */
export function resolveSequence(
  values: UnresolvedValue[],
  startValue = 0,
  random?: RandomSource
): AnimatableValue[] {
  const out: AnimatableValue[] = []
  let base = startValue

  for (const value of values) {
    const resolved = resolveValue(value, { base, random })
    out.push(resolved)
    if (typeof resolved === 'number') base = resolved
  }

  return out
}

/**
 * A resolver bound to one seed. Create it once per authoring session so every
 * random value in a timeline comes from the same reproducible sequence.
 */
export class ValueResolver {
  readonly random: RandomSource

  constructor(seed: number) {
    this.random = createRandom(seed)
  }

  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed(): number {
    return this.random.seed
  }

  resolve(value: UnresolvedValue, base = 0): AnimatableValue {
    return resolveValue(value, { base, random: this.random })
  }

  resolveSequence(values: UnresolvedValue[], startValue = 0): AnimatableValue[] {
    return resolveSequence(values, startValue, this.random)
  }
}

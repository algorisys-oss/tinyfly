import { getInterpolator, maxStaggerDistance, staggerOffset, type AnimatableValue, type StaggerFrom } from '../../engine'

/**
 * `live.utils` — GSAP's utility functions, as pure functions.
 *
 * Like GSAP, most of them return a reusable function when the last argument is
 * left out: `const toPercent = utils.mapRange(0, 800, 0, 100)`.
 *
 * **Randomness is seeded.** `random`, `shuffle` and `"random(…)"` strings draw from
 * one sequence that starts from `seed` (default 1), so a page builds the same
 * "random" layout every time it loads and a replay is identical — the engine's
 * determinism rule. Call `utils.seed(Date.now())` if you do want it to differ.
 */

export type Snap = number | number[] | { values: number[]; radius?: number } | { increment: number; radius?: number }

/** A small, fast seeded generator (mulberry32). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** `"random(-100, 100, 5)"` or `"random([1, 2, 3])"`, as GSAP accepts in tween vars. */
const RANDOM_STRING = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/

export function isRandomString(value: unknown): value is string {
  return typeof value === 'string' && RANDOM_STRING.test(value)
}

export interface LiveUtils {
  clamp(min: number, max: number): (value: number) => number
  clamp(min: number, max: number, value: number): number
  mapRange(inMin: number, inMax: number, outMin: number, outMax: number): (value: number) => number
  mapRange(inMin: number, inMax: number, outMin: number, outMax: number, value: number): number
  normalize(min: number, max: number): (value: number) => number
  normalize(min: number, max: number, value: number): number
  interpolate<T extends AnimatableValue | Record<string, AnimatableValue>>(start: T, end: T): (progress: number) => T
  interpolate<T extends AnimatableValue | Record<string, AnimatableValue>>(start: T, end: T, progress: number): T
  wrap(min: number, max: number): (value: number) => number
  wrap(min: number, max: number, value: number): number
  wrap<T>(values: T[]): (index: number) => T
  wrap<T>(values: T[], index: number): T
  wrapYoyo(min: number, max: number): (value: number) => number
  wrapYoyo(min: number, max: number, value: number): number
  snap(snap: Snap): (value: number) => number
  snap(snap: Snap, value: number): number
  random(min: number, max: number, snapIncrement?: number): number
  random(min: number, max: number, snapIncrement: number | undefined, returnFunction: true): () => number
  random<T>(values: T[]): T
  random<T>(values: T[], returnFunction: true): () => T
  shuffle<T>(values: T[]): T[]
  distribute(config: { base?: number; amount?: number; each?: number; from?: StaggerFrom; ease?: (t: number) => number }): (index: number, target: unknown, targets: ArrayLike<unknown>) => number
  pipe<T>(...functions: Array<(value: T) => T>): (value: T) => T
  splitColor(color: string): [number, number, number] | [number, number, number, number]
  getUnit(value: string | number): string
  /** Start the random sequence again from `value` */
  seed(value: number): void
  /** Resolve a `"random(…)"` string to a value (used by tween vars) */
  resolveRandomString(value: string): unknown
}

export function createUtils(initialSeed = 1): LiveUtils {
  let next = seededRandom(initialSeed)

  const curry = <A extends unknown[], R>(arity: number, fn: (...args: A) => R) =>
    ((...args: unknown[]) => (args.length >= arity ? fn(...(args as A)) : (value: unknown) => fn(...([...args, value] as A)))) as never

  const clamp = (min: number, max: number, value: number) => Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))
  const mapRange = (inMin: number, inMax: number, outMin: number, outMax: number, value: number) =>
    inMax === inMin ? outMin : outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)

  const snapTo = (snap: Snap, value: number): number => {
    if (typeof snap === 'number') return snap === 0 ? value : Math.round(value / snap) * snap
    if (Array.isArray(snap)) return nearest(snap, value, Infinity)
    if ('values' in snap) return nearest(snap.values, value, snap.radius ?? Infinity)
    const snapped = Math.round(value / snap.increment) * snap.increment
    return Math.abs(snapped - value) <= (snap.radius ?? Infinity) ? snapped : value
  }

  const randomBetween = (min: number, max: number, snapIncrement?: number) => {
    const value = min + next() * (max - min)
    return snapIncrement ? Math.round(value / snapIncrement) * snapIncrement : value
  }

  const utils: LiveUtils = {
    clamp: curry(3, clamp),
    mapRange: curry(5, mapRange),
    normalize: curry(3, (min: number, max: number, value: number) => mapRange(min, max, 0, 1, value)),
    interpolate: curry(3, (start: AnimatableValue | Record<string, AnimatableValue>, end: AnimatableValue | Record<string, AnimatableValue>, progress: number) => {
      if (typeof start === 'object' && !Array.isArray(start)) {
        const out: Record<string, AnimatableValue> = {}
        for (const key of Object.keys(start)) {
          out[key] = getInterpolator(start[key])(start[key], (end as Record<string, AnimatableValue>)[key], progress)
        }
        return out
      }
      return getInterpolator(start as AnimatableValue)(start as AnimatableValue, end as AnimatableValue, progress)
    }),
    wrap: ((first: number | unknown[], second?: number, third?: number) => {
      if (Array.isArray(first)) {
        const values = first
        const at = (index: number) => values[((Math.round(index) % values.length) + values.length) % values.length]
        return second === undefined ? at : at(second)
      }
      const min = first
      const max = second!
      const range = max - min
      const at = (value: number) => (range === 0 ? min : ((((value - min) % range) + range) % range) + min)
      return third === undefined ? at : at(third)
    }) as LiveUtils['wrap'],
    wrapYoyo: curry(3, (min: number, max: number, value: number) => {
      const range = max - min
      if (range === 0) return min
      const cycle = ((((value - min) % (range * 2)) + range * 2) % (range * 2))
      return min + (cycle > range ? range * 2 - cycle : cycle)
    }),
    snap: curry(2, snapTo),
    random: ((first: number | unknown[], second?: number | boolean, third?: number, fourth?: boolean) => {
      if (Array.isArray(first)) {
        const pick = () => first[Math.floor(next() * first.length)]
        return second === true ? pick : pick()
      }
      const draw = () => randomBetween(first, second as number, third)
      return fourth ? draw : draw()
    }) as LiveUtils['random'],
    shuffle: (values) => {
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[values[i], values[j]] = [values[j], values[i]]
      }
      return values
    },
    distribute: ({ base = 0, amount, each, from = 'start', ease }) => (index, _target, targets) => {
      const count = targets.length
      const spread = amount !== undefined ? { amount } : { each: each ?? 1 }
      const offset = staggerOffset(index, count, { ...spread, from })
      const max = amount !== undefined ? amount : (each ?? 1) * maxStaggerDistance(count, from)
      const eased = ease && max > 0 ? ease(offset / max) * max : offset
      return base + eased
    },
    pipe: (...functions) => (value) => functions.reduce((result, fn) => fn(result), value),
    splitColor: (color) => splitColor(color),
    getUnit: (value) => (typeof value === 'number' ? '' : (/^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(value.trim())?.[1] ?? '')),
    seed: (value) => {
      next = seededRandom(value)
    },
    resolveRandomString: (value) => {
      const inner = RANDOM_STRING.exec(value)?.[1] ?? ''
      if (inner.startsWith('[')) {
        const items = inner.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)
        const values = items.map((item) => (Number.isFinite(Number(item)) ? Number(item) : item.replace(/^['"]|['"]$/g, '')))
        return values[Math.floor(next() * values.length)]
      }
      const [min, max, snapIncrement] = inner.split(',').map((part) => Number.parseFloat(part))
      return randomBetween(min, max, Number.isFinite(snapIncrement) ? snapIncrement : undefined)
    },
  }
  return utils
}

function nearest(values: number[], value: number, radius: number): number {
  let best = value
  let distance = Infinity
  for (const candidate of values) {
    const d = Math.abs(candidate - value)
    if (d < distance) {
      distance = d
      best = candidate
    }
  }
  return distance <= radius ? best : value
}

/** `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()` as channel numbers (alpha 0–1 when given). */
function splitColor(color: string): [number, number, number] | [number, number, number, number] {
  const text = color.trim()
  const hex = /^#([0-9a-f]{3,8})$/i.exec(text)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join('') : hex
    const channels = full.match(/../g)!.map((pair) => Number.parseInt(pair, 16))
    return channels.length >= 4 ? [channels[0], channels[1], channels[2], Math.round((channels[3] / 255) * 1000) / 1000] : [channels[0], channels[1], channels[2]]
  }
  const numbers = (/rgba?\(([^)]+)\)/i.exec(text)?.[1] ?? '0,0,0').split(/[\s,/]+/).filter(Boolean).map((part) => Number.parseFloat(part))
  return numbers.length >= 4 ? [numbers[0], numbers[1], numbers[2], numbers[3]] : [numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0]
}
